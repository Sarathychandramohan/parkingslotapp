from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app import models, schemas
from app.deps import get_db, get_current_user, require_admin, require_driver
from app.utils import calculate_distance

from datetime import datetime, timedelta
from typing import List, Optional
router = APIRouter(prefix="/parking", tags=["Parking"])

from sqlalchemy.sql import func
# ======================
# ADMIN: CREATE ZONE
# ======================
@router.post("/zones", status_code=201)
def create_zone(
    data: schemas.ParkingZoneCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin)
):
    """
    Admin creates a parking zone.
    Each admin can manage only ONE zone (enforced here).
    """
    # Check if admin already has a zone
    existing_zone = db.query(models.ParkingZone).filter(
        models.ParkingZone.admin_id == admin.id
    ).first()

    if existing_zone:
        raise HTTPException(
            status_code=400,
            detail="You already manage a parking zone"
        )

    # Create new zone
    zone = models.ParkingZone(
        name=data.name,
        latitude=data.latitude,
        longitude=data.longitude,
        total_slots=data.total_slots,
        available_slots=data.total_slots,  # Initially all slots available
        admin_id=admin.id
    )

    db.add(zone)
    db.commit()
    db.refresh(zone)

    return {
        "message": "Parking zone created successfully",
        "zone_id": zone.id,
        "name": zone.name
    }


# ======================
# ADMIN: UPDATE AVAILABILITY
# ======================
@router.patch("/zones/{zone_id}/availability")
def update_availability(
    zone_id: int,
    data: schemas.AvailabilityUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin)
):
    """
    Admin manually updates available slots count.
    Used for quick adjustments without slot grid.
    """
    zone = db.query(models.ParkingZone).filter(
        models.ParkingZone.id == zone_id,
        models.ParkingZone.admin_id == admin.id
    ).first()

    if not zone:
        raise HTTPException(
            status_code=404,
            detail="Zone not found or you don't have access"
        )

    if data.available_slots > zone.total_slots:
        raise HTTPException(
            status_code=400,
            detail=f"Available slots cannot exceed total slots ({zone.total_slots})"
        )

    zone.available_slots = data.available_slots
    db.commit()

    return {
        "message": "Availability updated",
        "available_slots": zone.available_slots,
        "total_slots": zone.total_slots
    }


