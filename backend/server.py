from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, EmailStr
from bson import ObjectId
import os
import logging
from pathlib import Path
import base64
import json
import asyncio
from emergentintegrations.llm.chat import LlmChat, UserMessage

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configuration
MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
JWT_SECRET = os.environ.get('JWT_SECRET', 'spcuf_jwt_secret_key_change_in_production_2025')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_EXPIRATION_HOURS = int(os.environ.get('JWT_EXPIRATION_HOURS', 168))
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# MongoDB connection
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security
security = HTTPBearer()

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    
    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return str(v)

# Auth Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    phone: Optional[str] = None
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Case Models
class CaseParty(BaseModel):
    name: str
    relationship: str
    dob: Optional[str] = None
    school: Optional[str] = None
    grade: Optional[str] = None

class Allegation(BaseModel):
    type: str
    finding: str  # "Reason to Believe", "Unable to Determine", "Ruled Out"
    details: Optional[str] = None

class ServicePlanItem(BaseModel):
    id: str = Field(default_factory=lambda: str(ObjectId()))
    description: str
    deadline: Optional[datetime] = None
    completed: bool = False
    completion_date: Optional[datetime] = None

class PlacementHistory(BaseModel):
    date: datetime
    placement_type: str
    location: str

class VisitationSchedule(BaseModel):
    frequency: str
    location: str
    supervisor_name: Optional[str] = None

class CourtInfo(BaseModel):
    cause_number: Optional[str] = None
    court_name: Optional[str] = None
    judge_name: Optional[str] = None
    next_hearing_date: Optional[datetime] = None
    next_hearing_type: Optional[str] = None

class CaseCreate(BaseModel):
    dfps_region: Optional[str] = None
    dfps_unit: Optional[str] = None
    investigator_name: Optional[str] = None
    supervisor_name: Optional[str] = None
    date_opened: Optional[datetime] = None
    investigation_type: Optional[str] = None  # Neglect, Physical Abuse, etc.
    current_stage: str = "Investigation"  # Investigation, Ongoing Services, Court, etc.
    parties: List[CaseParty] = []
    allegations: List[Allegation] = []
    service_plan_items: List[ServicePlanItem] = []
    placement_history: List[PlacementHistory] = []
    visitation_schedule: Optional[VisitationSchedule] = None
    court_info: Optional[CourtInfo] = None
    notes: Optional[str] = None

class CaseUpdate(BaseModel):
    dfps_region: Optional[str] = None
    dfps_unit: Optional[str] = None
    investigator_name: Optional[str] = None
    supervisor_name: Optional[str] = None
    date_opened: Optional[datetime] = None
    investigation_type: Optional[str] = None
    current_stage: Optional[str] = None
    parties: Optional[List[CaseParty]] = None
    allegations: Optional[List[Allegation]] = None
    service_plan_items: Optional[List[ServicePlanItem]] = None
    placement_history: Optional[List[PlacementHistory]] = None
    visitation_schedule: Optional[VisitationSchedule] = None
    court_info: Optional[CourtInfo] = None
    notes: Optional[str] = None

class CaseResponse(BaseModel):
    id: str
    case_id_display: str
    user_id: str
    dfps_region: Optional[str] = None
    dfps_unit: Optional[str] = None
    investigator_name: Optional[str] = None
    supervisor_name: Optional[str] = None
    date_opened: Optional[datetime] = None
    investigation_type: Optional[str] = None
    current_stage: str
    parties: List[CaseParty] = []
    allegations: List[Allegation] = []
    service_plan_items: List[ServicePlanItem] = []
    placement_history: List[PlacementHistory] = []
    visitation_schedule: Optional[VisitationSchedule] = None
    court_info: Optional[CourtInfo] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

# Timeline Models
class TimelineEventCreate(BaseModel):
    event_type: str
    event_date: datetime
    description: str
    legal_significance: Optional[str] = None

class TimelineEventResponse(BaseModel):
    id: str
    case_id: str
    event_type: str
    event_date: datetime
    description: str
    legal_significance: Optional[str] = None
    created_at: datetime

# Document Models
class DocumentUpload(BaseModel):
    case_id: str
    document_type: str
    file_name: str
    file_data: str  # base64 encoded
    category: str
    tags: List[str] = []

class DocumentResponse(BaseModel):
    id: str
    case_id: str
    user_id: str
    document_type: str
    file_name: str
    category: str
    tags: List[str]
    uploaded_at: datetime
    file_size: int

