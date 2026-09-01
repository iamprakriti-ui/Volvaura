from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import logging
import secrets
from datetime import datetime, timezone, timedelta
from typing import Annotated, List, Literal, Optional

import bcrypt
import jwt
from bson import ObjectId
from fastapi import APIRouter, Depends, FastAPI, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, BeforeValidator, ConfigDict, EmailStr, Field

# ---------- Setup ----------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")

app = FastAPI(title="Volvaura API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("volvaura")


# ---------- Helpers ----------
def obj_id(v):
    if isinstance(v, ObjectId):
        return str(v)
    return str(v)


PyObjectId = Annotated[str, BeforeValidator(obj_id)]


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=60 * 24),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "type": "refresh",
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def set_auth_cookies(response: Response, access: str, refresh: str) -> None:
    common = dict(httponly=True, secure=True, samesite="none", path="/")
    response.set_cookie("access_token", access, max_age=60 * 60 * 24, **common)
    response.set_cookie("refresh_token", refresh, max_age=60 * 60 * 24 * 7, **common)


def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")


def serialize_user(u: dict) -> dict:
    u = dict(u)
    u["id"] = str(u.pop("_id"))
    u.pop("password_hash", None)
    return u


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return serialize_user(user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def require_role(*roles):
    async def _dep(user: dict = Depends(get_current_user)):
        if user.get("role") not in roles:
            raise HTTPException(status_code=403, detail=f"Requires role: {', '.join(roles)}")
        return user

    return _dep


# ---------- Models ----------
Role = Literal["creator", "editor", "admin"]


class RegisterIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6, max_length=200)
    role: Literal["creator", "editor"]


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordIn(BaseModel):
    email: EmailStr


class ResetPasswordIn(BaseModel):
    token: str
    new_password: str = Field(min_length=6, max_length=200)


class EditorProfileIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    bio: Optional[str] = ""
    headline: Optional[str] = ""
    skills: List[str] = []
    platforms: List[str] = []  # YouTube, Instagram, TikTok
    niches: List[str] = []  # Shorts, Reels, Documentary, MotionGraphics, AIEditing
    styles: List[str] = []  # Cinematic, Fast-cut, Editorial, Narrative
    price_per_video: Optional[int] = None
    turnaround_days: Optional[int] = None
    availability: Literal["available", "limited", "unavailable"] = "available"
    location: Optional[str] = ""
    reel_url: Optional[str] = ""
    avatar_url: Optional[str] = ""
    cover_url: Optional[str] = ""
    samples: List[dict] = []  # [{title, url, thumbnail, description}]


class ProjectIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str
    budget: Optional[int] = None
    style: Optional[str] = ""
    platform: Optional[str] = ""
    deadline: Optional[str] = ""


class CollabRequestIn(BaseModel):
    editor_id: str
    project_id: Optional[str] = None
    message: str = Field(min_length=1, max_length=1000)
    budget: Optional[int] = None


class RespondRequestIn(BaseModel):
    action: Literal["accept", "decline"]