# ======================
# DRIVER: GET ALL ZONES
# ======================
@router.get("/zones", response_model=List[schemas.ParkingZoneResponse])
def get_all_zones(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Fetch all parking zones.
    Available to both drivers and admins.
    """
    zones = db.query(models.ParkingZone).all()
    return zones


# ======================
# DRIVER: SEARCH ZONES BY NAME
# ======================
@router.get("/zones/search", response_model=List[schemas.ParkingZoneResponse])
def search_zones(
    name: str = Query(..., min_length=1, description="Search by zone name"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Search parking zones by name (case-insensitive partial match).
    """
    zones = db.query(models.ParkingZone).filter(
        models.ParkingZone.name.ilike(f"%{name}%")
    ).all()

    return zones


# ======================
# DRIVER: GET NEARBY ZONES
# ======================
@router.get("/zones/nearby", response_model=List[schemas.ParkingZoneResponse])
def get_nearby_zones(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(default=5.0, gt=0, le=50, description="Search radius in km"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Find parking zones within a specified radius from user's location.
    Uses Haversine formula for distance calculation.
    """
    all_zones = db.query(models.ParkingZone).all()

    nearby_zones = []
    for zone in all_zones:
        distance = calculate_distance(latitude, longitude, zone.latitude, zone.longitude)
        if distance <= radius_km:
            nearby_zones.append(zone)

    # Sort by distance (closest first)
    nearby_zones.sort(
        key=lambda z: calculate_distance(latitude, longitude, z.latitude, z.longitude)
    )

    return nearby_zones


# ======================
# ADMIN: GET MY ZONE
# ======================
@router.get("/zones/my-zone", response_model=schemas.ParkingZoneResponse)
def get_my_zone(
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin)
):
    """
    Admin fetches their managed parking zone.
    """
    zone = db.query(models.ParkingZone).filter(
        models.ParkingZone.admin_id == admin.id
    ).first()

    if not zone:
        raise HTTPException(
            status_code=404,
            detail="You don't manage any parking zone yet"
        )

    return zone



# ======================
# PHASE 2B: SLOT GRID MANAGEMENT
# ======================

# ======================
# ADMIN: CREATE MULTIPLE SLOTS (BULK)
# ======================
# @router.post("/zones/{zone_id}/slots/bulk", status_code=201)
# def create_slots_bulk(
#     zone_id: int,
#     slots: List[schemas.ParkingSlotCreate],
#     db: Session = Depends(get_db),
#     admin: models.User = Depends(require_admin)
# ):
#     """
#     Admin creates multiple slots at once for their parking zone.
#     Used for initial slot grid setup.
    
#     Example: Create A1-A10, B1-B10 slots in one request.
#     """
#     # Verify zone ownership
#     zone = db.query(models.ParkingZone).filter(
#         models.ParkingZone.id == zone_id,
#         models.ParkingZone.admin_id == admin.id
#     ).first()

#     if not zone:
#         raise HTTPException(
#             status_code=404,
#             detail="Zone not found or you don't have access"
#         )

#     # Check for duplicate slot numbers
#     slot_numbers = [slot.slot_number for slot in slots]
#     if len(slot_numbers) != len(set(slot_numbers)):
#         raise HTTPException(
#             status_code=400,
#             detail="Duplicate slot numbers detected"
#         )

#     # Check if any slot numbers already exist
#     existing_slots = db.query(models.ParkingSlot).filter(
#         models.ParkingSlot.zone_id == zone_id,
#         models.ParkingSlot.slot_number.in_(slot_numbers)
#     ).all()

#     if existing_slots:
#         existing_numbers = [s.slot_number for s in existing_slots]
#         raise HTTPException(
#             status_code=400,
#             detail=f"Slot numbers already exist: {', '.join(existing_numbers)}"
#         )

#     # Create all slots
#     new_slots = []
#     for slot_data in slots:
#         slot = models.ParkingSlot(
#             slot_number=slot_data.slot_number,
#             vehicle_type=slot_data.vehicle_type,
#             price_per_hour=slot_data.price_per_hour,
#             status="available",
#             zone_id=zone_id
#         )
#         new_slots.append(slot)

#     db.add_all(new_slots)
#     db.commit()

#     return {
#         "message": f"Successfully created {len(new_slots)} slots",
#         "zone_id": zone_id,
#         "zone_name": zone.name,
#         "slots_created": len(new_slots)
#     }


# ======================
# ADMIN: CREATE SINGLE SLOT
# ======================
@router.post("/zones/{zone_id}/slots", status_code=201)
def create_single_slot(
    zone_id: int,
    slot_data: schemas.ParkingSlotCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin)
):
    """
    Admin creates a single slot in their parking zone.
    """
    # Verify zone ownership
    zone = db.query(models.ParkingZone).filter(
        models.ParkingZone.id == zone_id,
        models.ParkingZone.admin_id == admin.id
    ).first()

    if not zone:
        raise HTTPException(
            status_code=404,
            detail="Zone not found or you don't have access"
        )

    # Check if slot number already exists
    existing_slot = db.query(models.ParkingSlot).filter(
        models.ParkingSlot.zone_id == zone_id,
        models.ParkingSlot.slot_number == slot_data.slot_number
    ).first()

    if existing_slot:
        raise HTTPException(
            status_code=400,
            detail=f"Slot {slot_data.slot_number} already exists"
        )

    # Create slot
    slot = models.ParkingSlot(
        slot_number=slot_data.slot_number,
        vehicle_type=slot_data.vehicle_type,
        price_per_hour=slot_data.price_per_hour,
        status="available",
        zone_id=zone_id
    )

    db.add(slot)
    db.commit()
    db.refresh(slot)

    return {
        "message": "Slot created successfully",
        "slot_id": slot.id,
        "slot_number": slot.slot_number
    }


# ======================
# ADMIN: GET ALL SLOTS (GRID VIEW)
# ======================
@router.get("/zones/{zone_id}/slots", response_model=List[schemas.ParkingSlotResponse])
def get_zone_slots(
    zone_id: int,
    vehicle_type: Optional[str] = Query(None, description="Filter by vehicle type"),
    status: Optional[str] = Query(None, description="Filter by status"),
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin)
):
    """
    Admin fetches all slots for their parking zone.
    Used to render the slot grid UI.
    
    Supports filtering by vehicle_type and status.
    """
    # Verify zone ownership
    zone = db.query(models.ParkingZone).filter(
        models.ParkingZone.id == zone_id,
        models.ParkingZone.admin_id == admin.id
    ).first()

    if not zone:
        raise HTTPException(
            status_code=404,
            detail="Zone not found or you don't have access"
        )

    # Build query
    query = db.query(models.ParkingSlot).filter(
        models.ParkingSlot.zone_id == zone_id
    )

    # Apply filters
    if vehicle_type:
        query = query.filter(models.ParkingSlot.vehicle_type == vehicle_type)
    if status:
        query = query.filter(models.ParkingSlot.status == status)

    slots = query.order_by(models.ParkingSlot.slot_number).all()

    return slots


# ======================
# ADMIN: UPDATE SLOT STATUS
# ======================
@router.patch("/zones/{zone_id}/slots/{slot_id}/status")
def update_slot_status(
    zone_id: int,
    slot_id: int,
    data: schemas.ParkingSlotUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin)
):
    """
    Admin updates slot status (available ↔ occupied).
    
    CRITICAL LOGIC:
    - available → occupied: zone.available_slots--
    - occupied → available: zone.available_slots++
    
    This keeps zone availability in sync with slot grid.
    """
    # Verify zone ownership
    zone = db.query(models.ParkingZone).filter(
        models.ParkingZone.id == zone_id,
        models.ParkingZone.admin_id == admin.id
    ).first()

    if not zone:
        raise HTTPException(
            status_code=404,
            detail="Zone not found or you don't have access"
        )

    # Get slot
    slot = db.query(models.ParkingSlot).filter(
        models.ParkingSlot.id == slot_id,
        models.ParkingSlot.zone_id == zone_id
    ).first()

    if not slot:
        raise HTTPException(
            status_code=404,
            detail="Slot not found in this zone"
        )

    # Get old status
    old_status = slot.status
    new_status = data.status

    # No change needed
    if old_status == new_status:
        return {
            "message": "Slot status unchanged",
            "slot_number": slot.slot_number,
            "status": slot.status
        }

    # Update slot status
    slot.status = new_status

    # 🔥 CRITICAL: Auto-sync zone availability
    if old_status == "available" and new_status == "occupied":
        # Slot became occupied → decrease availability
        if zone.available_slots > 0:
            zone.available_slots -= 1
    elif old_status == "occupied" and new_status == "available":
        # Slot became available → increase availability
        if zone.available_slots < zone.total_slots:
            zone.available_slots += 1

    db.commit()
    db.refresh(slot)
    db.refresh(zone)

    return {
        "message": "Slot status updated successfully",
        "slot_number": slot.slot_number,
        "old_status": old_status,
        "new_status": new_status,
        "zone_available_slots": zone.available_slots,
        "zone_total_slots": zone.total_slots
    }


