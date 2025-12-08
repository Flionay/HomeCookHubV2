import os
import uuid
import requests
from PIL import Image
from io import BytesIO

# Use env var for static dir to support both local and docker
STATIC_IMAGE_DIR = os.getenv("STATIC_IMAGE_DIR", "backend/static/images")
BASE_URL = os.getenv("APP_BASE_URL", "http://localhost:8000")

def ensure_static_dir():
    if not os.path.exists(STATIC_IMAGE_DIR):
        os.makedirs(STATIC_IMAGE_DIR)

def compress_image(image: Image.Image, max_size=(800, 800), quality=85) -> Image.Image:
    """
    Resize and compress image.
    """
    if image.mode in ("RGBA", "P"):
        image = image.convert("RGB")
    
    image.thumbnail(max_size, Image.Resampling.LANCZOS)
    return image

def save_image_from_url(url: str, max_size=(800, 800), quality=85) -> str:
    """
    Downloads image from URL, compresses it, saves to static dir,
    and returns the local URL.
    Returns None if failed.
    """
    if not url:
        return url
    
    # Check if it's already a local static file
    if url.startswith("/static"):
        return url
    
    # Check if it starts with BASE_URL (if BASE_URL is set and not empty)
    if BASE_URL and url.startswith(BASE_URL):
        return url

    ensure_static_dir()
    
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        img = Image.open(BytesIO(response.content))
        img = compress_image(img, max_size=max_size, quality=quality)
        
        filename = f"{uuid.uuid4()}.jpg"
        filepath = os.path.join(STATIC_IMAGE_DIR, filename)
        
        img.save(filepath, "JPEG", quality=quality, optimize=True)
        
        return f"{BASE_URL}/static/images/{filename}"
    except Exception as e:
        print(f"Error processing image {url}: {e}")
        return url  # Return original URL if failed, so we don't lose data
