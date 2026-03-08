import sys

with open('app/api/invoices.py', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'if not tenant or tenant.user_id != current_user.id:' in line:
        if 'raise HTTPException' in lines[i+1]:
            # Found the block, insert elif
            lines.insert(i+2, '    elif current_user.role not in [UserRole.admin, UserRole.sadmin]:\n')
            lines.insert(i+3, '        raise HTTPException(status_code=403, detail="Akses ditolak")\n')
            break

with open('app/api/invoices.py', 'w', newline='') as f:
    f.writelines(lines)
