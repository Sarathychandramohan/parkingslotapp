# app/main.py

from fastapi import FastAPI
from app.database import engine, Base

# 🔴 IMPORTANT: import models BEFORE create_all
from app import models  

from app.auth import router as auth_router
from app.parking import router as parking_router

app = FastAPI(title="Parking Spot Finder API")

# Create tables
Base.metadata.create_all(bind=engine)

app.include_router(auth_router)
app.include_router(parking_router)