# ======================
# ADMIN: DELETE SLOT
# ======================
@router.delete("/zones/{zone_id}/slots/{slot_id}")
def delete_slot(
    zone_id: int,
    slot_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin)
):
    """
    Admin deletes a parking slot.
    WARNING: Only delete if slot has no active bookings.
    """
    # Verify zone ownership
    zone = db.query(models.ParkingZone).filter(
        models.ParkingZone.id == zone_id,
        models.ParkingZone.admin_id == admin.id
    ).first()

    if not zone:
        raise HTTPException(
            status_code=404,
            detail="Zone not found or you don't have access"
        )

    # Get slot
    slot = db.query(models.ParkingSlot).filter(
        models.ParkingSlot.id == slot_id,
        models.ParkingSlot.zone_id == zone_id
    ).first()

    if not slot:
        raise HTTPException(
            status_code=404,
            detail="Slot not found in this zone"
        )

    # Check for active bookings
    active_booking = db.query(models.Booking).filter(
        models.Booking.slot_id == slot_id,
        models.Booking.status == "active"
    ).first()

    if active_booking:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete slot with active booking"
        )

    # If slot was available, adjust zone availability
    if slot.status == "available" and zone.available_slots > 0:
        zone.available_slots -= 1

    # Decrease total slots
    zone.total_slots -= 1

    db.delete(slot)
    db.commit()

    return {
        "message": "Slot deleted successfully",
        "deleted_slot": slot_id,
        "zone_total_slots": zone.total_slots,
        "zone_available_slots": zone.available_slots
    }


