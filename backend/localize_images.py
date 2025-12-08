from sqlmodel import Session, select
from backend.models import Inventory, Recipes, CookingLogs
from backend.utils import save_image_from_url
from backend.database import engine
import re

def normalize_url(u: str) -> str:
    if not u:
        return u
    if u.startswith("/static"):
        return u
    if u.startswith("http://localhost") or u.startswith("https://localhost"):
        return re.sub(r"^https?://localhost(:\d+)?", "", u)
    return save_image_from_url(u)

def migrate_images():
    with Session(engine) as session:
        items = session.exec(select(Inventory)).all()
        for item in items:
            new_url = normalize_url(item.image_url)
            if new_url and new_url != item.image_url:
                item.image_url = new_url
                session.add(item)
        session.commit()

        recipes = session.exec(select(Recipes)).all()
        for item in recipes:
            new_url = normalize_url(item.image_url)
            if new_url and new_url != item.image_url:
                item.image_url = new_url
                session.add(item)
        session.commit()
        
        logs = session.exec(select(CookingLogs)).all()
        for item in logs:
            new_url = normalize_url(item.image_url)
            if new_url and new_url != item.image_url:
                item.image_url = new_url
                session.add(item)
        session.commit()

if __name__ == "__main__":
    migrate_images()
