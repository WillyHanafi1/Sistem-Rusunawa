from app.api.tasks import format_document_number

def test_numbering():
    # Test case 1: March (should be III)
    march_no = format_document_number("02", "T1", 974, 3, 2026)
    print(f"Test March: {march_no}")
    expected_march = "974/T1/02.974/UPTD.RSN/III/2026"
    assert march_no == expected_march, f"Expected {expected_march}, got {march_no}"

    # Test case 2: January (should be I)
    jan_no = format_document_number("01", "STRD", 1, 1, 2026)
    print(f"Test January: {jan_no}")
    assert "/I/" in jan_no

    # Test case 3: October (should be X)
    oct_no = format_document_number("03", "T3", 50, 10, 2026)
    print(f"Test October: {oct_no}")
    assert "/X/" in oct_no

    print("\n[SUCCESS] Semua test case penomoran berhasil!")

if __name__ == "__main__":
    test_numbering()
