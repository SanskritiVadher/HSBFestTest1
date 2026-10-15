from pathlib import Path
import openpyxl
from backend.database import get_db_connection, init_db

DATA_FILE_PATH = Path(__file__).parent.parent / "data" / "events_seed.xlsx"

def seed_events():
    """Seeds the events table from data/events_seed.xlsx if the table is empty."""
    # Ensure database tables exist first
    init_db()

    # Check if seed spreadsheet exists
    if not DATA_FILE_PATH.exists():
        raise FileNotFoundError(
            f"Companion seed file not found at '{DATA_FILE_PATH}'. "
            "Please copy the provided events_seed.xlsx file into the data/ folder before running this script."
        )

    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if events table already has rows
    cursor.execute("SELECT COUNT(*) AS count FROM events;")
    count = cursor.fetchone()["count"]

    if count > 0:
        print(f"Skipping seeding: events table already contains {count} rows.")
        conn.close()
        return

    # Load workbook and Events sheet
    wb = openpyxl.load_workbook(DATA_FILE_PATH)
    if "Events" not in wb.sheetnames:
        raise ValueError("Sheet 'Events' not found in events_seed.xlsx")

    ws = wb["Events"]

    # Read rows (skipping header)
    rows = list(ws.iter_rows(values_only=True))
    if not rows or len(rows) < 2:
        conn.close()
        raise ValueError("No data rows found in events_seed.xlsx")

    header = rows[0]
    expected_header = ['id', 'title', 'category', 'description', 'event_date', 'event_time', 'venue', 'capacity', 'fee', 'icon']
    # Validate header roughly matches expected column names
    header_clean = [str(col).strip() if col is not None else "" for col in header]

    inserted_count = 0
    for row in rows[1:]:
        if not any(row):  # skip completely blank rows
            continue
        # row: id, title, category, description, event_date, event_time, venue, capacity, fee, icon
        event_id = row[0]
        title = row[1]
        category = row[2]
        description = row[3]
        event_date = str(row[4])
        event_time = str(row[5])
        venue = str(row[6])
        capacity = int(row[7])
        fee = int(row[8]) if row[8] is not None else 0
        icon = str(row[9]) if row[9] is not None else ""

        cursor.execute("""
            INSERT INTO events (id, title, category, description, event_date, event_time, venue, capacity, fee, icon)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (event_id, title, category, description, event_date, event_time, venue, capacity, fee, icon))
        inserted_count += 1

    conn.commit()
    conn.close()
    print(f"Successfully seeded {inserted_count} events from {DATA_FILE_PATH}.")

def show_events():
    """Prints all events currently in the events table."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, category, event_date, event_time, venue, capacity, fee, icon FROM events ORDER BY id;")
    rows = cursor.fetchall()
    conn.close()
    print(f"\n--- Events in Database ({len(rows)} rows) ---")
    for r in rows:
        print(f"[{r['id']}] {r['icon']} {r['title']} | {r['category']} | {r['event_date']} {r['event_time']} | {r['venue']} | Cap: {r['capacity']} | Fee: ₹{r['fee']}")

if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding="utf-8")
    seed_events()
    show_events()
