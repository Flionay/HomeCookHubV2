from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlmodel import SQLModel, Session, select
from typing import List, Optional
import requests
import os

from .database import create_db_and_tables, get_session, engine, sqlite_file_name
from .models import User, Inventory, Recipes, Settings, CookingLogs
from .auth import verify_password, create_access_token, get_current_user, get_password_hash
from .utils import save_image_from_url

app = FastAPI()

class UserCreate(SQLModel):
    email: str
    password: str
    full_name: Optional[str] = None

class UserRead(SQLModel):
    id: str
    email: str
    full_name: Optional[str] = None
    disabled: Optional[bool] = False

class UserUpdate(SQLModel):
    email: Optional[str] = None
    password: Optional[str] = None
    full_name: Optional[str] = None

def generate_inventory_image_task(item_id: str):
    with Session(engine) as session:
        # 1. Get Item and Settings
        item = session.get(Inventory, item_id)
        settings = session.exec(select(Settings)).first()
        
        if not item or not settings or not settings.api_token:
            print(f"Missing item or settings for generation (Item ID: {item_id})")
            return

        # 2. Prepare Request
        model = settings.image_model or "dall-e-2"
        is_dalle_3 = "dall-e-3" in model.lower()
        size = "1024x1024" if is_dalle_3 else "256x256"
        
        prompt = f"Single 3D icon of {item.name}, isometric view, minimal, clean, gray #F5F5F5 background, high quality"
        
        # 3. Call API
        try:
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {settings.api_token}"
            }
            # Handle base URL (remove trailing slash if needed)
            base_url = settings.api_url.rstrip("/")
            url = f"{base_url}/images/generations"
            
            payload = {
                "model": model,
                "prompt": prompt,
                "n": 1,
                "size": size
            }
            
            print(f"Starting background generation for {item.name}...")
            response = requests.post(url, headers=headers, json=payload, timeout=60)
            response.raise_for_status()
            data = response.json()
            
            if data.get("data"):
                image_url = data["data"][0]["url"]
                # 4. Save and Update
                local_url = save_image_from_url(image_url)
                item.image_url = local_url
                session.add(item)
                session.commit()
                print(f"Successfully generated and saved image for item {item.name}")
            else:
                print("No image data in response")
                
        except Exception as e:
            print(f"Background generation failed for {item.name}: {e}")

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
static_dir = os.getenv("STATIC_DIR", "backend/static")
if not os.path.exists(static_dir):
    os.makedirs(static_dir)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# Auth Endpoints
@app.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    statement = select(User).where(User.email == form_data.username)
    user = session.exec(statement).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer", "user": {"email": user.email, "full_name": user.full_name}}

@app.get("/users/me", response_model=UserRead)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

