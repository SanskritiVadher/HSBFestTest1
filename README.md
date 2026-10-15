# Zenith '26 — College Fest Management System

A full-stack, responsive college fest event portal and coordinator admin dashboard built with Python (FastAPI), SQLite, HTML, Tailwind CSS, and vanilla JavaScript.

---

## 🚀 Tech Stack

- **Frontend:** HTML5, Tailwind CSS (via Play CDN), Vanilla JavaScript (ES6+)
- **Backend:** Python 3.10+, FastAPI, Uvicorn, Pydantic v2
- **Database:** SQLite3 (`fest.db`) with relational integrity (`events` and `registrations`)
- **Data Ingestion:** `openpyxl` reading spreadsheet `data/events_seed.xlsx`
- **Testing & API Contracts:** Postman (`zenith26-api.postman_collection.json`)

---

## 📁 Project Structure

```text
zenith26-fest-system/
├── backend/
│   ├── database.py       # SQLite connection helper & schema creation
│   ├── models.py         # Pydantic schemas (EventOut, RegistrationIn, StatsOut, etc.)
│   ├── seed_data.py      # Spreadsheet loader (ingests events_seed.xlsx into SQLite)
│   └── main.py           # FastAPI routes, server validation, static file mounting
├── frontend/
│   ├── index.html        # Student event discovery portal & registration modal
│   ├── admin.html        # Coordinator operations dashboard & stats roster
│   └── js/
│       ├── app.js        # Student portal client logic, filters, modal handling
│       └── admin.js      # Admin dashboard metrics, table sorting, cancellation
├── data/
│   └── events_seed.xlsx  # 14 Seed events spreadsheet
├── zenith26-api.postman_collection.json # Exported API test suite
├── requirements.txt      # Python dependencies
└── README.md
```

---

## ⚡ How to Run the Project

### 1. Set Up Virtual Environment & Dependencies
```powershell
# Navigate into the project folder
cd zenith26-fest-system

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Seed Database (Optional - runs automatically on startup)
```powershell
python -m backend.seed_data
```

### 3. Start the FastAPI Server
```powershell
uvicorn backend.main:app --reload --port 8000
```

### 4. Open in Your Browser
- **Student Event Portal:** [http://localhost:8000/](http://localhost:8000/)
- **Admin Coordinator Dashboard:** [http://localhost:8000/admin.html](http://localhost:8000/admin.html)
- **Interactive Swagger API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 📡 REST API Contract

| Method | Path | Description | Key Status Codes |
|---|---|---|---|
| `GET` | `/api/events` | List all events (supports `?category=` and `?search=`). `available_seats` calculated dynamically. | `200 OK` |
| `GET` | `/api/events/{id}` | Single event detail view. | `200 OK`, `404 Not Found` |
| `POST` | `/api/events/{id}/register` | Register student. Validates required fields, email format, capacity, and uniqueness. | `201 Created`, `400 Bad Request`, `409 Conflict`, `404 Not Found` |
| `GET` | `/api/registrations` | List all registrations (supports `?event_id=`), with event title included. | `200 OK` |
| `GET` | `/api/stats` | Real-time aggregate fest metrics & category counts. | `200 OK` |
| `POST` | `/api/events` | *Stretch Goal:* Admin adds a new event. | `201 Created`, `400 Bad Request` |
| `DELETE` | `/api/registrations/{id}` | *Stretch Goal:* Admin cancels registration and restores available seat. | `200 OK`, `404 Not Found` |