# ======================
# ADMIN: GET SLOT STATISTICS
# ======================
@router.get("/zones/{zone_id}/slots/stats")
def get_slot_statistics(
    zone_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin)
):
    """
    Admin gets slot statistics for their parking zone.
    Useful for dashboard metrics.
    """
    # Verify zone ownership
    zone = db.query(models.ParkingZone).filter(
        models.ParkingZone.id == zone_id,
        models.ParkingZone.admin_id == admin.id
    ).first()

    if not zone:
        raise HTTPException(
            status_code=404,
            detail="Zone not found or you don't have access"
        )

    # Count slots by status
    total_slots = db.query(models.ParkingSlot).filter(
        models.ParkingSlot.zone_id == zone_id
    ).count()

    available_slots = db.query(models.ParkingSlot).filter(
        models.ParkingSlot.zone_id == zone_id,
        models.ParkingSlot.status == "available"
    ).count()

    occupied_slots = db.query(models.ParkingSlot).filter(
        models.ParkingSlot.zone_id == zone_id,
        models.ParkingSlot.status == "occupied"
    ).count()

    # Count by vehicle type
    car_slots = db.query(models.ParkingSlot).filter(
        models.ParkingSlot.zone_id == zone_id,
        models.ParkingSlot.vehicle_type == "car"
    ).count()

    bike_slots = db.query(models.ParkingSlot).filter(
        models.ParkingSlot.zone_id == zone_id,
        models.ParkingSlot.vehicle_type == "bike"
    ).count()

    truck_slots = db.query(models.ParkingSlot).filter(
        models.ParkingSlot.zone_id == zone_id,
        models.ParkingSlot.vehicle_type == "truck"
    ).count()

    return {
        "zone_id": zone_id,
        "zone_name": zone.name,
        "total_slots": total_slots,
        "available_slots": available_slots,
        "occupied_slots": occupied_slots,
        "occupancy_rate": round((occupied_slots / total_slots * 100), 2) if total_slots > 0 else 0,
        "vehicle_types": {
            "car": car_slots,
            "bike": bike_slots,
            "truck": truck_slots
        }
    }



# ======================
# PHASE 2C: BOOKINGS
# ======================

# ======================
# DRIVER: CREATE BOOKING
# ======================
@router.post("/bookings", status_code=201)
def create_booking(
    data: schemas.BookingCreate,
    db: Session = Depends(get_db),
    driver: models.User = Depends(require_driver)
):
    """
    Driver creates a parking booking.
    
    Logic:
    1. Check if zone has available slots
    2. Find an available slot (if slot_id not provided)
    3. Create booking
    4. Mark slot as occupied
    5. Decrease zone availability
    6. Calculate amount based on duration
    """
    # Get zone
    zone = db.query(models.ParkingZone).filter(
        models.ParkingZone.id == data.zone_id
    ).first()

    if not zone:
        raise HTTPException(
            status_code=404,
            detail="Parking zone not found"
        )

    # Check if driver already has an active booking
    existing_booking = db.query(models.Booking).filter(
        models.Booking.user_id == driver.id,
        models.Booking.status == "active"
    ).first()

    if existing_booking:
        raise HTTPException(
            status_code=400,
            detail="You already have an active booking. Complete or cancel it first."
        )

    # Check zone availability
    if zone.available_slots <= 0:
        raise HTTPException(
            status_code=400,
            detail="No available slots in this parking zone"
        )

    # Find or assign slot
    slot = None
    if data.slot_id:
        # Specific slot requested
        slot = db.query(models.ParkingSlot).filter(
            models.ParkingSlot.id == data.slot_id,
            models.ParkingSlot.zone_id == data.zone_id,
            models.ParkingSlot.status == "available"
        ).first()

        if not slot:
            raise HTTPException(
                status_code=400,
                detail="Requested slot is not available"
            )
    else:
        # Auto-assign any available slot
        slot = db.query(models.ParkingSlot).filter(
            models.ParkingSlot.zone_id == data.zone_id,
            models.ParkingSlot.status == "available"
        ).first()

        if not slot:
            raise HTTPException(
                status_code=400,
                detail="No available slots in this zone"
            )

    # Calculate end time and amount
    start_time = datetime.utcnow()
    end_time = start_time + timedelta(hours=data.duration_hours)
    amount = slot.price_per_hour * data.duration_hours

    # Create booking
    booking = models.Booking(
        user_id=driver.id,
        zone_id=data.zone_id,
        slot_id=slot.id,
        start_time=start_time,
        end_time=end_time,
        duration_hours=data.duration_hours,
        amount_paid=amount,
        status="active"
    )

    # Update slot status
    slot.status = "occupied"

    # Decrease zone availability
    zone.available_slots -= 1

    db.add(booking)
    db.commit()
    db.refresh(booking)

    return {
        "message": "Booking created successfully",
        "booking_id": booking.id,
        "zone_name": zone.name,
        "slot_number": slot.slot_number,
        "start_time": booking.start_time,
        "end_time": booking.end_time,
        "duration_hours": booking.duration_hours,
        "amount_paid": booking.amount_paid
    }