# Contact Models
class ContactCreate(BaseModel):
    case_id: str
    contact_type: str  # caseworker, attorney, CASA, AAL, etc.
    name: str
    title: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    organization: Optional[str] = None
    supervisor_name: Optional[str] = None
    notes: Optional[str] = None

class ContactResponse(BaseModel):
    id: str
    case_id: str
    contact_type: str
    name: str
    title: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    organization: Optional[str] = None
    supervisor_name: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

# Deadline Models
class DeadlineCreate(BaseModel):
    case_id: str
    deadline_type: str
    deadline_date: datetime
    description: str
    completed: bool = False

class DeadlineResponse(BaseModel):
    id: str
    case_id: str
    deadline_type: str
    deadline_date: datetime
    description: str
    completed: bool
    created_at: datetime

# AI Models
class AIChatRequest(BaseModel):
    case_id: Optional[str] = None
    message: str
    conversation_mode: str = "ask_spcuf"  # ask_spcuf, about_my_case, challenge_this, etc.

class AIChatResponse(BaseModel):
    response: str
    citations: List[str] = []
    conversation_id: str

# Resource Models
class ResourceResponse(BaseModel):
    id: str
    category: str
    subcategory: str
    title: str
    description: str
    content: Optional[str] = None
    links: List[str] = []
    phone_numbers: List[str] = []

# Legal Library Models
class LegalTopicResponse(BaseModel):
    id: str
    topic: str
    category: str
    title: str
    summary: str
    statute_citation: Optional[str] = None
    policy_citation: Optional[str] = None
    plain_language_explanation: str
    what_this_means: str
    what_if_violated: str
    last_verified_date: datetime

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials")
        
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        
        return user
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials")

def generate_case_id() -> str:
    """Generate a unique case ID like SPCUF-2025-001"""
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    return f"SPCUF-{timestamp}"

# ============================================================================
# FASTAPI APP
# ============================================================================

