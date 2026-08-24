import os
import pycountry
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from motor.motor_asyncio import AsyncIOMotorClient
from models import StudentRequest, GeneratedPlan, UserCreate, UserLogin, UserResponse, ChatRequest, Token, SubscriptionRequest
from ai_service import generate_student_plan, answer_chat_query, get_dynamic_country_data
import auth
from auth import get_password_hash, verify_password, create_access_token
import jwt
from dotenv import load_dotenv

load_dotenv()

db_client = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_client
    mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    try:
        db_client = AsyncIOMotorClient(mongodb_uri, serverSelectionTimeoutMS=2000)
        await db_client.admin.command('ping')
        print("Connected to MongoDB!")
    except Exception as e:
        print(f"Warning: Failed to connect to MongoDB, running without DB saving: {e}")
        db_client = None
    yield
    if db_client:
        db_client.close()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    if db_client is None:
        return None
    return db_client.eduglobal

@app.get("/")
def read_root():
    return {"message": "EduGlobal AI Backend API is running V2."}

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    db = get_db()
    if db is not None:
        user = await db.users.find_one({"email": email})
        if user:
            return user
    return {"email": email}

# AUTH ENDPOINTS
@app.post("/signup", response_model=Token)
async def signup(user: UserCreate):
    db = get_db()
    if db is not None:
        existing = await db.users.find_one({"email": user.email})
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        hashed_pw = get_password_hash(user.password)
        new_user = {"name": user.name, "email": user.email, "hashed_password": hashed_pw}
        await db.users.insert_one(new_user)
        
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/login", response_model=Token)
async def login(user: UserLogin):
    db = get_db()
    if db is not None:
        db_user = await db.users.find_one({"email": user.email})
        if not db_user or not verify_password(user.password, db_user["hashed_password"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
            
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# DYNAMIC DATA ENDPOINTS
@app.get("/countries")
async def get_countries():
    # Return all official countries
    countries = sorted([country.name for country in pycountry.countries])
    return {"countries": countries}

@app.get("/cities/{country}")
async def get_cities(country: str):
    db = get_db()
    if db is not None:
        stored = await db.countries.find_one({"country": country})
        if stored and "cities" in stored:
            return {"cities": stored["cities"]}
            
    data = get_dynamic_country_data(country)
    if db is not None and data.get("cities"):
        await db.countries.update_one({"country": country}, {"$set": {"cities": data["cities"]}}, upsert=True)
    return {"cities": data.get("cities", [])}

@app.get("/universities/{country}")
async def get_universities(country: str):
    db = get_db()
    if db is not None:
        stored = await db.countries.find_one({"country": country})
        if stored and "universities" in stored:
            return {"universities": stored["universities"]}
            
    data = get_dynamic_country_data(country)
    if db is not None and data.get("universities"):
        await db.countries.update_one({"country": country}, {"$set": {"universities": data["universities"]}}, upsert=True)
    return {"universities": data.get("universities", [])}

@app.get("/global-universities")
async def get_global_universities():
    # Return a curated list of top global universities across popular countries
    top_unis = [
        "Massachusetts Institute of Technology (MIT) - US",
        "Harvard University - US",
        "Stanford University - US",
        "University of Oxford - UK",
        "University of Cambridge - UK",
        "ETH Zurich - Switzerland",
        "Imperial College London - UK",
        "UCL (University College London) - UK",
        "University of Toronto - Canada",
        "National University of Singapore (NUS) - Singapore",
        "University of Melbourne - Australia",
        "Technical University of Munich - Germany",
        "University of Tokyo - Japan",
        "Sorbonne University - France",
        "University of Sydney - Australia",
        "McGill University - Canada",
        "Tsinghua University - China",
        "University of Amsterdam - Netherlands"
    ]
    return {"universities": sorted(top_unis)}

@app.post("/subscribe")
async def subscribe(req: SubscriptionRequest, user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
        
    valid_plans = ["Basic", "Pro", "Full Service"]
    if req.plan_type not in valid_plans:
        raise HTTPException(status_code=400, detail="Invalid plan type")
        
    subscription_data = {
        "plan_type": req.plan_type,
        "start_date": datetime.utcnow().isoformat(),
        "status": "active"
    }
    
    await db.users.update_one(
        {"email": user["email"]},
        {"$set": {"subscription": subscription_data}}
    )
    
    return {"message": f"Successfully subscribed to {req.plan_type} plan"}

# AI WORKFLOW ENDPOINTS
@app.post("/generate-plan", response_model=GeneratedPlan)
async def generate_plan_endpoint(request: StudentRequest, user: dict = Depends(get_current_user)):
    db = get_db()
    if db is not None:
        db_user = await db.users.find_one({"email": user["email"]})
        if db_user:
            plan_type = db_user.get("subscription", {}).get("plan_type", "Basic")
            
            if plan_type == "Basic":
                current_month = datetime.utcnow().strftime("%Y-%m")
                usage_count = db_user.get("usage", {}).get(current_month, 0)
                if usage_count >= 3:
                    raise HTTPException(status_code=403, detail="Basic plan limit reached (3 generations/month). Please upgrade your plan.")
                
                await db.users.update_one(
                    {"email": user["email"]},
                    {"$inc": {f"usage.{current_month}": 1}}
                )

        try:
            request_data = request.model_dump()
            request_data["user_email"] = user["email"]
            await db.student_requests.insert_one(request_data)
        except Exception as e:
            print(f"Failed to save request: {e}")
            
    try:
        plan = generate_student_plan(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate plan: {str(e)}")
        
    if db is not None:
        try:
            plan_dict = plan.model_dump()
            plan_dict["request_query"] = request.model_dump()
            plan_dict["user_email"] = user["email"]
            await db.generated_plans.insert_one(plan_dict)
        except Exception as e:
            print(f"Failed to save generated plan: {e}")

    return plan

@app.post("/chat")
async def chat_endpoint(request: ChatRequest, user: dict = Depends(get_current_user)):
    reply = answer_chat_query(request)
    
    db = get_db()
    if db is not None:
        try:
            # Store chat log
            chat_record = {
                "user_message": request.message,
                "ai_reply": reply,
                "history_length": len(request.history),
                "user_email": user["email"]
            }
            await db.chat_history.insert_one(chat_record)
        except Exception as e:
            print(f"Db insert failed: {e}")
            
    return {"reply": reply}

