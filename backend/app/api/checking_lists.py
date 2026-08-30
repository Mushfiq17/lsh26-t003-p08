from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.core.database import get_db
from app.services.checking_lists import CheckingListsService

router = APIRouter(prefix="/checking-lists", tags=["checking-lists"])

@router.get("/optional")
def get_optional_review(db: Session = Depends(get_db)):
    """
    Retrieves students whose optional subject GP is <= 2.0.
    """
    return CheckingListsService.get_optional_review_list(db)

@router.get("/practical-fail")
def get_practical_failures(db: Session = Depends(get_db)):
    """
    Retrieves student records that failed practical subject threshold requirements.
    """
    return CheckingListsService.get_practical_failures_list(db)

@router.get("/absent")
def get_absences(db: Session = Depends(get_db)):
    """
    Retrieves student records containing absences, indicating the subject and consequence.
    """
    return CheckingListsService.get_absences_list(db)
