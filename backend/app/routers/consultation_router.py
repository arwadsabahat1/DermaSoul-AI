from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
import logging
from pathlib import Path

from app.config import settings
from app.database import get_db
from app.models.consultation import Consultation
from app.models.user import User
from app.routers.auth_router import get_current_user
from app.schemas.consultation_schema import (
    ConsultationDetailResponse,
    ConsultationListItemResponse,
    ConsultationPaginatedListResponse,
)
from app.services.image_storage_service import delete_uploaded_image
from app.services.pdf_report_service import PDFReportGenerator, generate_pdf_filename

logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/api/consultations",
    tags=["Consultations"]
)


@router.get("", response_model=ConsultationPaginatedListResponse)
def get_my_consultations(
    limit: int = Query(default=30, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    base = db.query(Consultation).filter(Consultation.user_id == current_user.id)
    total = base.count()
    consultations = (
        base.order_by(Consultation.created_at.desc()).offset(offset).limit(limit).all()
    )
    return ConsultationPaginatedListResponse(
        items=consultations,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{consultation_id}", response_model=ConsultationDetailResponse)
def get_consultation_detail(
    consultation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    consultation = db.query(Consultation).filter(
        Consultation.id == consultation_id,
        Consultation.user_id == current_user.id
    ).first()

    if not consultation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultation not found."
        )

    return consultation


@router.delete("/{consultation_id}")
def delete_consultation(
    consultation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    consultation = db.query(Consultation).filter(
        Consultation.id == consultation_id,
        Consultation.user_id == current_user.id
    ).first()

    if not consultation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultation not found."
        )

    image_filename = consultation.image_filename
    db.delete(consultation)
    db.commit()
    # Remove the file only after the record is gone, so a failed commit never loses the image.
    delete_uploaded_image(image_filename)

    return {
        "message": "Consultation deleted successfully."
    }


@router.get("/{consultation_id}/download-pdf")
def download_pdf_report(
    consultation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Download consultation as PDF report.
    
    Endpoint: GET /api/consultations/{consultation_id}/download-pdf
    
    Security:
    - User can only download their own consultation PDFs
    - JWT token required (Bearer token)
    
    Returns:
    - PDF file as application/pdf
    - Filename: dermasoul_report_{id}_{timestamp}.pdf
    
    Architecture:
    1. Verify user owns the consultation
    2. Fetch consultation from database
    3. Generate PDF using PDFReportGenerator (in-memory)
    4. Return as FileResponse with download headers
    
    Error Codes:
    - 401: Unauthorized (invalid/missing token)
    - 404: Consultation not found
    - 500: PDF generation failed
    """
    
    # Verify consultation exists and belongs to user
    consultation = db.query(Consultation).filter(
        Consultation.id == consultation_id,
        Consultation.user_id == current_user.id
    ).first()

    if not consultation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultation not found."
        )

    try:
        # Ensure all consultation data is loaded before using it
        # Access key fields to trigger lazy loading if needed
        _ = consultation.created_at
        _ = consultation.recommendations
        
        # Generate PDF in memory
        pdf_generator = PDFReportGenerator()
        pdf_bytes = pdf_generator.generate_report(consultation)
        
        # Generate filename with timestamp
        filename = generate_pdf_filename(consultation_id)
        
        # Return as streaming response with PDF bytes
        return StreamingResponse(
            iter([pdf_bytes]),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        )
    
    except Exception as e:
        logger.error(f"PDF generation error for consultation {consultation_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PDF report: {str(e)}"
        )


@router.get("/{consultation_id}/image")
def get_consultation_image(
    consultation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    consultation = db.query(Consultation).filter(
        Consultation.id == consultation_id,
        Consultation.user_id == current_user.id
    ).first()

    if not consultation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultation not found."
        )

    if not consultation.image_filename:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultation image not available."
        )

    file_path = Path(settings.UPLOAD_DIR) / consultation.image_filename
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stored image file not found."
        )

    return FileResponse(path=str(file_path))