# ======================
# DRIVER: GET ACTIVE BOOKING
# ======================
@router.get("/bookings/active", response_model=schemas.BookingResponse)
def get_active_booking(
    db: Session = Depends(get_db),
    driver: models.User = Depends(require_driver)
):
    """
    Driver fetches their current active booking.
    """
    booking = db.query(models.Booking).filter(
        models.Booking.user_id == driver.id,
        models.Booking.status == "active"
    ).first()

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="No active booking found"
        )

    # Enrich response with zone and slot info
    zone = db.query(models.ParkingZone).filter(
        models.ParkingZone.id == booking.zone_id
    ).first()

    slot = db.query(models.ParkingSlot).filter(
        models.ParkingSlot.id == booking.slot_id
    ).first()

    response = schemas.BookingResponse.model_validate(booking)
    response.zone_name = zone.name if zone else None
    response.slot_number = slot.slot_number if slot else None

    return response


# ======================
# DRIVER: EXTEND BOOKING
# ======================
@router.patch("/bookings/{booking_id}/extend")
def extend_booking(
    booking_id: int,
    data: schemas.BookingExtend,
    db: Session = Depends(get_db),
    driver: models.User = Depends(require_driver)
):
    """
    Driver extends their active booking.
    
    Logic:
    1. Verify booking ownership
    2. Check if booking is active
    3. Extend end_time
    4. Calculate additional amount
    5. Update total amount
    """
    # Get booking
    booking = db.query(models.Booking).filter(
        models.Booking.id == booking_id,
        models.Booking.user_id == driver.id
    ).first()

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    if booking.status != "active":
        raise HTTPException(
            status_code=400,
            detail="Can only extend active bookings"
        )

    # Get slot for price calculation
    slot = db.query(models.ParkingSlot).filter(
        models.ParkingSlot.id == booking.slot_id
    ).first()

    if not slot:
        raise HTTPException(
            status_code=404,
            detail="Slot not found"
        )

    # Calculate new end time and additional amount
    additional_amount = slot.price_per_hour * data.additional_hours
    new_end_time = booking.end_time + timedelta(hours=data.additional_hours)
    new_duration = booking.duration_hours + data.additional_hours

    # Update booking
    booking.end_time = new_end_time
    booking.duration_hours = new_duration
    booking.amount_paid += additional_amount

    db.commit()
    db.refresh(booking)

    return {
        "message": "Booking extended successfully",
        "booking_id": booking.id,
        "new_end_time": booking.end_time,
        "additional_hours": data.additional_hours,
        "additional_amount": additional_amount,
        "total_amount": booking.amount_paid,
        "total_duration": booking.duration_hours
    }


