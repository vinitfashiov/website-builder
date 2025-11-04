from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import razorpay
import hmac
import hashlib

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30 days

# Razorpay
RAZORPAY_KEY = os.environ.get('RAZORPAY_KEY_ID')
RAZORPAY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET')
razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY, RAZORPAY_SECRET))

# Admin credentials
ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', 'Admin1234')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', '22211161')

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    password_hash: str
    role: str = "customer"  # customer or admin
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class UserCreate(BaseModel):
    name: str
    phone: str
    password: str

class UserLogin(BaseModel):
    phone: str
    password: str

class AdminLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class WebsiteOrder(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    phone: str
    website_name: str
    category: str
    plan: str
    plan_price: int
    advance_paid: int = 9
    total_paid: int = 9
    status: str = "booked"  # booked, in-progress, completed
    razorpay_payment_id: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    razorpay_signature: Optional[str] = None
    website_url: Optional[str] = None
    admin_panel_url: Optional[str] = None
    admin_username: Optional[str] = None
    admin_password: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class CreateOrderInput(BaseModel):
    name: str
    phone: str
    password: str
    website_name: str
    category: str
    plan: str
    plan_price: int

class RazorpayOrderCreate(BaseModel):
    amount: int = 900  # in paise (9 rupees)

class PaymentVerification(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    order_data: CreateOrderInput

class EditRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    order_id: str
    request_text: str
    status: str = "pending"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class EditRequestCreate(BaseModel):
    request_text: str

class SupportTicket(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    message: str
    status: str = "open"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class SupportTicketCreate(BaseModel):
    message: str

class OrderUpdate(BaseModel):
    website_name: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    website_url: Optional[str] = None
    admin_panel_url: Optional[str] = None
    admin_username: Optional[str] = None
    admin_password: Optional[str] = None

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user is None:
        raise credentials_exception
    return User(**user)

async def get_admin_user(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# Auth Routes
@api_router.post("/auth/login", response_model=Token)
async def login(user_login: UserLogin):
    user = await db.users.find_one({"phone": user_login.phone}, {"_id": 0})
    if not user or not verify_password(user_login.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user["id"]})
    user_data = {k: v for k, v in user.items() if k != "password_hash"}
    return {"access_token": access_token, "token_type": "bearer", "user": user_data}

@api_router.post("/auth/admin/login", response_model=Token)
async def admin_login(admin_login: AdminLogin):
    if admin_login.username != ADMIN_USERNAME or admin_login.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    
    # Check if admin exists in DB
    admin = await db.users.find_one({"phone": "admin"}, {"_id": 0})
    if not admin:
        # Create admin user
        admin_user = User(
            id=str(uuid.uuid4()),
            name="Super Admin",
            phone="admin",
            password_hash=hash_password(ADMIN_PASSWORD),
            role="admin"
        )
        await db.users.insert_one(admin_user.model_dump())
        admin = admin_user.model_dump()
    
    access_token = create_access_token(data={"sub": admin["id"]})
    admin_data = {k: v for k, v in admin.items() if k != "password_hash"}
    return {"access_token": access_token, "token_type": "bearer", "user": admin_data}

@api_router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {k: v for k, v in current_user.model_dump().items() if k != "password_hash"}

# Razorpay Routes
@api_router.post("/razorpay/create-order")
async def create_razorpay_order(order_input: RazorpayOrderCreate):
    try:
        order_data = {
            "amount": order_input.amount,
            "currency": "INR",
            "payment_capture": 1
        }
        order = razorpay_client.order.create(data=order_data)
        return {"order_id": order["id"], "amount": order["amount"], "currency": order["currency"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/razorpay/verify-payment", response_model=Token)
async def verify_payment(payment: PaymentVerification):
    try:
        # Verify signature
        generated_signature = hmac.new(
            RAZORPAY_SECRET.encode(),
            f"{payment.razorpay_order_id}|{payment.razorpay_payment_id}".encode(),
            hashlib.sha256
        ).hexdigest()
        
        if generated_signature != payment.razorpay_signature:
            raise HTTPException(status_code=400, detail="Invalid payment signature")
        
        # Create user
        existing_user = await db.users.find_one({"phone": payment.order_data.phone}, {"_id": 0})
        if existing_user:
            user = User(**existing_user)
        else:
            user = User(
                name=payment.order_data.name,
                phone=payment.order_data.phone,
                password_hash=hash_password(payment.order_data.password)
            )
            await db.users.insert_one(user.model_dump())
        
        # Create order
        order = WebsiteOrder(
            user_id=user.id,
            name=payment.order_data.name,
            phone=payment.order_data.phone,
            website_name=payment.order_data.website_name,
            category=payment.order_data.category,
            plan=payment.order_data.plan,
            plan_price=payment.order_data.plan_price,
            razorpay_payment_id=payment.razorpay_payment_id,
            razorpay_order_id=payment.razorpay_order_id,
            razorpay_signature=payment.razorpay_signature
        )
        await db.orders.insert_one(order.model_dump())
        
        # Create token
        access_token = create_access_token(data={"sub": user.id})
        user_data = {k: v for k, v in user.model_dump().items() if k != "password_hash"}
        return {"access_token": access_token, "token_type": "bearer", "user": user_data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Customer Routes
@api_router.get("/customer/order", response_model=WebsiteOrder)
async def get_customer_order(current_user: User = Depends(get_current_user)):
    order = await db.orders.find_one({"user_id": current_user.id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="No order found")
    return WebsiteOrder(**order)

@api_router.post("/customer/edit-request", response_model=EditRequest)
async def create_edit_request(request_input: EditRequestCreate, current_user: User = Depends(get_current_user)):
    order = await db.orders.find_one({"user_id": current_user.id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="No order found")
    
    edit_request = EditRequest(
        user_id=current_user.id,
        order_id=order["id"],
        request_text=request_input.request_text
    )
    await db.edit_requests.insert_one(edit_request.model_dump())
    return edit_request

@api_router.get("/customer/edit-requests", response_model=List[EditRequest])
async def get_customer_edit_requests(current_user: User = Depends(get_current_user)):
    requests = await db.edit_requests.find({"user_id": current_user.id}, {"_id": 0}).to_list(100)
    return [EditRequest(**req) for req in requests]

@api_router.post("/customer/support", response_model=SupportTicket)
async def create_support_ticket(ticket_input: SupportTicketCreate, current_user: User = Depends(get_current_user)):
    ticket = SupportTicket(
        user_id=current_user.id,
        name=current_user.name,
        message=ticket_input.message
    )
    await db.support_tickets.insert_one(ticket.model_dump())
    return ticket

@api_router.get("/customer/support", response_model=List[SupportTicket])
async def get_customer_tickets(current_user: User = Depends(get_current_user)):
    tickets = await db.support_tickets.find({"user_id": current_user.id}, {"_id": 0}).to_list(100)
    return [SupportTicket(**ticket) for ticket in tickets]

@api_router.get("/customer/payments")
async def get_customer_payments(current_user: User = Depends(get_current_user)):
    order = await db.orders.find_one({"user_id": current_user.id}, {"_id": 0})
    if not order:
        return []
    
    return [{
        "id": order["id"],
        "amount": order["advance_paid"],
        "type": "Advance Payment",
        "payment_id": order.get("razorpay_payment_id"),
        "date": order["created_at"],
        "status": "Success"
    }]

# Admin Routes
@api_router.get("/admin/orders", response_model=List[WebsiteOrder])
async def get_all_orders(admin_user: User = Depends(get_admin_user)):
    orders = await db.orders.find({}, {"_id": 0}).to_list(1000)
    return [WebsiteOrder(**order) for order in orders]

@api_router.put("/admin/order/{order_id}", response_model=WebsiteOrder)
async def update_order(order_id: str, update_data: OrderUpdate, admin_user: User = Depends(get_admin_user)):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.orders.update_one({"id": order_id}, {"$set": update_dict})
    updated_order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    return WebsiteOrder(**updated_order)

@api_router.get("/admin/edit-requests", response_model=List[dict])
async def get_all_edit_requests(admin_user: User = Depends(get_admin_user)):
    requests = await db.edit_requests.find({}, {"_id": 0}).to_list(1000)
    result = []
    for req in requests:
        user = await db.users.find_one({"id": req["user_id"]}, {"_id": 0})
        order = await db.orders.find_one({"id": req["order_id"]}, {"_id": 0})
        result.append({
            **req,
            "user_name": user.get("name") if user else "Unknown",
            "website_name": order.get("website_name") if order else "Unknown"
        })
    return result

@api_router.get("/admin/support-tickets", response_model=List[SupportTicket])
async def get_all_support_tickets(admin_user: User = Depends(get_admin_user)):
    tickets = await db.support_tickets.find({}, {"_id": 0}).to_list(1000)
    return [SupportTicket(**ticket) for ticket in tickets]

@api_router.get("/admin/stats")
async def get_admin_stats(admin_user: User = Depends(get_admin_user)):
    total_orders = await db.orders.count_documents({})
    booked = await db.orders.count_documents({"status": "booked"})
    in_progress = await db.orders.count_documents({"status": "in-progress"})
    completed = await db.orders.count_documents({"status": "completed"})
    pending_edits = await db.edit_requests.count_documents({"status": "pending"})
    open_tickets = await db.support_tickets.count_documents({"status": "open"})
    
    # Calculate total revenue
    orders = await db.orders.find({}, {"_id": 0, "advance_paid": 1}).to_list(1000)
    total_revenue = sum(order.get("advance_paid", 0) for order in orders)
    
    return {
        "total_orders": total_orders,
        "booked": booked,
        "in_progress": in_progress,
        "completed": completed,
        "pending_edits": pending_edits,
        "open_tickets": open_tickets,
        "total_revenue": total_revenue
    }

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()