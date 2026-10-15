from typing import Optional, Dict
from pydantic import BaseModel, EmailStr, Field

# 1. EventOut & 2. EventDetail
class EventOut(BaseModel):
    id: int
    title: str
    category: str
    description: Optional[str] = None
    event_date: str
    event_time: str
    venue: str
    capacity: int
    fee: int = 0
    icon: Optional[str] = None
    available_seats: int

class EventDetail(EventOut):
    pass

# 3. RegistrationIn
class RegistrationIn(BaseModel):
    student_name: str
    roll_number: str
    email: str
    phone: Optional[str] = None

# 4. RegistrationOut
class RegistrationOut(BaseModel):
    id: int
    event_id: int
    student_name: str
    registered_at: str

# Helper registration model for listing with event title
class RegistrationItem(BaseModel):
    id: int
    event_id: int
    event_title: str
    student_name: str
    roll_number: str
    email: str
    phone: Optional[str] = None
    registered_at: str

# 5. StatsOut
class StatsOut(BaseModel):
    total_events: int
    total_registrations: int
    total_capacity: int
    overall_utilization_pct: float
    upcoming_events_count: int
    events_by_category: Dict[str, int]

# Stretch Goal Model: EventIn
class EventIn(BaseModel):
    title: str
    category: str
    description: Optional[str] = None
    event_date: str
    event_time: str
    venue: str
    capacity: int = Field(gt=0, description="Capacity must be greater than 0")
    fee: int = Field(ge=0, default=0)
    icon: Optional[str] = "📅"