# ======================
# DRIVER: COMPLETE BOOKING
# ======================
@router.patch("/bookings/{booking_id}/complete")
def complete_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    driver: models.User = Depends(require_driver)
):
    """
    Driver completes their booking (check-out).
    
    Logic:
    1. Verify booking ownership
    2. Mark booking as completed
    3. Free the slot (mark as available)
    4. Increase zone availability
    """
    # Get booking
    booking = db.query(models.Booking).filter(
        models.Booking.id == booking_id,
        models.Booking.user_id == driver.id
    ).first()

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    if booking.status != "active":
        raise HTTPException(
            status_code=400,
            detail="Booking is not active"
        )

    # Get slot and zone
    slot = db.query(models.ParkingSlot).filter(
        models.ParkingSlot.id == booking.slot_id
    ).first()

    zone = db.query(models.ParkingZone).filter(
        models.ParkingZone.id == booking.zone_id
    ).first()

    # Update booking status
    booking.status = "completed"
    booking.end_time = datetime.utcnow()  # Actual completion time

    # Free the slot
    if slot:
        slot.status = "available"

    # Increase zone availability
    if zone and zone.available_slots < zone.total_slots:
        zone.available_slots += 1

    db.commit()

    return {
        "message": "Booking completed successfully",
        "booking_id": booking.id,
        "slot_number": slot.slot_number if slot else None,
        "zone_name": zone.name if zone else None,
        "amount_paid": booking.amount_paid,
        "duration_hours": booking.duration_hours
    }


# ======================
# DRIVER: CANCEL BOOKING
# ======================
@router.patch("/bookings/{booking_id}/cancel")
def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    driver: models.User = Depends(require_driver)
):
    """
    Driver cancels their booking.
    
    Logic: Same as complete, but status = "cancelled"
    """
    # Get booking
    booking = db.query(models.Booking).filter(
        models.Booking.id == booking_id,
        models.Booking.user_id == driver.id
    ).first()

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    if booking.status != "active":
        raise HTTPException(
            status_code=400,
            detail="Can only cancel active bookings"
        )

    # Get slot and zone
    slot = db.query(models.ParkingSlot).filter(
        models.ParkingSlot.id == booking.slot_id
    ).first()

    zone = db.query(models.ParkingZone).filter(
        models.ParkingZone.id == booking.zone_id
    ).first()

    # Update booking status
    booking.status = "cancelled"

    # Free the slot
    if slot:
        slot.status = "available"

    # Increase zone availability
    if zone and zone.available_slots < zone.total_slots:
        zone.available_slots += 1

    db.commit()

    return {
        "message": "Booking cancelled successfully",
        "booking_id": booking.id,
        "refund_amount": 0  # MVP: No refund logic
    }


# ======================
# DRIVER: GET BOOKING HISTORY
# ======================
@router.get("/bookings/history", response_model=List[schemas.BookingHistoryResponse])
def get_booking_history(
    status: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(10, ge=1, le=100),
    skip: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    driver: models.User = Depends(require_driver)
):
    """
    Driver fetches their booking history.
    
    Supports:
    - Pagination (limit, skip)
    - Filter by status (active, completed, cancelled)
    """
    query = db.query(models.Booking).filter(
        models.Booking.user_id == driver.id
    )

    # Apply status filter
    if status:
        query = query.filter(models.Booking.status == status)

    # Order by most recent first
    bookings = query.order_by(
        models.Booking.id.desc()
    ).offset(skip).limit(limit).all()

    # Enrich with zone and slot info
    result = []
    for booking in bookings:
        zone = db.query(models.ParkingZone).filter(
            models.ParkingZone.id == booking.zone_id
        ).first()

        slot = db.query(models.ParkingSlot).filter(
            models.ParkingSlot.id == booking.slot_id
        ).first()

        result.append(schemas.BookingHistoryResponse(
            id=booking.id,
            zone_id=booking.zone_id,
            zone_name=zone.name if zone else "Unknown",
            slot_number=slot.slot_number if slot else None,
            start_time=booking.start_time,
            end_time=booking.end_time,
            duration_hours=booking.duration_hours,
            amount_paid=booking.amount_paid,
            status=booking.status
        ))

    return result


