import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from app.core.security import require_admin
from app.models.user import User

router = APIRouter(prefix="/documents", tags=["Documents"])

UPLOAD_DIR = os.path.abspath("uploads")

@router.get("/{filename:path}")
def get_protected_document(
    filename: str,
    current_user: User = Depends(require_admin)
):
    """
    Serves files from the uploads directory only to authenticated Staff/Admin.
    Prevents public PII leakage with protection against path traversal.
    """
    # 1. Deny dangerous characters before normalization
    if ".." in filename or filename.startswith("/") or filename.startswith("\\"):
        raise HTTPException(status_code=403, detail="Akses ditolak")

    # 2. Cleanup prefix if present
    clean = filename
    for prefix in ("uploads/", "uploads\\"):
        if clean.lower().startswith(prefix):
            clean = clean[len(prefix):]

    # 3. Build absolute path
    file_path = os.path.abspath(os.path.join(UPLOAD_DIR, clean))
    
    # 4. Enforce boundary check with os.sep to prevent "uploads_evil" bypass
    if not file_path.startswith(UPLOAD_DIR + os.sep):
         raise HTTPException(status_code=403, detail="Akses ditolak")

    # 5. Check if file exists
    if not os.path.isfile(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dokumen tidak ditemukan"
        )
    
    return FileResponse(file_path)
