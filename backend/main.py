import os
from pathlib import Path
from typing import Optional
import pycountry
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from motor.motor_asyncio import AsyncIOMotorClient
from models import (
    StudentRequest,
    GeneratedPlan,
    UserCreate,
    UserLogin,
    UserResponse,
    ChatRequest,
    Token,
    SubscriptionRequest
)
from ai_service import generate_student_plan, answer_chat_query, get_dynamic_country_data
import auth
from auth import get_password_hash, verify_password, create_access_token, decode_access_token
from dotenv import load_dotenv

# Ensure .env is loaded from backend directory
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

db_client = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_client
    mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    try:
        db_client = AsyncIOMotorClient(mongodb_uri, serverSelectionTimeoutMS=4000)
        await db_client.admin.command('ping')
        print("Connected to MongoDB Atlas!")
    except Exception as e:
        print(f"Warning: Failed to connect to MongoDB: {e}")
        db_client = None
    yield
    if db_client:
        db_client.close()

app = FastAPI(title="EduGlobal AI Backend API", version="2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "EduGlobal AI Backend API is running V2."}

def get_db():
    if db_client is None:
        return None
    return db_client.eduglobal

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login", auto_error=False)

async def get_current_user(token: Optional[str] = Depends(oauth2_scheme)):
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = decode_access_token(token)
    if not payload or not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    email = payload.get("sub").strip().lower()
    name = payload.get("name", "")
    
    db = get_db()
    if db is not None:
        user = await db.users.find_one({"email": email})
        if user:
            return user
            
    return {"email": email, "name": name, "_id": ""}

# AUTH ENDPOINTS
@app.post("/signup", response_model=Token)
async def signup(user: UserCreate):
    name = user.name.strip()
    email = user.email.strip().lower()
    password = user.password

    if not name:
        raise HTTPException(status_code=400, detail="Name is required")
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="A valid email address is required")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    db = get_db()
    user_id = ""
    default_subscription = {
        "plan_type": "Basic",
        "start_date": datetime.now(timezone.utc).isoformat(),
        "status": "active"
    }

    if db is not None:
        existing = await db.users.find_one({"email": email})
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        hashed_pw = get_password_hash(password)
        new_user = {
            "name": name,
            "email": email,
            "hashed_password": hashed_pw,
            "subscription": default_subscription,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        res = await db.users.insert_one(new_user)
        user_id = str(res.inserted_id)
    else:
        # If DB temporarily unavailable, raise error to protect data integrity
        raise HTTPException(status_code=503, detail="Database service temporarily unavailable")

    access_token = create_access_token(data={"sub": email, "name": name})
    user_response = UserResponse(
        id=user_id,
        name=name,
        email=email,
        subscription=default_subscription
    )
    return {"access_token": access_token, "token_type": "bearer", "user": user_response}

@app.post("/login", response_model=Token)
async def login(user: UserLogin):
    email = user.email.strip().lower()
    password = user.password

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")

    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database service temporarily unavailable")

    db_user = await db.users.find_one({"email": email})
    if not db_user or not verify_password(password, db_user.get("hashed_password", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    name = db_user.get("name", email.split("@")[0])
    access_token = create_access_token(data={"sub": email, "name": name})
    user_response = UserResponse(
        id=str(db_user.get("_id", "")),
        name=name,
        email=email,
        subscription=db_user.get("subscription", {"plan_type": "Basic"})
    )
    return {"access_token": access_token, "token_type": "bearer", "user": user_response}

@app.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user.get("_id", "")),
        name=current_user.get("name", ""),
        email=current_user.get("email", ""),
        subscription=current_user.get("subscription", {"plan_type": "Basic", "status": "active"})
    )

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
        "start_date": datetime.now(timezone.utc).isoformat(),
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
                current_month = datetime.now(timezone.utc).strftime("%Y-%m")
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
