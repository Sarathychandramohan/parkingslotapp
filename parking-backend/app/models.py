# app/models.py

from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
from sqlalchemy.sql import func
# ------------------
# USER
# ------------------
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False)

    zones = relationship("ParkingZone", back_populates="admin")
    bookings = relationship("Booking", back_populates="user")


# ------------------
# PARKING ZONE
# ------------------
class ParkingZone(Base):
    __tablename__ = "parking_zones"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    latitude = Column(Float)
    longitude = Column(Float)
    total_slots = Column(Integer)
    available_slots = Column(Integer)

    admin_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    admin = relationship("User", back_populates="zones")
    slots = relationship("ParkingSlot", back_populates="zone")
    bookings = relationship("Booking", back_populates="zone")


# ------------------
# PARKING SLOT  ✅ MUST BE BEFORE Booking
# ------------------
class ParkingSlot(Base):
    __tablename__ = "parking_slots"

    id = Column(Integer, primary_key=True, index=True)
    slot_number = Column(String, nullable=False)
    vehicle_type = Column(String)
    status = Column(String, default="available")
    price_per_hour = Column(Float)

    zone_id = Column(Integer, ForeignKey("parking_zones.id"))
    zone = relationship("ParkingZone", back_populates="slots")


# ------------------
# BOOKING  ❗ AFTER ParkingSlot
# ------------------
class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    slot_id = Column(Integer, ForeignKey("parking_slots.id"))
    zone_id = Column(Integer, ForeignKey("parking_zones.id"))

    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime)
    status = Column(String, default="active")
    amount_paid = Column(Float, default=0)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    duration_hours = Column(Integer, nullable=False)

    user = relationship("User", back_populates="bookings")
    zone = relationship("ParkingZone", back_populates="bookings")
