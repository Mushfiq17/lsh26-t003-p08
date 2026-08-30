from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.analytics import AnalyticsResponse
from app.services.analytics import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("", response_model=AnalyticsResponse)
def get_analytics_summary(db: Session = Depends(get_db)):
    """
    Get live aggregates of result processing statistics from the backend database.
    """
    return AnalyticsService.get_analytics(db)
