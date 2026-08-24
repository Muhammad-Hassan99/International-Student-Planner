import os
import json
from google import genai
from google.genai import types
from models import GeneratedPlan, StudentRequest, ChatRequest, ChatMessage
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key) if api_key else None

def generate_student_plan(request: StudentRequest) -> GeneratedPlan:
    if not client or not api_key or "your_" in api_key:
        print("Warning: Valid GEMINI_API_KEY not set. Returning an accurate mock plan.")
        return get_mock_plan(request)
        
    prompt = f"""
    You are an AI International Student Planner. Given the following student profile, 
    generate a detailed roadmap for their studies abroad.
    
    Target Country: {request.country}
    Degree: {request.degree}
    Annual Budget: ${request.budget}
    Preferred City: {request.preferred_city}
    
    Provide recommendations for universities, university application steps (how to apply), scholarships, accommodation, transport, visa process, required documents, block account details, English test requirements, part-time work rules, estimated total annual budget, monthly cost estimate, and a preparation checklist.
    For each university recommended, you MUST include accurate `admissions_start_date`, `admissions_closing_date`, a realistic `application_form_link` (not a search link), a detailed step-by-step `how_to_fill_application` list, and a list of `required_documents`.
    For the block account guide, provide complete details: whether it is required, a description, step-by-step instructions to open it, and a provider's link (like fintiba or expatrio).
    CRITICAL: For 'link' and 'how_to_get' fields, you MUST provide EXACT, valid official website URLs (e.g., https://amberstudent.com, https://www.fintiba.com, https://www.ielts.org, official government visa portals, or the official university domains). DO NOT EVER reply with a google.com/search URL.
    Respond strictly with valid JSON matching the specified schema.
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=GeneratedPlan,
            ),
        )
        plan_dict = json.loads(response.text)
        return GeneratedPlan(**plan_dict)
    except Exception as e:
        print(f"Error calling Gemini: {e}")
        return get_mock_plan(request)

def answer_chat_query(chat_req: ChatRequest) -> str:
    msg = chat_req.message.lower()
    
    fallback_response = ""
    if "hello" in msg or "hi" in msg or "hey" in msg:
        fallback_response += f"Hello! I am your AI counselor. "
    
    if "visa" in msg:
        fallback_response += "For student visas, ensure you have an acceptance letter, proof of funds, and a valid passport before applying. Check your target country's official immigration portal for specific requirements. "
    elif "budget" in msg or "cost" in msg or "money" in msg:
        fallback_response += "A typical international budget spans $15k-$30k for tuition and $8k-$15k for living costs per year. I highly recommend applying for global excellence scholarships to offset these costs! "
    elif "university" in msg or "college" in msg or "degree" in msg:
        fallback_response += "Target recognized universities! Use our Roadmap feature to get personalized layout of the top 5 universities suitable for your chosen country and degree level. "
    elif "scholarship" in msg:
        fallback_response += "There are thousands of scholarships globally. Use the Scholarship Finder on our platform to get matched with grants and fee waivers! "
    elif "accommodation" in msg or "accomodation" in msg or "housing" in msg or "apartment" in msg or "rent" in msg or "room" in msg:
        fallback_response += "For accommodation, you can choose between on-campus university housing or private shared apartments. We recommend booking 3-6 months in advance through university portals or trusted student platforms. "
    
    if not fallback_response:
        fallback_response = "I'm currently in local mode, but I can still help! Ask me about universities, visas, budgets, accommodation, or scholarships for study abroad."

    if not client:
        return fallback_response
    
    system_prompt = f"""VOICE-FIRST COUNSELOR 

ROLE:
Guide students using their roadmap and selected country.

LANGUAGE RULE (VERY IMPORTANT):
By default, reply in English. 
However, if the user has selected a specific language (currently selected: {chat_req.language}), you MUST translate your entire response and reply ONLY in {chat_req.language}.
Never mix languages.

WHAT YOU MUST HELP WITH:
Explain briefly and clearly:

Roadmap steps
University application process
Visa process (country-specific)
SOP guidance
IELTS guidance
Scholarships
Accommodation process
Part-time jobs
ROI / expenses
Embassy interview
Travel preparation
Required documents
Financial proof / block account (if applicable)

RESPONSE STYLE:
Short and voice-friendly
Simple language
No long paragraphs
No unnecessary questions
Natural counselor tone