# ---------- Auth Endpoints ----------
@api.post("/auth/register")
async def register(payload: RegisterIn, response: Response):
    email = payload.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
    doc = {
        "email": email,
        "password_hash": hash_password(payload.password),
        "name": payload.name.strip(),
        "role": payload.role,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "avatar_url": "",
    }
    result = await db.users.insert_one(doc)
    user_id = str(result.inserted_id)
    if payload.role == "editor":
        await db.editor_profiles.insert_one(
            {
                "user_id": user_id,
                "bio": "",
                "headline": "",
                "skills": [],
                "platforms": [],
                "niches": [],
                "styles": [],
                "price_per_video": None,
                "turnaround_days": None,
                "availability": "available",
                "location": "",
                "reel_url": "",
                "avatar_url": "",
                "cover_url": "",
                "samples": [],
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )
    access = create_access_token(user_id, email)
    refresh = create_refresh_token(user_id)
    set_auth_cookies(response, access, refresh)
    doc["_id"] = result.inserted_id
    return {"user": serialize_user(doc), "access_token": access}


@api.post("/auth/login")
async def login(payload: LoginIn, request: Request, response: Response):
    email = payload.email.lower()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"

    # Brute force check
    lock = await db.login_attempts.find_one({"identifier": identifier})
    if lock and lock.get("locked_until"):
        locked_until = datetime.fromisoformat(lock["locked_until"])
        if locked_until > datetime.now(timezone.utc):
            raise HTTPException(status_code=429, detail="Too many attempts. Try again later.")

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        # increment failed attempts
        attempts = (lock or {}).get("attempts", 0) + 1
        update = {"attempts": attempts, "identifier": identifier}
        if attempts >= 5:
            update["locked_until"] = (
                datetime.now(timezone.utc) + timedelta(minutes=15)
            ).isoformat()
            update["attempts"] = 0
        await db.login_attempts.update_one(
            {"identifier": identifier}, {"$set": update}, upsert=True
        )
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    await db.login_attempts.delete_one({"identifier": identifier})

    user_id = str(user["_id"])
    access = create_access_token(user_id, email)
    refresh = create_refresh_token(user_id)
    set_auth_cookies(response, access, refresh)
    return {"user": serialize_user(user), "access_token": access}


@api.post("/auth/logout")
async def logout(response: Response, _user: dict = Depends(get_current_user)):
    clear_auth_cookies(response)
    return {"ok": True}


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


@api.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    access = create_access_token(str(user["_id"]), user["email"])
    response.set_cookie(
        "access_token",
        access,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=60 * 60 * 24,
        path="/",
    )
    return {"ok": True}


@api.post("/auth/forgot-password")
async def forgot_password(payload: ForgotPasswordIn):
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    # Always respond OK — don't reveal user existence
    if user:
        token = secrets.token_urlsafe(32)
        await db.password_reset_tokens.insert_one(
            {
                "token": token,
                "user_id": str(user["_id"]),
                "used": False,
                "expires_at": datetime.now(timezone.utc) + timedelta(hours=1),
                "created_at": datetime.now(timezone.utc),
            }
        )
        reset_url = f"{FRONTEND_URL}/reset-password?token={token}"
        logger.info("=" * 70)
        logger.info(f"[PASSWORD RESET] Email: {email}")
        logger.info(f"[PASSWORD RESET] Link: {reset_url}")
        logger.info("=" * 70)
    return {"ok": True, "message": "If an account exists, a reset link has been sent."}


@api.post("/auth/reset-password")
async def reset_password(payload: ResetPasswordIn):
    tok = await db.password_reset_tokens.find_one({"token": payload.token, "used": False})
    if not tok:
        raise HTTPException(status_code=400, detail="Invalid or used reset link.")
    expires = tok["expires_at"]
    if isinstance(expires, str):
        expires = datetime.fromisoformat(expires)
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Reset link has expired.")
    await db.users.update_one(
        {"_id": ObjectId(tok["user_id"])},
        {"$set": {"password_hash": hash_password(payload.new_password)}},
    )
    await db.password_reset_tokens.update_one({"_id": tok["_id"]}, {"$set": {"used": True}})
    return {"ok": True}


# ---------- Editors ----------
async def merge_editor(user: dict, profile: Optional[dict]) -> dict:
    profile = profile or {}
    return {
        "id": str(user["_id"]),
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "avatar_url": profile.get("avatar_url") or user.get("avatar_url", ""),
        "cover_url": profile.get("cover_url", ""),
        "bio": profile.get("bio", ""),
        "headline": profile.get("headline", ""),
        "skills": profile.get("skills", []),
        "platforms": profile.get("platforms", []),
        "niches": profile.get("niches", []),
        "styles": profile.get("styles", []),
        "price_per_video": profile.get("price_per_video"),
        "turnaround_days": profile.get("turnaround_days"),
        "availability": profile.get("availability", "available"),
        "location": profile.get("location", ""),
        "reel_url": profile.get("reel_url", ""),
        "samples": profile.get("samples", []),
    }


@api.get("/editors")
async def list_editors(
    q: Optional[str] = None,
    platform: Optional[str] = None,
    niche: Optional[str] = None,
    style: Optional[str] = None,
    availability: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
):
    users = await db.users.find({"role": "editor"}).to_list(500)
    results = []
    for u in users:
        prof = await db.editor_profiles.find_one({"user_id": str(u["_id"])})
        editor = await merge_editor(u, prof)
        if q:
            hay = " ".join(
                [editor["name"], editor["headline"], editor["bio"], " ".join(editor["skills"])]
            ).lower()
            if q.lower() not in hay:
                continue
        if platform and platform not in editor["platforms"]:
            continue
        if niche and niche not in editor["niches"]:
            continue
        if style and style not in editor["styles"]:
            continue
        if availability and editor["availability"] != availability:
            continue
        price = editor["price_per_video"] or 0
        if min_price is not None and price < min_price:
            continue
        if max_price is not None and price > max_price:
            continue
        results.append(editor)
    return results


@api.get("/editors/{editor_id}")
async def get_editor(editor_id: str):
    try:
        user = await db.users.find_one({"_id": ObjectId(editor_id), "role": "editor"})
    except Exception:
        raise HTTPException(status_code=404, detail="Editor not found")
    if not user:
        raise HTTPException(status_code=404, detail="Editor not found")
    prof = await db.editor_profiles.find_one({"user_id": editor_id})
    return await merge_editor(user, prof)


@api.put("/editors/me")
async def update_my_editor_profile(
    payload: EditorProfileIn, user: dict = Depends(require_role("editor"))
):
    data = payload.model_dump(exclude_unset=True)
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.editor_profiles.update_one(
        {"user_id": user["id"]}, {"$set": data}, upsert=True
    )
    return {"ok": True}


# ---------- Projects ----------
@api.post("/projects")
async def create_project(payload: ProjectIn, user: dict = Depends(require_role("creator"))):
    doc = payload.model_dump()
    doc["creator_id"] = user["id"]
    doc["status"] = "open"
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.projects.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc


@api.get("/projects/mine")
async def my_projects(user: dict = Depends(require_role("creator"))):
    items = await db.projects.find({"creator_id": user["id"]}).sort("created_at", -1).to_list(200)
    for it in items:
        it["id"] = str(it.pop("_id"))
    return items


# ---------- Collaboration Requests ----------
@api.post("/requests")
async def create_request(payload: CollabRequestIn, user: dict = Depends(require_role("creator"))):
    try:
        editor = await db.users.find_one({"_id": ObjectId(payload.editor_id), "role": "editor"})
    except Exception:
        raise HTTPException(status_code=404, detail="Editor not found")
    if not editor:
        raise HTTPException(status_code=404, detail="Editor not found")
    doc = {
        "creator_id": user["id"],
        "creator_name": user.get("name", ""),
        "editor_id": payload.editor_id,
        "project_id": payload.project_id,
        "message": payload.message,
        "budget": payload.budget,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.collab_requests.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    # notification for editor
    await db.notifications.insert_one(
        {
            "user_id": payload.editor_id,
            "kind": "new_request",
            "message": f"New collaboration request from {user.get('name', 'a creator')}",
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    )
    return doc


@api.get("/requests/incoming")
async def incoming_requests(user: dict = Depends(require_role("editor"))):
    items = (
        await db.collab_requests.find({"editor_id": user["id"]})
        .sort("created_at", -1)
        .to_list(200)
    )
    for it in items:
        it["id"] = str(it.pop("_id"))
    return items


@api.get("/requests/outgoing")
async def outgoing_requests(user: dict = Depends(require_role("creator"))):
    items = (
        await db.collab_requests.find({"creator_id": user["id"]})
        .sort("created_at", -1)
        .to_list(200)
    )
    for it in items:
        it["id"] = str(it.pop("_id"))
        try:
            ed = await db.users.find_one({"_id": ObjectId(it["editor_id"])})
            it["editor_name"] = ed.get("name", "") if ed else ""
        except Exception:
            it["editor_name"] = ""
    return items


@api.post("/requests/{request_id}/respond")
async def respond_request(
    request_id: str, payload: RespondRequestIn, user: dict = Depends(require_role("editor"))
):
    try:
        req = await db.collab_requests.find_one({"_id": ObjectId(request_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Request not found")
    if not req or req.get("editor_id") != user["id"]:
        raise HTTPException(status_code=404, detail="Request not found")
    new_status = "accepted" if payload.action == "accept" else "declined"
    await db.collab_requests.update_one(
        {"_id": req["_id"]}, {"$set": {"status": new_status}}
    )
    await db.notifications.insert_one(
        {
            "user_id": req["creator_id"],
            "kind": "request_response",
            "message": f"Your request was {new_status} by {user.get('name', 'the editor')}",
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    )
    return {"ok": True, "status": new_status}


# ---------- Saved editors ----------
@api.post("/saved/{editor_id}")
async def toggle_saved(editor_id: str, user: dict = Depends(require_role("creator"))):
    existing = await db.saved_editors.find_one(
        {"creator_id": user["id"], "editor_id": editor_id}
    )
    if existing:
        await db.saved_editors.delete_one({"_id": existing["_id"]})
        return {"saved": False}
    await db.saved_editors.insert_one(
        {
            "creator_id": user["id"],
            "editor_id": editor_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    )
    return {"saved": True}


@api.get("/saved")
async def list_saved(user: dict = Depends(require_role("creator"))):
    items = await db.saved_editors.find({"creator_id": user["id"]}).to_list(500)
    editors = []
    for it in items:
        try:
            u = await db.users.find_one({"_id": ObjectId(it["editor_id"])})
            if not u:
                continue
            prof = await db.editor_profiles.find_one({"user_id": it["editor_id"]})
            editors.append(await merge_editor(u, prof))
        except Exception:
            continue
    return editors


# ---------- Notifications ----------
@api.get("/notifications")
async def list_notifications(user: dict = Depends(get_current_user)):
    items = (
        await db.notifications.find({"user_id": user["id"]})
        .sort("created_at", -1)
        .to_list(50)
    )
    for it in items:
        it["id"] = str(it.pop("_id"))
    return items


@api.post("/notifications/read-all")
async def mark_all_read(user: dict = Depends(get_current_user)):
    await db.notifications.update_many(
        {"user_id": user["id"], "read": False}, {"$set": {"read": True}}
    )
    return {"ok": True}


# ---------- Contact ----------
class ContactIn(BaseModel):
    name: str
    email: EmailStr
    message: str


@api.post("/contact")
async def contact(payload: ContactIn):
    await db.contact_messages.insert_one(
        {
            **payload.model_dump(),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    )
    return {"ok": True}


@api.get("/")
async def root():
    return {"service": "volvaura", "ok": True}


# ---------- Startup: seed users + indexes ----------
async def seed():
    await db.users.create_index("email", unique=True)
    await db.editor_profiles.create_index("user_id", unique=True)
    await db.collab_requests.create_index("editor_id")
    await db.collab_requests.create_index("creator_id")
    await db.saved_editors.create_index([("creator_id", 1), ("editor_id", 1)], unique=True)
    await db.notifications.create_index("user_id")
    await db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=3600)
    await db.login_attempts.create_index("identifier")

    # Admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@volvaura.com").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin12345")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one(
            {
                "email": admin_email,
                "password_hash": hash_password(admin_password),
                "name": "Admin",
                "role": "admin",
                "avatar_url": "",
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}},
        )

    # Test creator
    creator_email = "creator@volvaura.com"
    if not await db.users.find_one({"email": creator_email}):
        await db.users.insert_one(
            {
                "email": creator_email,
                "password_hash": hash_password("creator123"),
                "name": "Ava Reyes",
                "role": "creator",
                "avatar_url": "",
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )

    # Seed featured editors
    featured = [
        {
            "email": "editor@volvaura.com",
            "password": "editor123",
            "name": "Kaito Mori",
            "profile": {
                "headline": "Cinematic long-form editor for creators who refuse to blend in",
                "bio": "10 years cutting documentary, brand films, and long-form YouTube. Ex-Vice, ex-A24 marketing.",
                "skills": ["Long-form YouTube", "Documentary", "Color Grade", "Sound Design"],
                "platforms": ["YouTube"],
                "niches": ["Documentary", "MotionGraphics"],
                "styles": ["Cinematic", "Narrative"],
                "price_per_video": 1800,
                "turnaround_days": 7,
                "availability": "available",
                "location": "Tokyo, JP",
                "reel_url": "",
                "avatar_url": "https://images.unsplash.com/photo-1644353224392-7e532d7b8f4b?w=400",
                "cover_url": "https://images.unsplash.com/photo-1644353224392-7e532d7b8f4b?w=1200",
                "samples": [
                    {"title": "Signal / Noise", "thumbnail": "https://images.unsplash.com/photo-1514168757508-07ffe9ae125b?w=800", "url": "#", "description": "5-min mini-doc"},
                    {"title": "The Frame", "thumbnail": "https://images.unsplash.com/photo-1543868519-fc5437bc63fe?w=800", "url": "#", "description": "Brand film"},
                ],
            },
        },
        {
            "email": "nova@volvaura.com",
            "password": "editor123",
            "name": "Nova Vex",
            "profile": {
                "headline": "High-retention Shorts & Reels for 7-figure creators",
                "bio": "Hook-driven pacing. My cuts average 90%+ retention on TikTok and Reels.",
                "skills": ["Shorts", "Reels", "Hook editing", "Captions"],
                "platforms": ["Instagram", "TikTok", "YouTube"],
                "niches": ["Shorts", "Reels"],
                "styles": ["Fast-cut", "Editorial"],
                "price_per_video": 250,
                "turnaround_days": 2,
                "availability": "limited",
                "location": "LA, US",
                "reel_url": "",
                "avatar_url": "https://images.unsplash.com/photo-1543868519-fc5437bc63fe?w=400",
                "cover_url": "https://images.unsplash.com/photo-1543868519-fc5437bc63fe?w=1200",
                "samples": [
                    {"title": "60s: Lost Cities", "thumbnail": "https://images.unsplash.com/photo-1671869203911-cdaab14b9811?w=800", "url": "#", "description": "Viral Short"},
                ],
            },
        },
        {
            "email": "atlas@volvaura.com",
            "password": "editor123",
            "name": "Atlas Kern",
            "profile": {
                "headline": "Motion designer / AE wizard. Kinetic typography specialist.",
                "bio": "Custom motion graphics, 3D tracking, kinetic type. Bespoke assets — no templates.",
                "skills": ["After Effects", "Motion Graphics", "Kinetic Type", "3D Tracking"],
                "platforms": ["YouTube", "Instagram"],
                "niches": ["MotionGraphics"],
                "styles": ["Editorial", "Cinematic"],
                "price_per_video": 900,
                "turnaround_days": 5,
                "availability": "available",
                "location": "Berlin, DE",
                "reel_url": "",
                "avatar_url": "https://images.unsplash.com/photo-1671869203911-cdaab14b9811?w=400",
                "cover_url": "https://images.unsplash.com/photo-1671869203911-cdaab14b9811?w=1200",
                "samples": [
                    {"title": "Kinetic 01", "thumbnail": "https://images.unsplash.com/photo-1514168757508-07ffe9ae125b?w=800", "url": "#", "description": "Type in motion"},
                ],
            },
        },
        {
            "email": "iris@volvaura.com",
            "password": "editor123",
            "name": "Iris Halden",
            "profile": {
                "headline": "AI-assisted editor. Fast, weird, and controlled.",
                "bio": "Generative fill, voice cloning, hyper-speed workflows. Experimental, on-brief.",
                "skills": ["AI Editing", "Runway", "Descript", "Sound Design"],
                "platforms": ["YouTube", "TikTok"],
                "niches": ["AIEditing", "Shorts"],
                "styles": ["Experimental", "Fast-cut"],
                "price_per_video": 600,
                "turnaround_days": 3,
                "availability": "available",
                "location": "Remote",
                "reel_url": "",
                "avatar_url": "https://images.unsplash.com/photo-1514168757508-07ffe9ae125b?w=400",
                "cover_url": "https://images.unsplash.com/photo-1514168757508-07ffe9ae125b?w=1200",
                "samples": [],
            },
        },
    ]
    for f in featured:
        if not await db.users.find_one({"email": f["email"]}):
            res = await db.users.insert_one(
                {
                    "email": f["email"],
                    "password_hash": hash_password(f["password"]),
                    "name": f["name"],
                    "role": "editor",
                    "avatar_url": f["profile"]["avatar_url"],
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }
            )
            await db.editor_profiles.insert_one(
                {"user_id": str(res.inserted_id), **f["profile"], "created_at": datetime.now(timezone.utc).isoformat()}
            )


@app.on_event("startup")
async def _on_startup():
    try:
        await seed()
        logger.info("Volvaura seed complete")
    except Exception as e:
        logger.error(f"Seed error: {e}")


@app.on_event("shutdown")
async def _shutdown():
    client.close()


app.include_router(api)

cors_origins = [o.strip() for o in os.environ.get("CORS_ORIGINS", FRONTEND_URL).split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
