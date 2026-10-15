from datetime import datetime, date
from pathlib import Path
from typing import List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.database import get_db_connection, init_db
from backend.models import (
    EventOut,
    EventDetail,
    RegistrationIn,
    RegistrationOut,
    RegistrationItem,
    StatsOut,
    EventIn,
)
from backend.seed_data import seed_events

# Lifespan event to initialize DB and seed data on startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    try:
        seed_events()
    except Exception as e:
        print(f"Seed note: {e}")
    yield

app = FastAPI(
    title="Zenith '26 College Fest Management System API",
    description="API for managing events, student registrations, and fest statistics.",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_DIR = Path(__file__).parent.parent / "frontend"

# --- API Endpoints ---

@app.get("/api/events", response_model=List[EventOut], tags=["Events"])
def get_events(
    category: Optional[str] = Query(None, description="Filter by event category"),
    search: Optional[str] = Query(None, description="Search by event title (case-insensitive)"),
):
    """
    Returns list of events with live computed available_seats.
    Supports optional category and search query parameters.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
        SELECT 
            e.id, e.title, e.category, e.description, e.event_date, e.event_time, 
            e.venue, e.capacity, e.fee, e.icon,
            (e.capacity - COUNT(r.id)) AS available_seats
        FROM events e
        LEFT JOIN registrations r ON e.id = r.event_id
        WHERE 1=1
    """
    params = []

    if category and category.strip().lower() != "all":
        query += " AND LOWER(e.category) = LOWER(?)"
        params.append(category.strip())

    if search and search.strip():
        query += " AND LOWER(e.title) LIKE LOWER(?)"
        params.append(f"%{search.strip()}%")

    query += " GROUP BY e.id ORDER BY e.id ASC"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]


@app.get("/api/events/{event_id}", response_model=EventDetail, tags=["Events"])
def get_event(event_id: int):
    """
    Returns details of a single event with live available_seats, or 404 if not found.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT 
            e.id, e.title, e.category, e.description, e.event_date, e.event_time, 
            e.venue, e.capacity, e.fee, e.icon,
            (e.capacity - COUNT(r.id)) AS available_seats
        FROM events e
        LEFT JOIN registrations r ON e.id = r.event_id
        WHERE e.id = ?
        GROUP BY e.id
    """, (event_id,))

    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with id {event_id} not found"
        )

    return dict(row)