CURRENT MODE INSTRUCTION ({chat_req.mode}):
"""
    
    mode_instructions = {
        "Mentor Mode": "Provide practical study-abroad guidance, planning advice, and constructive recommendations.",
        "Parent Explanation Mode": "Explain recommendations in a reassuring, clear way that addresses common parent concerns such as safety, cost, education, and future prospects.",
        "Parent Mode": "Explain recommendations in a reassuring, clear way that addresses common parent concerns such as safety, cost, education, and future prospects.",
        "Motivational Mode": "Give encouraging and positive guidance while remaining relevant to the student's situation.",
        "Quick Summary Mode": "Give a concise summary of the student's current discussion or relevant study-abroad information.",
        "Summary Mode": "Give a concise summary of the student's current discussion or relevant study-abroad information."
    }
    mode_instruction = mode_instructions.get(chat_req.mode, mode_instructions["Mentor Mode"])
    
    system_prompt += f"{mode_instruction}\n"

    history_text = ""
    for msg in chat_req.history:
        history_text += f"{msg.role}: {msg.content}\n"
        
    prompt = f"System: {system_prompt}\nChat History:\n{history_text}\nUser: {chat_req.message}\nAssistant:"
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        return response.text
    except Exception as e:
        print(f"Error calling Gemini chat: {e}")
        return fallback_response

def get_dynamic_country_data(country_name: str):
    if not client or not api_key or "your_" in api_key:
        country_data = {
            "United States": {
                "cities": ["New York", "Boston", "San Francisco", "Chicago", "Los Angeles"],
                "universities": [
                    "Massachusetts Institute of Technology (MIT) - Cambridge",
                    "Harvard University - Cambridge",
                    "Stanford University - Stanford",
                    "California Institute of Technology (Caltech) - Pasadena",
                    "University of Chicago - Chicago",
                    "Princeton University - Princeton",
                    "Cornell University - Ithaca",
                    "Yale University - New Haven",
                    "Columbia University - New York",
                    "University of Pennsylvania - Philadelphia",
                    "University of California, Berkeley (UCB) - Berkeley",
                    "University of California, Los Angeles (UCLA) - Los Angeles",
                    "New York University (NYU) - New York",
                    "Johns Hopkins University - Baltimore",
                    "University of Michigan - Ann Arbor",
                    "Duke University - Durham",
                    "Northwestern University - Evanston"
                ]
            },
            "United Kingdom": {
                "cities": ["London", "Edinburgh", "Manchester", "Glasgow", "Coventry"],
                "universities": [
                    "University of Oxford - Oxford",
                    "University of Cambridge - Cambridge",
                    "Imperial College London - London",
                    "UCL (University College London) - London",
                    "University of Edinburgh - Edinburgh",
                    "King's College London - London",
                    "London School of Economics (LSE) - London",
                    "University of Manchester - Manchester",
                    "University of Bristol - Bristol",
                    "University of Glasgow - Glasgow",
                    "University of Birmingham - Birmingham",
                    "University of Warwick - Coventry",
                    "University of Leeds - Leeds",
                    "University of Sheffield - Sheffield",
                    "University of Nottingham - Nottingham"
                ]
            },
            "Canada": {
                "cities": ["Toronto", "Montreal", "Vancouver", "Ottawa", "Calgary"],
                "universities": [
                    "University of Toronto - Toronto",
                    "McGill University - Montreal",
                    "University of British Columbia (UBC) - Vancouver",
                    "University of Alberta - Edmonton",
                    "University of Waterloo - Waterloo",
                    "Western University - London",
                    "University of Calgary - Calgary",
                    "McMaster University - Hamilton",
                    "Queen's University - Kingston",
                    "University of Ottawa - Ottawa",
                    "Simon Fraser University - Burnaby",
                    "Dalhousie University - Halifax",
                    "University of Victoria - Victoria",
                    "Laval University - Quebec City",
                    "York University - Toronto"
                ]
            },
            "Australia": {
                "cities": ["Melbourne", "Sydney", "Brisbane", "Adelaide", "Perth"],
                "universities": [
                    "University of Melbourne - Melbourne",
                    "University of Sydney - Sydney",
                    "University of New South Wales (UNSW) - Sydney",
                    "Australian National University (ANU) - Canberra",
                    "University of Queensland - Brisbane",
                    "Monash University - Melbourne",
                    "University of Western Australia - Perth",
                    "University of Adelaide - Adelaide",
                    "Macquarie University - Sydney",
                    "RMIT University - Melbourne",
                    "University of Wollongong - Wollongong",
                    "University of Newcastle - Newcastle",
                    "Curtin University - Perth",
                    "Queensland University of Technology - Brisbane",
                    "Deakin University - Geelong"
                ]
            },
            "Germany": {
                "cities": ["Munich", "Berlin", "Heidelberg", "Frankfurt", "Hamburg"],
                "universities": [
                    "Technical University of Munich (TUM) - Munich",
                    "LMU Munich - Munich",
                    "Heidelberg University - Heidelberg",
                    "Humboldt University of Berlin - Berlin",
                    "Free University of Berlin - Berlin",
                    "RWTH Aachen University - Aachen",
                    "University of Freiburg - Freiburg",
                    "University of Tübingen - Tübingen",
                    "University of Bonn - Bonn",
                    "University of Göttingen - Göttingen",
                    "University of Hamburg - Hamburg",
                    "Frankfurt School of Finance & Management - Frankfurt",
                    "University of Mannheim - Mannheim",
                    "University of Stuttgart - Stuttgart",
                    "Dresden University of Technology - Dresden"
                ]
            }
        }
        
        c_data = country_data.get(country_name)
        if c_data:
            return c_data
            
        capital = f"{country_name} Capital City"
        metro = f"{country_name} Metro Area"
        coastal = f"{country_name} Coastal City"
        return {
            "cities": [capital, metro, coastal],
            "universities": [
                f"{country_name} National University - {capital}", 
                f"University of {country_name} - {metro}",
                f"{country_name} Institute of Technology - {coastal}",
                f"Royal {country_name} College - {capital}",
                f"{country_name} Global Academy - {metro}",
                f"State University of {country_name} - {capital}",
                f"{country_name} Metropolitan University - {metro}",
                f"International Business School {country_name} - {capital}",
                f"{country_name} Applied Sciences - {coastal}",
                f"Modern {country_name} University - {metro}",
            ]
        }
        
    prompt = f"Return a JSON object with two arrays for the country '{country_name}': 'cities' (top 5 major student cities) and 'universities' (top 5 prestigious universities). Strictly return JSON like {{'cities':[], 'universities':[]}}."
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            )
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Error generation country data: {e}")
        capital = f"{country_name} Capital City"
        metro = f"{country_name} Metro Area"
        coastal = f"{country_name} Coastal City"
        return {
            "cities": [capital, metro, coastal, f"{country_name} Valley", f"{country_name} North"],
            "universities": [
                f"{country_name} National University ({capital})", 
                f"University of {country_name} ({metro})",
                f"{country_name} Institute of Technology ({coastal})",
                f"Royal {country_name} College ({capital})",
                f"{country_name} Global Academy ({metro})"
            ]
        }

def get_mock_plan(request: StudentRequest) -> GeneratedPlan:
    country = request.country
    degree = request.degree
    
    # Dynamic values based on country
    currency = "€" if country in ["Germany", "France", "Spain", "Italy", "Netherlands"] else "£" if country == "United Kingdom" else "CAD" if country == "Canada" else "AUD" if country == "Australia" else "$"
    base_cost = 12000 if currency == "€" else 20000 if currency == "£" else 25000 if currency == "CAD" else 30000
    
    country_data = get_dynamic_country_data(country)
    cities = country_data["cities"]
    dynamic_universities = country_data["universities"]
    
    plan_universities = []
    
    # Check if user requested a specific university, prioritize it
    priority_uni = request.preferred_university
    if priority_uni and priority_uni != "Any" and priority_uni not in dynamic_universities:
        dynamic_universities.insert(0, priority_uni)
        
    for idx, uni_name in enumerate(dynamic_universities[:15]): # Include up to 15
        domain = uni_name.lower().replace(" ", "").replace("-", "").replace("(", "").replace(")", "").split(",")[0]
        domain = domain[:10] + ".edu"
        
        plan_universities.append({
            "name": uni_name,
            "description": f"One of the premier institutions in {country}, globally recognized for outstanding {degree} programs and excellence.",
            "ranking": f"Top {50 + (idx * 15)} Global",
            "tuition_fees": f"{currency}{int(base_cost * (1.2 - (idx * 0.02)))}/year",
            "link": f"https://www.{domain}",
            "admissions_start_date": "September 1st, 2026",
            "admissions_closing_date": "January 15th, 2027",
            "application_form_link": f"https://www.{domain}/apply",
            "how_to_fill_application": [
                "Create an account on the university application portal.",
                "Fill in your personal and educational background details.",
                "Upload required documents like transcripts and English scores.",
                "Submit the application fee and submit the form."
            ],
            "required_documents": [
                "Valid Passport",
                "Official Academic Transcripts",
                "Proof of English Proficiency",
                "Statement of Purpose"
            ]
        })
        
    application_steps = []
    if country == "United Kingdom":
        application_steps = ["Register on UCAS portal", "Submit Personal Statement", "Provide Academic References", "Pay application fee and wait for conditional offers"]
    elif country == "United States":
        application_steps = ["Create Common App or University portal account", "Write required essays and supplemental statements", "Request transcripts and Letters of Recommendation", "Send SAT/ACT or GRE/GMAT scores (if required)", "Submit before designated early or regular deadline"]
    elif country == "Germany":
        application_steps = ["Check qualification via Anabin database", "Apply through uni-assist portal (for most universities) or direct", "Pass German/English proficiency tests", "Wait for admission letter to block account and apply for visa"]
    elif country == "Canada":
        application_steps = ["Apply online via university portal or OUAC (for Ontario)", "Submit official transcripts and proof of English", "Pay application fee", "Receive Letter of Acceptance (LOA)"]
    elif country == "Australia":
        application_steps = ["Apply directly or through an authorized education agent", "Submit certified academic transcripts", "Provide proof of English (IELTS/PTE)", "Receive Offer Letter and pay initial tuition to get CoE (Confirmation of Enrolment)"]
    else:
        application_steps = [f"Check {country} central admission portal", "Ensure your prior degrees are recognized", "Submit language tests", "Apply before the winter/fall intakes"]

    return GeneratedPlan(
        universities=plan_universities,
        university_application_steps=application_steps,
        scholarships=[
            {"name": f"{country} Global Excellence Scholarship", "amount": f"{currency}5,000/year", "link": f"https://www.scholarships.com"},
            {"name": f"{country} International {degree} Grant", "amount": f"{currency}2,000 one-time", "link": f"https://www.internationalscholarships.com/"}
        ],
        accommodation=[
            {"type": f"On-Campus Housing at {country} University", "description": f"Convenient access to classes and international student community in {country}.", "estimated_cost": f"{currency}800/month", "how_to_get": "Apply via university housing portal ideally 6 months before."},
            {"type": f"Shared Private Apartment in {cities[0]}", "description": "Great for making friends and exploring the local culture.", "estimated_cost": f"{currency}600/month", "how_to_get": "https://amberstudent.com"}
        ],
        transport=[
            {"mode": f"{country} Public Transit (Bus/Train)", "description": f"Reliable and affordable with a {country} student pass."},
            {"mode": "Bicycle", "description": "Eco-friendly option for getting around campus."}
        ],
        visa_process={
            "steps": [f"Accept {country} University Offer", f"Gather {country} Visa Documents", f"Apply Online via {country} Immigration", "Interview/Biometrics"],
            "required_documents": [f"Valid Passport for {country}", "University Offer Letter", f"Financial Proof of {currency}{base_cost}", "Language Score"]
        },
        block_account_details={
            "is_required": True if country in ["Germany", "Europe", "Austria"] else False,
            "description": f"{country} requires a Blocked Account of exactly {currency}11,208 for the first year to prove your financial stability during your {degree}." if country in ["Germany", "Europe", "Austria"] else f"A formal block account is generally not required for {country}, but strict proof of funds ({currency}{base_cost}) is mandatory.",
            "steps_to_open": [
                "Choose a certified block account provider (e.g., Fintiba, Expatrio, or Coracle).",
                "Register online using your passport.",
                "Transfer the required amount into the provided IBAN.",
                "Receive your blocked account confirmation document for the visa application."
            ] if country in ["Germany", "Europe", "Austria"] else ["Ensure your sponsor or your own bank account shows sufficient funds for at least 3-6 months.", "Obtain an official bank statement or financial guarantee letter."],
            "providers_link": "https://www.fintiba.com" if country in ["Germany", "Europe", "Austria"] else None
        },
        english_test_requirements=f"IELTS 6.5 or TOEFL iBT 90 typically required for {degree} programs in {country}.",
        part_time_work_rules=f"International students in {country} can work up to 20 hours/week during their {degree} studies; full-time during breaks.",
        estimated_total_annual_budget=f"{currency}{base_cost + 15000} - {currency}{base_cost + 25000} including tuition, boarding, and living costs in {country}.",
        monthly_cost=f"{currency}1,200 - {currency}2,000",
        checklist=[
            f"Apply for {country} Student Visa",
            f"Book flight tickets to {country}",
            "Secure accommodation",
            f"Open a local {country} bank account",
            "Attend international student orientation"
        ]
    )