# ======================
# DRIVER: GET PROFILE STATS
# ======================
@router.get("/profile/stats", response_model=schemas.DriverStatsResponse)
def get_driver_stats(
    db: Session = Depends(get_db),
    driver: models.User = Depends(require_driver)
):
    """
    Driver fetches their profile statistics.
    Used in Profile page.
    """
    # Total bookings
    total_bookings = db.query(models.Booking).filter(
        models.Booking.user_id == driver.id
    ).count()

    # Active bookings
    active_bookings = db.query(models.Booking).filter(
        models.Booking.user_id == driver.id,
        models.Booking.status == "active"
    ).count()

    # Completed bookings
    completed_bookings = db.query(models.Booking).filter(
        models.Booking.user_id == driver.id,
        models.Booking.status == "completed"
    ).count()

    # Cancelled bookings
    cancelled_bookings = db.query(models.Booking).filter(
        models.Booking.user_id == driver.id,
        models.Booking.status == "cancelled"
    ).count()

    # Total amount spent
    bookings = db.query(models.Booking).filter(
        models.Booking.user_id == driver.id
    ).all()

    total_amount_spent = sum(b.amount_paid for b in bookings)
    total_hours_parked = sum(b.duration_hours for b in bookings)

    return schemas.DriverStatsResponse(
        total_bookings=total_bookings,
        active_bookings=active_bookings,
        completed_bookings=completed_bookings,
        cancelled_bookings=cancelled_bookings,
        total_amount_spent=round(total_amount_spent, 2),
        total_hours_parked=total_hours_parked
    )


# ======================
# ADMIN: VIEW ZONE BOOKINGS
# ======================
@router.get("/admin/bookings", response_model=List[schemas.BookingResponse])
def get_zone_bookings(
    status: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(20, ge=1, le=100),
    skip: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin)
):
    """
    Admin views all bookings for their parking zone.
    """
    # Get admin's zone
    zone = db.query(models.ParkingZone).filter(
        models.ParkingZone.admin_id == admin.id
    ).first()

    if not zone:
        raise HTTPException(
            status_code=404,
            detail="You don't manage any parking zone"
        )

    # Query bookings for this zone
    query = db.query(models.Booking).filter(
        models.Booking.zone_id == zone.id
    )

    # Apply status filter
    if status:
        query = query.filter(models.Booking.status == status)

    # Order by most recent first
    bookings = query.order_by(
        models.Booking.id.desc()
    ).offset(skip).limit(limit).all()

    # Enrich with slot info
    result = []
    for booking in bookings:
        slot = db.query(models.ParkingSlot).filter(
            models.ParkingSlot.id == booking.slot_id
        ).first()

        response = schemas.BookingResponse.model_validate(booking)
        response.zone_name = zone.name
        response.slot_number = slot.slot_number if slot else None
        result.append(response)

    return result


# ======================
# ADMIN: BOOKING STATISTICS
# ======================
@router.get("/admin/bookings/stats")
def get_admin_booking_stats(
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin)
):
    """
    Admin gets booking statistics for their zone.
    Dashboard metrics.
    """
    # Get admin's zone
    zone = db.query(models.ParkingZone).filter(
        models.ParkingZone.admin_id == admin.id
    ).first()

    if not zone:
        raise HTTPException(
            status_code=404,
            detail="You don't manage any parking zone"
        )

    # Total bookings
    total_bookings = db.query(models.Booking).filter(
        models.Booking.zone_id == zone.id
    ).count()

    # Active bookings
    active_bookings = db.query(models.Booking).filter(
        models.Booking.zone_id == zone.id,
        models.Booking.status == "active"
    ).count()

    # Completed bookings
    completed_bookings = db.query(models.Booking).filter(
        models.Booking.zone_id == zone.id,
        models.Booking.status == "completed"
    ).count()

    # Total revenue
    bookings = db.query(models.Booking).filter(
        models.Booking.zone_id == zone.id
    ).all()

    total_revenue = sum(b.amount_paid for b in bookings)

    # Average booking duration
    total_hours = sum(b.duration_hours for b in bookings)
    avg_duration = round(total_hours / total_bookings, 2) if total_bookings > 0 else 0

    return {
        "zone_id": zone.id,
        "zone_name": zone.name,
        "total_bookings": total_bookings,
        "active_bookings": active_bookings,
        "completed_bookings": completed_bookings,
        "total_revenue": round(total_revenue, 2),
        "average_booking_duration_hours": avg_duration,
        "current_occupancy": f"{zone.total_slots - zone.available_slots}/{zone.total_slots}"
    }