@app.post(
    "/api/events/{event_id}/register",
    response_model=RegistrationOut,
    status_code=status.HTTP_201_CREATED,
    tags=["Registrations"]
)
def register_for_event(event_id: int, reg: RegistrationIn):
    """
    Registers a student for an event with strict server-side validation.
    """
    # 1. Validate non-empty fields
    student_name = reg.student_name.strip()
    roll_number = reg.roll_number.strip()
    email = reg.email.strip()
    phone = reg.phone.strip() if reg.phone else None

    if not student_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student name is required"
        )
    if not roll_number:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Roll number is required"
        )
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is required"
        )

    # 2. Validate email structure
    if "@" not in email or email.startswith("@") or email.endswith("@"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valid email containing '@' is required"
        )

    conn = get_db_connection()
    cursor = conn.cursor()

    # 3. Check event existence & capacity
    cursor.execute("""
        SELECT 
            e.id, e.title, e.capacity, 
            COUNT(r.id) AS current_registrations
        FROM events e
        LEFT JOIN registrations r ON e.id = r.event_id
        WHERE e.id = ?
        GROUP BY e.id
    """, (event_id,))
    event_row = cursor.fetchone()

    if not event_row:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with id {event_id} not found"
        )

    capacity = event_row["capacity"]
    current_reg = event_row["current_registrations"]
    if current_reg >= capacity:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Event is full"
        )

    # 4. Check duplicate email registration for this event
    cursor.execute("""
        SELECT id FROM registrations 
        WHERE event_id = ? AND LOWER(email) = LOWER(?)
    """, (event_id, email))
    existing = cursor.fetchone()

    if existing:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Already registered"
        )

    # 5. Insert registration
    registered_at = datetime.now().isoformat()
    cursor.execute("""
        INSERT INTO registrations (event_id, student_name, roll_number, email, phone, registered_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (event_id, student_name, roll_number, email, phone, registered_at))

    new_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return {
        "id": new_id,
        "event_id": event_id,
        "student_name": student_name,
        "registered_at": registered_at
    }


@app.get("/api/registrations", response_model=List[RegistrationItem], tags=["Registrations"])
def get_registrations(event_id: Optional[int] = Query(None, description="Filter registrations by event ID")):
    """
    Returns list of registrations, optionally filtered by event_id, including event title.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
        SELECT 
            r.id, r.event_id, e.title AS event_title, 
            r.student_name, r.roll_number, r.email, r.phone, r.registered_at
        FROM registrations r
        JOIN events e ON r.event_id = e.id
        WHERE 1=1
    """
    params = []

    if event_id is not None:
        query += " AND r.event_id = ?"
        params.append(event_id)

    query += " ORDER BY r.id DESC"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]


@app.get("/api/stats", response_model=StatsOut, tags=["Stats"])
def get_stats():
    """
    Returns live computed statistics from database.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Total events & total capacity
    cursor.execute("SELECT COUNT(*) AS total_events, COALESCE(SUM(capacity), 0) AS total_capacity FROM events;")
    event_stats = cursor.fetchone()
    total_events = event_stats["total_events"]
    total_capacity = event_stats["total_capacity"]

    # Total registrations
    cursor.execute("SELECT COUNT(*) AS total_registrations FROM registrations;")
    total_registrations = cursor.fetchone()["total_registrations"]

    # Utilization %
    overall_utilization_pct = 0.0
    if total_capacity > 0:
        overall_utilization_pct = round((total_registrations / total_capacity) * 100.0, 1)

    # Upcoming events count (event_date today or later)
    today_str = date.today().isoformat()
    cursor.execute("SELECT COUNT(*) AS upcoming_count FROM events WHERE event_date >= ?;", (today_str,))
    upcoming_events_count = cursor.fetchone()["upcoming_count"]

    # Events by category
    cursor.execute("SELECT category, COUNT(*) AS count FROM events GROUP BY category;")
    cat_rows = cursor.fetchall()
    events_by_category = {row["category"]: row["count"] for row in cat_rows}

    conn.close()

    return {
        "total_events": total_events,
        "total_registrations": total_registrations,
        "total_capacity": total_capacity,
        "overall_utilization_pct": overall_utilization_pct,
        "upcoming_events_count": upcoming_events_count,
        "events_by_category": events_by_category,
    }


# --- Stretch Goal Endpoints ---

@app.post("/api/events", response_model=EventDetail, status_code=status.HTTP_201_CREATED, tags=["Stretch Goals"])
def create_event(event_data: EventIn):
    """
    Admin stretch goal: Add a new event with full server validation.
    """
    title = event_data.title.strip()
    category = event_data.category.strip()
    venue = event_data.venue.strip()
    event_date = event_data.event_date.strip()
    event_time = event_data.event_time.strip()

    if not title or not category or not venue or not event_date or not event_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Title, category, venue, date, and time are required"
        )
    if event_data.capacity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Capacity must be greater than 0"
        )

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO events (title, category, description, event_date, event_time, venue, capacity, fee, icon)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        title,
        category,
        event_data.description.strip() if event_data.description else None,
        event_date,
        event_time,
        venue,
        event_data.capacity,
        event_data.fee,
        event_data.icon or "📅"
    ))

    new_event_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return get_event(new_event_id)


@app.delete("/api/registrations/{registration_id}", tags=["Stretch Goals"])
def cancel_registration(registration_id: int):
    """
    Admin stretch goal: Cancel a registration and free up a seat.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id, event_id FROM registrations WHERE id = ?", (registration_id,))
    reg = cursor.fetchone()
    if not reg:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Registration {registration_id} not found"
        )

    cursor.execute("DELETE FROM registrations WHERE id = ?", (registration_id,))
    conn.commit()
    conn.close()

    return {"message": f"Registration {registration_id} successfully cancelled", "event_id": reg["event_id"]}


# --- Static Files / Frontend Routes (Step 4) ---

# Mount /js static folder
app.mount("/js", StaticFiles(directory=FRONTEND_DIR / "js"), name="js")

@app.get("/", include_in_schema=False)
def serve_index():
    return FileResponse(FRONTEND_DIR / "index.html")

@app.get("/admin.html", include_in_schema=False)
def serve_admin():
    return FileResponse(FRONTEND_DIR / "admin.html")
