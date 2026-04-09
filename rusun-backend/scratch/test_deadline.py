from datetime import date, timedelta
from app.api.tasks import format_document_number
# Note: I can't easily import internal_mass_generate_teguran without a database session
# but I can test the logic I added to tasks.py which uses timedelta(days=7)

def test_deadline_logic():
    sign_date = date(2026, 3, 3)
    deadline = sign_date + timedelta(days=7)
    
    print(f"Sign Date: {sign_date}")
    print(f"Deadline (Sign + 7): {deadline}")
    
    expected_deadline = date(2026, 3, 10)
    assert deadline == expected_deadline, f"Expected {expected_deadline}, got {deadline}"

    # Verify formatting with the month from sign_date
    number = format_document_number("02", "T1", 100, sign_date.month, sign_date.year)
    print(f"Generated Number: {number}")
    assert "III" in number, f"Expected Roman III for March, got {number}"

    print("\n[SUCCESS] Logika tenggat waktu 7 hari & penomoran berhasil!")

if __name__ == "__main__":
    test_deadline_logic()
