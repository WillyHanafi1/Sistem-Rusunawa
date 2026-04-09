ROMAN = {1: "I", 2: "II", 3: "III", 4: "IV", 5: "V"}

def format_alamat_hunian(r_bu, r_fl, r_un):
    # Logic from invoices.py
    return f"{r_bu.split(' - ')[-1]} {ROMAN.get(r_fl, str(r_fl))} {r_un}"

def test_alamat_hunian():
    # Case 1: With prefix
    case1 = format_alamat_hunian("Cibeureum - A", 1, 3)
    print(f"Case 1 (Cibeureum - A, 1, 3): {case1}")
    assert case1 == "A I 3"

    # Case 2: Without prefix
    case2 = format_alamat_hunian("A", 1, 3)
    print(f"Case 2 (A, 1, 3): {case2}")
    assert case2 == "A I 3"

    # Case 3: Different rusunawa
    case3 = format_alamat_hunian("Leuwigajah - B", 2, 5)
    print(f"Case 3 (Leuwigajah - B, 2, 5): {case3}")
    assert case3 == "B II 5"

    print("\n[SUCCESS] Alamat hunian formatting verified!")

if __name__ == "__main__":
    test_alamat_hunian()
