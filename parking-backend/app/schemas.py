from pydantic import BaseModel, EmailStr, Field
from pydantic import StringConstraints
from typing_extensions import Annotated, Literal
from typing import Optional
from datetime import datetime

# ======================
# AUTH SCHEMAS (EXISTING)
# ======================
class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: Annotated[str, StringConstraints(min_length=6, max_length=64)]
    role: Literal["driver", "admin"]


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: Literal["driver", "admin"]


class UserCreate(BaseModel):
    email: str
    password: str = Field(min_length=8, max_length=64)
# ======================
# PARKING ZONE SCHEMAS
# ======================
class ParkingZoneCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    total_slots: int = Field(..., gt=0)


class ParkingZoneResponse(BaseModel):
    id: int
    name: str
    latitude: float
    longitude: float
    total_slots: int
    available_slots: int
    admin_id: int

    class Config:
        from_attributes = True


class AvailabilityUpdate(BaseModel):
    available_slots: int = Field(..., ge=0)


# ======================
# PARKING SLOT SCHEMAS
# ======================
class ParkingSlotCreate(BaseModel):
    slot_number: str = Field(..., min_length=1, max_length=10)
    vehicle_type: Literal["car", "bike", "truck"]
    price_per_hour: float = Field(default=20.0, gt=0)


class ParkingSlotUpdate(BaseModel):
    status: Literal["available", "occupied"]


class ParkingSlotResponse(BaseModel):
    id: int
    slot_number: str
    vehicle_type: str
    status: str
    price_per_hour: float
    zone_id: int

    class Config:
        from_attributes = True


# ======================
# BOOKING SCHEMAS
# ======================
class BookingCreate(BaseModel):
    zone_id: int
    slot_id: Optional[int] = None
    duration_hours: int = Field(default=1, gt=0, le=24)


class BookingExtend(BaseModel):
    additional_hours: int = Field(..., gt=0, le=12)


class BookingResponse(BaseModel):
    id: int
    user_id: int
    zone_id: int
    slot_id: Optional[int]
    start_time: datetime
    end_time: Optional[datetime]
    status: str
    amount_paid: float

    class Config:
        from_attributes = True


# ======================
# BOOKING SCHEMAS
# ======================
class BookingCreate(BaseModel):
    zone_id: int
    slot_id: Optional[int] = None
    duration_hours: int = Field(default=1, gt=0, le=24)


class BookingExtend(BaseModel):
    additional_hours: int = Field(..., gt=0, le=12)


class BookingResponse(BaseModel):
    id: int
    user_id: int
    zone_id: int
    slot_id: Optional[int]
    start_time: datetime
    end_time: Optional[datetime]
    status: str
    amount_paid: float
    duration_hours: int
    
    # Additional info
    zone_name: Optional[str] = None
    slot_number: Optional[str] = None

    class Config:
        from_attributes = True


class BookingHistoryResponse(BaseModel):
    id: int
    zone_id: int
    zone_name: str
    slot_number: Optional[str]
    start_time: datetime
    end_time: Optional[datetime]
    duration_hours: int
    amount_paid: float
    status: str

    class Config:
        from_attributes = True


class DriverStatsResponse(BaseModel):
    total_bookings: int
    active_bookings: int
    completed_bookings: int
    cancelled_bookings: int
    total_amount_spent: float
    total_hours_parked: int