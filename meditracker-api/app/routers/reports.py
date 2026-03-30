from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import MedicalReport, User
from app.routers.patients import get_owned_patient
from app.schemas.report import ReportAnalyzeResponse, ReportOut
from app.services.report_analysis import run_report_analysis
from app.services.report_ingest import extract_text_from_upload

router = APIRouter(prefix="/patients/{patient_id}/reports", tags=["reports"])


@router.get("", response_model=list[ReportOut])
def list_reports(
    patient_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[MedicalReport]:
    get_owned_patient(db, user, patient_id)
    return db.query(MedicalReport).filter(MedicalReport.patient_id == patient_id).order_by(MedicalReport.created_at.desc()).all()


@router.post("/analyze", response_model=ReportAnalyzeResponse)
async def analyze_upload(
    patient_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ReportAnalyzeResponse:
    get_owned_patient(db, user, patient_id)
    data = await file.read()
    text = extract_text_from_upload(file.filename or "upload", data)
    result = await run_report_analysis(text)
    row = MedicalReport(
        patient_id=patient_id,
        original_filename=file.filename or "upload",
        raw_text=text[:50000],
        extracted_parameters=result.extracted_parameters,
        ai_summary=result.ai_summary,
    )
    db.add(row)
    db.commit()
    return result