app = FastAPI(title="SPCUF API", version="1.0.0")
api_router = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# AUTH ROUTES
# ============================================================================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = pwd_context.hash(user_data.password)
    
    # Create user
    user_dict = {
        "email": user_data.email,
        "password_hash": hashed_password,
        "full_name": user_data.full_name,
        "phone": user_data.phone,
        "created_at": datetime.utcnow(),
        "last_login": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user_dict)
    user_id = str(result.inserted_id)
    
    # Create token
    access_token = create_access_token({"sub": user_id})
    
    user_response = UserResponse(
        id=user_id,
        email=user_data.email,
        full_name=user_data.full_name,
        phone=user_data.phone,
        created_at=user_dict["created_at"]
    )
    
    return TokenResponse(access_token=access_token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    # Find user
    user = await db.users.find_one({"email": credentials.email})
    if not user or not pwd_context.verify(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Update last login
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    # Create token
    user_id = str(user["_id"])
    access_token = create_access_token({"sub": user_id})
    
    user_response = UserResponse(
        id=user_id,
        email=user["email"],
        full_name=user["full_name"],
        phone=user.get("phone"),
        created_at=user["created_at"]
    )
    
    return TokenResponse(access_token=access_token, user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user["_id"]),
        email=current_user["email"],
        full_name=current_user["full_name"],
        phone=current_user.get("phone"),
        created_at=current_user["created_at"]
    )

# ============================================================================
# CASE ROUTES
# ============================================================================

@api_router.post("/cases", response_model=CaseResponse)
async def create_case(case_data: CaseCreate, current_user: dict = Depends(get_current_user)):
    case_dict = case_data.dict()
    case_dict.update({
        "case_id_display": generate_case_id(),
        "user_id": str(current_user["_id"]),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    })
    
    result = await db.cases.insert_one(case_dict)
    case_dict["id"] = str(result.inserted_id)
    case_dict.pop("_id", None)
    
    return CaseResponse(**case_dict)

@api_router.get("/cases", response_model=List[CaseResponse])
async def get_cases(current_user: dict = Depends(get_current_user)):
    cases = await db.cases.find({"user_id": str(current_user["_id"])}).to_list(100)
    result = []
    for case in cases:
        case["id"] = str(case["_id"])
        case.pop("_id")
        result.append(CaseResponse(**case))
    return result

@api_router.get("/cases/{case_id}", response_model=CaseResponse)
async def get_case(case_id: str, current_user: dict = Depends(get_current_user)):
    case = await db.cases.find_one({"_id": ObjectId(case_id), "user_id": str(current_user["_id"])})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    case["id"] = str(case["_id"])
    case.pop("_id")
    return CaseResponse(**case)

@api_router.put("/cases/{case_id}", response_model=CaseResponse)
async def update_case(case_id: str, case_data: CaseUpdate, current_user: dict = Depends(get_current_user)):
    # Verify ownership
    case = await db.cases.find_one({"_id": ObjectId(case_id), "user_id": str(current_user["_id"])})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Update
    update_dict = {k: v for k, v in case_data.dict().items() if v is not None}
    update_dict["updated_at"] = datetime.utcnow()
    
    await db.cases.update_one(
        {"_id": ObjectId(case_id)},
        {"$set": update_dict}
    )
    
    # Fetch updated case
    updated_case = await db.cases.find_one({"_id": ObjectId(case_id)})
    updated_case["id"] = str(updated_case["_id"])
    updated_case.pop("_id")
    
    return CaseResponse(**updated_case)

@api_router.delete("/cases/{case_id}")
async def delete_case(case_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.cases.delete_one({"_id": ObjectId(case_id), "user_id": str(current_user["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Case not found")
    return {"message": "Case deleted successfully"}

# ============================================================================
# TIMELINE ROUTES
# ============================================================================

@api_router.post("/cases/{case_id}/timeline", response_model=TimelineEventResponse)
async def create_timeline_event(
    case_id: str,
    event_data: TimelineEventCreate,
    current_user: dict = Depends(get_current_user)
):
    # Verify case ownership
    case = await db.cases.find_one({"_id": ObjectId(case_id), "user_id": str(current_user["_id"])})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    event_dict = event_data.dict()
    event_dict.update({
        "case_id": case_id,
        "user_id": str(current_user["_id"]),
        "created_at": datetime.utcnow()
    })
    
    result = await db.timeline_events.insert_one(event_dict)
    event_dict["id"] = str(result.inserted_id)
    event_dict.pop("_id", None)
    
    return TimelineEventResponse(**event_dict)

@api_router.get("/cases/{case_id}/timeline", response_model=List[TimelineEventResponse])
async def get_timeline(case_id: str, current_user: dict = Depends(get_current_user)):
    # Verify case ownership
    case = await db.cases.find_one({"_id": ObjectId(case_id), "user_id": str(current_user["_id"])})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    events = await db.timeline_events.find({"case_id": case_id}).sort("event_date", -1).to_list(1000)
    result = []
    for event in events:
        event["id"] = str(event["_id"])
        event.pop("_id")
        event.pop("user_id", None)
        result.append(TimelineEventResponse(**event))
    return result

# ============================================================================
# DOCUMENT ROUTES
# ============================================================================

@api_router.post("/documents", response_model=DocumentResponse)
async def upload_document(doc_data: DocumentUpload, current_user: dict = Depends(get_current_user)):
    # Verify case ownership
    case = await db.cases.find_one({"_id": ObjectId(doc_data.case_id), "user_id": str(current_user["_id"])})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Decode base64 to get file size
    try:
        file_bytes = base64.b64decode(doc_data.file_data)
        file_size = len(file_bytes)
    except:
        raise HTTPException(status_code=400, detail="Invalid file data")
    
    doc_dict = {
        "case_id": doc_data.case_id,
        "user_id": str(current_user["_id"]),
        "document_type": doc_data.document_type,
        "file_name": doc_data.file_name,
        "file_data": doc_data.file_data,
        "category": doc_data.category,
        "tags": doc_data.tags,
        "file_size": file_size,
        "uploaded_at": datetime.utcnow()
    }
    
    result = await db.documents.insert_one(doc_dict)
    
    return DocumentResponse(
        id=str(result.inserted_id),
        case_id=doc_data.case_id,
        user_id=str(current_user["_id"]),
        document_type=doc_data.document_type,
        file_name=doc_data.file_name,
        category=doc_data.category,
        tags=doc_data.tags,
        file_size=file_size,
        uploaded_at=doc_dict["uploaded_at"]
    )

@api_router.get("/documents/{case_id}", response_model=List[DocumentResponse])
async def get_documents(case_id: str, current_user: dict = Depends(get_current_user)):
    # Verify case ownership
    case = await db.cases.find_one({"_id": ObjectId(case_id), "user_id": str(current_user["_id"])})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    documents = await db.documents.find({"case_id": case_id}).to_list(1000)
    result = []
    for doc in documents:
        result.append(DocumentResponse(
            id=str(doc["_id"]),
            case_id=doc["case_id"],
            user_id=doc["user_id"],
            document_type=doc["document_type"],
            file_name=doc["file_name"],
            category=doc["category"],
            tags=doc.get("tags", []),
            file_size=doc.get("file_size", 0),
            uploaded_at=doc["uploaded_at"]
        ))
    return result

@api_router.get("/documents/{case_id}/{document_id}")
async def get_document_data(case_id: str, document_id: str, current_user: dict = Depends(get_current_user)):
    # Verify case ownership
    case = await db.cases.find_one({"_id": ObjectId(case_id), "user_id": str(current_user["_id"])})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    doc = await db.documents.find_one({"_id": ObjectId(document_id), "case_id": case_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {
        "id": str(doc["_id"]),
        "file_name": doc["file_name"],
        "file_data": doc["file_data"],
        "document_type": doc["document_type"]
    }

# ============================================================================
# CONTACT ROUTES
# ============================================================================

@api_router.post("/contacts", response_model=ContactResponse)
async def create_contact(contact_data: ContactCreate, current_user: dict = Depends(get_current_user)):
    # Verify case ownership
    case = await db.cases.find_one({"_id": ObjectId(contact_data.case_id), "user_id": str(current_user["_id"])})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    contact_dict = contact_data.dict()
    contact_dict["created_at"] = datetime.utcnow()
    
    result = await db.contacts.insert_one(contact_dict)
    contact_dict["id"] = str(result.inserted_id)
    contact_dict.pop("_id", None)
    
    return ContactResponse(**contact_dict)

@api_router.get("/contacts/{case_id}", response_model=List[ContactResponse])
async def get_contacts(case_id: str, current_user: dict = Depends(get_current_user)):
    # Verify case ownership
    case = await db.cases.find_one({"_id": ObjectId(case_id), "user_id": str(current_user["_id"])})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    contacts = await db.contacts.find({"case_id": case_id}).to_list(1000)
    result = []
    for contact in contacts:
        contact["id"] = str(contact["_id"])
        contact.pop("_id")
        result.append(ContactResponse(**contact))
    return result

# ============================================================================
# DEADLINE ROUTES
# ============================================================================

@api_router.post("/deadlines/calculate")
async def calculate_deadlines(removal_date: str, case_id: str, current_user: dict = Depends(get_current_user)):
    """Calculate statutory deadlines based on removal date"""
    # Verify case ownership
    case = await db.cases.find_one({"_id": ObjectId(case_id), "user_id": str(current_user["_id"])})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    try:
        removal_dt = datetime.fromisoformat(removal_date.replace('Z', '+00:00'))
    except:
        raise HTTPException(status_code=400, detail="Invalid date format")
    
    deadlines = [
        {
            "deadline_type": "Adversarial Hearing",
            "deadline_date": removal_dt + timedelta(days=14),
            "description": "Adversarial Hearing - Day 14 (Tex. Fam. Code §262.201)",
            "statute": "§262.201"
        },
        {
            "deadline_type": "Status Hearing",
            "deadline_date": removal_dt + timedelta(days=60),
            "description": "Status Hearing - Day 60 (§263.201)",
            "statute": "§263.201"
        },
        {
            "deadline_type": "First Permanency Hearing",
            "deadline_date": removal_dt + timedelta(days=180),
            "description": "First Permanency Hearing - 6 months (§263.304)",
            "statute": "§263.304"
        },
        {
            "deadline_type": "Final Permanency Hearing",
            "deadline_date": removal_dt + timedelta(days=365),
            "description": "Final Permanency Hearing - 12 months (§263.306)",
            "statute": "§263.306"
        },
        {
            "deadline_type": "ASFA 15-Month Warning",
            "deadline_date": removal_dt + timedelta(days=455),
            "description": "ASFA 15-Month Warning - Day 455",
            "statute": "ASFA"
        },
        {
            "deadline_type": "ASFA 22-Month Termination Risk",
            "deadline_date": removal_dt + timedelta(days=670),
            "description": "ASFA 22-Month Termination Risk - Day 670",
            "statute": "ASFA"
        }
    ]
    
    # Store deadlines in database
    created_deadlines = []
    for deadline in deadlines:
        deadline_doc = {
            "case_id": case_id,
            "deadline_type": deadline["deadline_type"],
            "deadline_date": deadline["deadline_date"],
            "description": deadline["description"],
            "completed": False,
            "created_at": datetime.utcnow()
        }
        result = await db.deadlines.insert_one(deadline_doc)
        deadline_doc["id"] = str(result.inserted_id)
        deadline_doc.pop("_id", None)
        created_deadlines.append(deadline_doc)
    
    return {"deadlines": created_deadlines}

@api_router.get("/deadlines/{case_id}", response_model=List[DeadlineResponse])
async def get_deadlines(case_id: str, current_user: dict = Depends(get_current_user)):
    # Verify case ownership
    case = await db.cases.find_one({"_id": ObjectId(case_id), "user_id": str(current_user["_id"])})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    deadlines = await db.deadlines.find({"case_id": case_id}).sort("deadline_date", 1).to_list(1000)
    result = []
    for deadline in deadlines:
        deadline["id"] = str(deadline["_id"])
        deadline.pop("_id")
        result.append(DeadlineResponse(**deadline))
    return result

@api_router.put("/deadlines/{deadline_id}")
async def update_deadline(deadline_id: str, completed: bool, current_user: dict = Depends(get_current_user)):
    deadline = await db.deadlines.find_one({"_id": ObjectId(deadline_id)})
    if not deadline:
        raise HTTPException(status_code=404, detail="Deadline not found")
    
    # Verify case ownership
    case = await db.cases.find_one({"_id": ObjectId(deadline["case_id"]), "user_id": str(current_user["_id"])})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    await db.deadlines.update_one(
        {"_id": ObjectId(deadline_id)},
        {"$set": {"completed": completed}}
    )
    
    return {"message": "Deadline updated successfully"}

# ============================================================================
# AI ROUTES
# ============================================================================

SPCUF_SYSTEM_PROMPT = """You are SPCUF — the AI legal and case management assistant inside SPCUF, 
a platform built exclusively for families navigating the Texas CPS / DFPS system.
SPCUF stands for: Supporting Parents, Children, United Families.

YOUR IDENTITY:
You are knowledgeable, direct, warm, and fiercely committed to helping parents 
understand and exercise their legal rights. You speak plainly. You never 
condescend. You treat every parent as intelligent, capable, and worthy of 
complete information. Your purpose is to give families back their voice.

YOUR DISCLAIMER (once per new case session only):
"I'm SPCUF, your AI legal assistant — here to support you, your children, and your family. 
I provide legal information, not legal advice — I'm not a licensed attorney and 
this is not a substitute for one. That said, I will give you every piece of 
knowledge I can to help you protect your family. Let's get started."

YOUR KNOWLEDGE BASE (always cite by name and section):
- Texas Family Code Chapters 261, 262, 263, 264
- DFPS CPS Policy & Procedures Handbook (verify current via web search)
- Texas Administrative Code Title 40, Part 19
- CAPTA, ASFA, FFPSA, ICWA, IV-E federal law
- U.S. Constitution: 4th, 14th Amendment parental rights
- Troxel v. Granville (2000), Santosky v. Kramer (1982), Stanley v. Illinois (1972)

YOUR RULES:
1. Ask clarifying questions before giving specific guidance — facts matter
2. Cite every statute, policy section, or case by exact name and number
3. Always distinguish DFPS internal policy from enforceable law
4. Always flag deadlines, rights, and risks the parent hasn't asked about yet
5. Use web search to verify before citing any current statute or policy
6. Never fabricate legal citations — say "Let me verify this" and search
7. Never recommend passive compliance without explaining the right to contest
8. Proactively surface what the parent needs but hasn't thought to ask
9. End substantive responses with: "What would you like to address next?"

YOUR TONE:
Warm but precise. Empowering but grounded. A knowledgeable ally — not a 
bureaucrat, not a robot, not a replacement for human connection. You are the 
informed friend every parent deserves to have in their corner."""

@api_router.post("/ai/chat")
async def ai_chat(chat_request: AIChatRequest, current_user: dict = Depends(get_current_user)):
    try:
        # Get case context if case_id provided
        case_context = ""
        if chat_request.case_id:
            case = await db.cases.find_one({
                "_id": ObjectId(chat_request.case_id),
                "user_id": str(current_user["_id"])
            })
            if case:
                case_context = f"\n\nCASE CONTEXT:\n"
                case_context += f"Case ID: {case.get('case_id_display', 'N/A')}\n"
                case_context += f"Current Stage: {case.get('current_stage', 'N/A')}\n"
                case_context += f"Investigation Type: {case.get('investigation_type', 'N/A')}\n"
                if case.get('date_opened'):
                    case_context += f"Date Opened: {case['date_opened'].strftime('%Y-%m-%d')}\n"
        
        # Initialize LLM chat with Claude
        session_id = f"user_{current_user['_id']}_case_{chat_request.case_id or 'general'}"
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=SPCUF_SYSTEM_PROMPT + case_context
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        
        # Create user message
        user_message = UserMessage(text=chat_request.message)
        
        # Get response
        response = await chat.send_message(user_message)
        
        # Save conversation to database
        conversation_doc = {
            "case_id": chat_request.case_id,
            "user_id": str(current_user["_id"]),
            "conversation_mode": chat_request.conversation_mode,
            "messages": [
                {"role": "user", "content": chat_request.message},
                {"role": "assistant", "content": response}
            ],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await db.ai_conversations.insert_one(conversation_doc)
        
        return {
            "response": response,
            "citations": [],
            "conversation_id": str(result.inserted_id)
        }
        
    except Exception as e:
        logger.error(f"AI chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI chat failed: {str(e)}")

# ============================================================================
# RESOURCE ROUTES
# ============================================================================

@api_router.get("/resources", response_model=List[ResourceResponse])
async def get_resources():
    """Get all resources - no auth required for public access"""
    resources = await db.resources.find().to_list(1000)
    result = []
    for resource in resources:
        resource["id"] = str(resource["_id"])
        resource.pop("_id")
        result.append(ResourceResponse(**resource))
    return result

@api_router.get("/resources/{category}", response_model=List[ResourceResponse])
async def get_resources_by_category(category: str):
    """Get resources by category - no auth required"""
    resources = await db.resources.find({"category": category}).to_list(1000)
    result = []
    for resource in resources:
        resource["id"] = str(resource["_id"])
        resource.pop("_id")
        result.append(ResourceResponse(**resource))
    return result

# ============================================================================
# LEGAL LIBRARY ROUTES
# ============================================================================

@api_router.get("/legal-library", response_model=List[LegalTopicResponse])
async def get_legal_library():
    """Get all legal topics - no auth required"""
    topics = await db.legal_library.find().to_list(1000)
    result = []
    for topic in topics:
        topic["id"] = str(topic["_id"])
        topic.pop("_id")
        result.append(LegalTopicResponse(**topic))
    return result

@api_router.get("/legal-library/{topic_id}", response_model=LegalTopicResponse)
async def get_legal_topic(topic_id: str):
    """Get specific legal topic - no auth required"""
    topic = await db.legal_library.find_one({"_id": ObjectId(topic_id)})
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    topic["id"] = str(topic["_id"])
    topic.pop("_id")
    return LegalTopicResponse(**topic)

# ============================================================================
# DATABASE SEEDING
# ============================================================================

@api_router.post("/seed-data")
async def seed_database():
    """Seed the database with initial data - DEV ONLY"""
    try:
        # Seed legal library
        legal_topics = [
            {
                "topic": "investigation_rights",
                "category": "Investigation",
                "title": "Your Rights During Investigation",
                "summary": "Understanding your constitutional and statutory rights when CPS investigates",
                "statute_citation": "Texas Family Code §261.302, §261.303",
                "policy_citation": "DFPS CPS Handbook §2251",
                "plain_language_explanation": "When CPS investigates your family, you have specific rights protected by law. You have the right to know what allegations are being investigated, to be present during interviews with your children (in most cases), and to have an attorney present. You also have the right to refuse entry to your home without a court order or warrant, except in emergency situations.",
                "what_this_means": "CPS cannot force their way into your home without your permission or a court order. You can ask to see their credentials, ask what the allegations are, and request to speak with a supervisor. You have the right to remain silent and the right to legal representation before answering questions.",
                "what_if_violated": "If CPS violates your rights during an investigation, document everything. Write down dates, times, names, and exactly what happened. Take photos or videos if possible. File a complaint with the DFPS Ombudsman immediately. Contact an attorney as these violations can be used in court to challenge findings or removals. Violations of constitutional rights may also be grounds for federal civil rights claims.",
                "last_verified_date": datetime.utcnow()
            },
            {
                "topic": "emergency_removal",
                "category": "Removal",
                "title": "Emergency Removal - What CPS Can and Cannot Do",
                "summary": "Legal limits on CPS emergency removal authority",
                "statute_citation": "Texas Family Code §262.104, §262.201",
                "policy_citation": "DFPS CPS Handbook §3000",
                "plain_language_explanation": "CPS can only remove your child without a court order if they have reasonable belief that there is immediate danger to the child's physical health or safety. Even then, they must immediately seek a court order and you are entitled to an adversarial hearing within 14 days.",
                "what_this_means": "Emergency removal is supposed to be rare and only for genuine emergencies. CPS must prove to a judge within 14 days that removal was necessary and that your child cannot safely return home. You have the right to an attorney at that hearing and the right to present evidence and witnesses.",
                "what_if_violated": "If CPS removes your child without proper legal authority, you can file for an emergency hearing to return your child. Contact an attorney immediately - within hours, not days. Document everything about the removal: who was present, what was said, any threats or coercion used. Request body camera footage if police were involved.",
                "last_verified_date": datetime.utcnow()
            },
            {
                "topic": "adversarial_hearing",
                "category": "Court",
                "title": "Adversarial Hearing - Your First Court Date",
                "summary": "Understanding the 14-day adversarial hearing after removal",
                "statute_citation": "Texas Family Code §262.201",
                "policy_citation": None,
                "plain_language_explanation": "Within 14 days of an emergency removal, the court must hold an adversarial hearing. This is YOUR opportunity to challenge the removal and argue for your child's return. CPS must prove by a preponderance of evidence (more likely than not) that there was an urgent need for removal and that reasonable efforts were made to prevent removal.",
                "what_this_means": "This hearing is critical. The judge will decide if your child stays in foster care or comes home. You can testify, present witnesses, cross-examine CPS witnesses, and submit evidence. You can argue that the removal was unnecessary, that safety concerns can be addressed with you keeping custody, or that relatives should have been considered first.",
                "what_if_violated": "If your adversarial hearing is delayed beyond 14 days without good cause, you can file a motion for immediate return of your child. If the court violates your due process rights at the hearing (not allowing you to speak, not providing an attorney, not allowing you to present evidence), these are grounds for appeal.",
                "last_verified_date": datetime.utcnow()
            },
            {
                "topic": "service_plan_rights",
                "category": "Services",
                "title": "Service Plan Rights - What You Must Do",
                "summary": "Your rights regarding the family service plan",
                "statute_citation": "Texas Family Code §263.103, §263.104",
                "policy_citation": "DFPS CPS Handbook §4300",
                "plain_language_explanation": "If your case goes into services, DFPS will create a family service plan listing things you must do to get your child back. You have the right to participate in creating this plan, to object to requirements you believe are unnecessary or harmful, and to have the plan tailored to the actual safety concerns in your case.",
                "what_this_means": "The service plan should directly address the reasons your child was removed - not just generic requirements. If drugs weren't involved in your case, you can object to drug testing. If you've already completed parenting classes recently, you can provide proof and request credit. Services should help you, not punish you.",
                "what_if_violated": "If DFPS requires services that are not related to the safety concerns, object in writing and at every court hearing. Document every service you complete with certificates, attendance records, and progress reports. If DFPS denies you credit for completed services, bring proof to court and ask the judge to intervene.",
                "last_verified_date": datetime.utcnow()
            },
            {
                "topic": "relative_placement",
                "category": "Placement",
                "title": "Relative Placement Preference",
                "summary": "Your child's right to be placed with family",
                "statute_citation": "Texas Family Code §262.114, §264.751",
                "policy_citation": "DFPS CPS Handbook §6331",
                "plain_language_explanation": "Texas law requires CPS to make reasonable efforts to place your child with relatives or other people your child knows before placing them with stranger foster care. CPS must ask you for a list of relatives within 30 days. Relatives don't need to be perfect - they just need to pass a background check and provide a safe home.",
                "what_this_means": "Your child has a legal right to be with family if possible. Even if you and that relative don't get along, your child's connection to family is more important. CPS cannot refuse a qualified relative just because it's inconvenient for them or because the relative supports you.",
                "what_if_violated": "If CPS refuses to place your child with a qualified relative without good reason, file a motion asking the judge to order the placement. Document all relatives you've suggested and CPS's reasons for refusing them. If CPS didn't ask you for a list of relatives, that's a violation of policy and law.",
                "last_verified_date": datetime.utcnow()
            },
            {
                "topic": "visitation_rights",
                "category": "Visitation",
                "title": "Visitation Rights with Your Child",
                "summary": "Your right to visit your child in foster care",
                "statute_citation": "Texas Family Code §263.102",
                "policy_citation": "DFPS CPS Handbook §4500",
                "plain_language_explanation": "You have the right to regular visitation with your child unless a court specifically orders otherwise. Visits should be at least once per week and should work toward unsupervised and overnight visits as you complete services. CPS cannot cancel visits as punishment or deny visits because of minor service plan delays.",
                "what_this_means": "Visitation is a protected right, not a privilege CPS can take away. Every visit matters - it maintains your bond with your child and shows the court you're committed. CPS is supposed to facilitate visits, not create barriers. Visits should increase in frequency and duration over time, not stay the same or decrease.",
                "what_if_violated": "If CPS cancels visits without court authority or valid safety reasons, document every cancellation: date, reason given, who cancelled it. File a motion to enforce visitation and ask the judge to order make-up visits. Bring your documentation to court - judges take visitation violations seriously.",
                "last_verified_date": datetime.utcnow()
            }
        ]
        
        # Clear and seed legal library
        await db.legal_library.delete_many({})
        if legal_topics:
            await db.legal_library.insert_many(legal_topics)
        
        # Seed resources
        resources = [
            {
                "category": "emotional_support",
                "subcategory": "crisis",
                "title": "Crisis Text Line",
                "description": "24/7 crisis support via text message",
                "content": "Text HOME to 741741 to connect with a trained crisis counselor.",
                "links": [],
                "phone_numbers": ["741741 (text)"]
            },
            {
                "category": "emotional_support",
                "subcategory": "crisis",
                "title": "SAMHSA National Helpline",
                "description": "24/7 free confidential support for mental health and substance use",
                "content": "Treatment referral and information service available in English and Spanish.",
                "links": ["https://www.samhsa.gov/find-help/national-helpline"],
                "phone_numbers": ["1-800-662-4357"]
            },
            {
                "category": "legal_aid",
                "subcategory": "texas",
                "title": "Lone Star Legal Aid",
                "description": "Free civil legal services for low-income Texans in East and Gulf Coast regions",
                "content": "Provides free legal help in family law, housing, consumer, and other civil matters.",
                "links": ["https://www.lonestarlegal.org"],
                "phone_numbers": ["1-800-733-8394"]
            },
            {
                "category": "legal_aid",
                "subcategory": "texas",
                "title": "Texas RioGrande Legal Aid",
                "description": "Free legal services in South and West Texas",
                "content": "Serves 68 counties in Texas with family law, housing, and immigration legal help.",
                "links": ["https://www.trla.org"],
                "phone_numbers": ["1-888-988-9996"]
            },
            {
                "category": "parenting",
                "subcategory": "education",
                "title": "Parents as Teachers",
                "description": "Evidence-based home visiting program supporting parents",
                "content": "Free home visits from trained parent educators providing child development information and parenting support.",
                "links": ["https://parentsasteachers.org"],
                "phone_numbers": []
            },
            {
                "category": "substance_use",
                "subcategory": "treatment",
                "title": "SAMHSA Treatment Locator",
                "description": "Find substance use treatment facilities nationwide",
                "content": "Search for licensed treatment facilities by location, payment options, and services offered.",
                "links": ["https://findtreatment.gov"],
                "phone_numbers": ["1-800-662-4357"]
            },
            {
                "category": "domestic_violence",
                "subcategory": "crisis",
                "title": "National Domestic Violence Hotline",
                "description": "24/7 confidential support for domestic violence survivors",
                "content": "Crisis intervention, safety planning, and referrals to local services.",
                "links": ["https://www.thehotline.org"],
                "phone_numbers": ["1-800-799-7233"]
            },
            {
                "category": "mental_health",
                "subcategory": "texas",
                "title": "NAMI Texas",
                "description": "National Alliance on Mental Illness - Texas chapter",
                "content": "Mental health education, support groups, and advocacy.",
                "links": ["https://namitexas.org"],
                "phone_numbers": ["1-800-950-6264"]
            },
            {
                "category": "youth",
                "subcategory": "support",
                "title": "Texas Foster Youth Rights Hotline",
                "description": "Know your rights as a foster youth in Texas",
                "content": "Information about education rights, placement rights, and how to file complaints.",
                "links": ["https://www.dfps.texas.gov"],
                "phone_numbers": ["1-800-252-5400"]
            }
        ]
        
        # Clear and seed resources
        await db.resources.delete_many({})
        if resources:
            await db.resources.insert_many(resources)
        
        return {
            "message": "Database seeded successfully",
            "legal_topics": len(legal_topics),
            "resources": len(resources)
        }
        
    except Exception as e:
        logger.error(f"Seed error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Include router
app.include_router(api_router)

# Startup event
@app.on_event("startup")
async def startup_db():
    logger.info("SPCUF API Starting...")
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.cases.create_index("user_id")
    await db.documents.create_index([("case_id", 1), ("user_id", 1)])
    await db.timeline_events.create_index("case_id")
    await db.contacts.create_index("case_id")
    await db.deadlines.create_index("case_id")
    logger.info("Database indexes created")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    logger.info("Database connection closed")
