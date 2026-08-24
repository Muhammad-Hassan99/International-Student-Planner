from pydantic import BaseModel
from typing import List, Optional

class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str

class SubscriptionRequest(BaseModel):
    plan_type: str

class ChatMessage(BaseModel):
    role: str # "user" or "model" / "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []
    language: Optional[str] = "English"
    mode: Optional[str] = "Mentor Mode"

class StudentRequest(BaseModel):
    country: str
    degree: str
    budget: float
    preferred_city: str
    preferred_university: Optional[str] = None

class PlanUniversity(BaseModel):
    name: str
    description: str
    ranking: str
    tuition_fees: str
    link: str
    admissions_start_date: Optional[str] = None
    admissions_closing_date: Optional[str] = None
    application_form_link: Optional[str] = None
    how_to_fill_application: Optional[List[str]] = None
    required_documents: Optional[List[str]] = None

class BlockAccountGuide(BaseModel):
    is_required: bool
    description: str
    steps_to_open: List[str]
    providers_link: Optional[str] = None

class Scholarship(BaseModel):
    name: str
    amount: str
    link: str

class Accommodation(BaseModel):
    type: str
    description: str
    estimated_cost: str
    how_to_get: str

class Transport(BaseModel):
    mode: str
    description: str

class VisaProcess(BaseModel):
    steps: List[str]
    required_documents: List[str]

class GeneratedPlan(BaseModel):
    universities: List[PlanUniversity]
    university_application_steps: List[str]
    scholarships: List[Scholarship]
    accommodation: List[Accommodation]
    transport: List[Transport]
    visa_process: VisaProcess
    block_account_details: BlockAccountGuide
    english_test_requirements: str
    part_time_work_rules: str
    estimated_total_annual_budget: str
    monthly_cost: str
    checklist: List[str]

class Token(BaseModel):
    access_token: str
    token_type: str
