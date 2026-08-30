import json
import os
import sys

# Add backend directory to sys.path so app modules can be imported
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.schemas.processing import StudentMarksInput
from app.services.result_processor import ResultProcessor
from app.services.audit import AuditService

def main():
    json_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'P08_school_results_public.json')
    
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    case = data['cases'][0]
    students_data = case['students']
    
    processed_students = []
    
    for case in data['cases']:
        students_data = case['students']
        for s in students_data:
            marks = {}
            for sub_code, mark_val in s['marks'].items():
                if mark_val == 'AB':
                    marks[sub_code] = 'AB'
                elif isinstance(mark_val, dict):
                    # Practical subject
                    marks[sub_code] = {
                        "theory_mark": mark_val.get("theory"),
                        "practical_mark": mark_val.get("practical")
                    }
                else:
                    # Normal subject
                    marks[sub_code] = {
                        "total_mark": mark_val
                    }
                    
            student_input = StudentMarksInput(
                student_id=s['id'] + '-' + case['case_id'], # Unique ID across cases
                name=s['name'],
                class_name=s['class'],
                optional_subject=s['optional'],
                marks=marks
            )
            processed_students.append(student_input)
        
    print(f"Loaded {len(processed_students)} students from JSON.")
    
    # Initialize DB
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    import uuid
    try:
        batch_id = f"BATCH-P08-{uuid.uuid4().hex[:8]}"
        print(f"Processing batch {batch_id}...")
        response = ResultProcessor.process_batch(
            db=db,
            class_name="Class 9", # From the JSON
            students=processed_students,
            custom_batch_id=batch_id
        )
        
        print(f"Batch processed: {response.processed} processed, {response.valid} valid, {response.invalid} invalid")
        if response.invalid > 0:
            print("Errors:", response.errors[:5]) # Print first few errors
            
        AuditService.log_action(
            db=db,
            action="IMPORT_P08",
            details=f"Imported {response.processed} students from P08_school_results_public.json",
            batch_id=batch_id,
            user="admin"
        )
    finally:
        db.close()
        print("Done.")

if __name__ == "__main__":
    main()