# User Management
@app.get("/users", response_model=List[UserRead])
def read_users(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    return session.exec(select(User)).all()

@app.post("/users", response_model=UserRead)
def create_user(user_in: UserCreate, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    # Check if user exists
    existing_user = session.exec(select(User).where(User.email == user_in.email)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user_in.password)
    user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

@app.put("/users/{user_id}", response_model=UserRead)
def update_user(user_id: str, user_in: UserUpdate, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_in.email:
        # Check if email is taken by another user
        existing_user = session.exec(select(User).where(User.email == user_in.email)).first()
        if existing_user and existing_user.id != user_id:
             raise HTTPException(status_code=400, detail="Email already registered")
        user.email = user_in.email
        
    if user_in.full_name is not None:
        user.full_name = user_in.full_name
        
    if user_in.password:
        user.hashed_password = get_password_hash(user_in.password)
        
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

@app.delete("/users/{user_id}")
def delete_user(user_id: str, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.id == current_user.id:
         raise HTTPException(status_code=400, detail="Cannot delete yourself")

    session.delete(user)
    session.commit()
    return {"ok": True}

# System Backup
@app.get("/backup/db")
def download_backup(current_user: User = Depends(get_current_user)):
    if not os.path.exists(sqlite_file_name):
        raise HTTPException(status_code=404, detail="Database file not found")
    return FileResponse(path=sqlite_file_name, filename=f"backup_{sqlite_file_name}", media_type='application/octet-stream')

# Business APIs

# Inventory
@app.get("/inventory", response_model=List[Inventory])
def read_inventory(session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    return session.exec(select(Inventory)).all()

@app.post("/inventory", response_model=Inventory)
def create_inventory(item: Inventory, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    if item.image_url:
        item.image_url = save_image_from_url(item.image_url)
    session.add(item)
    session.commit()
    session.refresh(item)
    return item

@app.delete("/inventory/{item_id}")
def delete_inventory(item_id: str, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    item = session.get(Inventory, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    session.delete(item)
    session.commit()
    return {"ok": True}

@app.put("/inventory/{item_id}", response_model=Inventory)
def update_inventory(item_id: str, item_in: Inventory, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    item = session.get(Inventory, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item_data = item_in.dict(exclude_unset=True)
    
    if "image_url" in item_data and item_data["image_url"]:
        item_data["image_url"] = save_image_from_url(item_data["image_url"])
        
    for key, value in item_data.items():
        setattr(item, key, value)
    session.add(item)
    session.commit()
    session.refresh(item)
    return item

@app.post("/inventory/{item_id}/generate_image")
async def generate_inventory_image(
    item_id: str, 
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user)
):
    item = session.get(Inventory, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    background_tasks.add_task(generate_inventory_image_task, item_id)
    return {"message": "Image generation started in background"}

# Recipes
@app.get("/recipes", response_model=List[Recipes])
def read_recipes(session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    return session.exec(select(Recipes)).all()

@app.post("/recipes", response_model=Recipes)
def create_recipe(recipe: Recipes, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    if recipe.image_url:
        recipe.image_url = save_image_from_url(recipe.image_url)
    session.add(recipe)
    session.commit()
    session.refresh(recipe)
    return recipe

@app.delete("/recipes/{recipe_id}")
def delete_recipe(recipe_id: str, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    recipe = session.get(Recipes, recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    session.delete(recipe)
    session.commit()
    return {"ok": True}

@app.put("/recipes/{recipe_id}", response_model=Recipes)
def update_recipe(recipe_id: str, recipe_in: Recipes, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    recipe = session.get(Recipes, recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    recipe_data = recipe_in.dict(exclude_unset=True)
    
    if "image_url" in recipe_data and recipe_data["image_url"]:
        recipe_data["image_url"] = save_image_from_url(recipe_data["image_url"])
        
    for key, value in recipe_data.items():
        setattr(recipe, key, value)
    session.add(recipe)
    session.commit()
    session.refresh(recipe)
    return recipe

# Settings
@app.get("/settings", response_model=Settings)
def read_settings(session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    settings = session.exec(select(Settings)).first()
    if not settings:
        settings = Settings()
        session.add(settings)
        session.commit()
        session.refresh(settings)
    return settings

@app.put("/settings/{settings_id}", response_model=Settings)
def update_settings(settings_id: str, settings_in: Settings, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    settings = session.get(Settings, settings_id)
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")
    settings_data = settings_in.dict(exclude_unset=True)
    for key, value in settings_data.items():
        setattr(settings, key, value)
    session.add(settings)
    session.commit()
    session.refresh(settings)
    return settings

# Cooking Logs
@app.get("/cooking_logs", response_model=List[CookingLogs])
def read_cooking_logs(session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    return session.exec(select(CookingLogs).order_by(CookingLogs.date.desc())).all()

@app.post("/cooking_logs", response_model=CookingLogs)
def create_cooking_log(log: CookingLogs, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    if log.image_url:
        # Use higher quality and larger size for cooking logs (memories)
        log.image_url = save_image_from_url(log.image_url, max_size=(1600, 1600), quality=95)
    session.add(log)
    session.commit()
    session.refresh(log)
    return log

