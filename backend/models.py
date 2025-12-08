from typing import Optional, List
from datetime import datetime
from sqlmodel import SQLModel, Field, JSON
from sqlalchemy import Column
import uuid

class User(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    email: str = Field(index=True, unique=True)
    hashed_password: str
    full_name: Optional[str] = None
    disabled: Optional[bool] = False

class Inventory(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str
    quantity: Optional[str] = None
    unit: Optional[str] = None
    location: Optional[str] = None
    category: Optional[str] = None
    expiry: Optional[str] = None
    image_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Recipes(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str
    chef: Optional[str] = None
    type: Optional[str] = None
    flavor: Optional[str] = None
    rating: int = Field(default=0)
    notes: Optional[str] = None
    image_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Settings(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    api_url: Optional[str] = Field(default='https://api.openai.com/v1')
    api_token: Optional[str] = None
    model: Optional[str] = Field(default='gpt-3.5-turbo')
    image_model: Optional[str] = Field(default='dall-e-3')
    share_image_model: Optional[str] = Field(default='dall-e-3')
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CookingLogs(SQLModel, table=True):
    __tablename__ = "cooking_logs"
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    date: datetime = Field(default_factory=datetime.utcnow)
    meal_name: str
    menu: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    ingredients: Optional[List[str]] = Field(default=None, sa_column=Column(JSON))
    mood_text: Optional[str] = None
    image_url: Optional[str] = None
    tags: Optional[List[str]] = Field(default=None, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)
