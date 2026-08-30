import logging
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError, HTTPException
from app.core.config import settings
from app.core.database import engine, Base
from app.api import students, processing, checking_lists, analytics, audit, tests, ai

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize database tables
logger.info("Initializing database tables...")
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="EduGrade — School Result Processing & GPA Engine",
    description=(
        "Deterministic, production-quality result processing backend. "
        "Calculates subject grades, optional contributions, GPA caps, compulsory overrides, and generates explainabletraces."
    ),
    version=settings.ENGINE_VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
origins = [
    settings.FRONTEND_URL
]
# For development ease, allow localhost origins
if "localhost" in settings.FRONTEND_URL:
    origins.append("http://127.0.0.1:5173")
    origins.append("http://localhost:3000")
    origins.append("http://127.0.0.1:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(students.router)
app.include_router(processing.router)
app.include_router(checking_lists.router)
app.include_router(analytics.router)
app.include_router(audit.router)
app.include_router(tests.router)
app.include_router(ai.router)

# Custom Error Handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """
    Ensures HTTPExceptions return standardized JSON response format.
    """
    # Check if detail is already formatted
    detail = exc.detail
    if isinstance(detail, dict) and "error" in detail:
        return JSONResponse(status_code=exc.status_code, content=detail)
        
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": "HTTP_EXCEPTION",
                "message": str(detail)
            }
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Overrides FastAPI's validation exception to match our error format.
    """
    errors = exc.errors()
    # Format the first validation error as a primary message
    primary_msg = "Validation failed for the request payload."
    if errors:
        loc = " -> ".join(str(l) for l in errors[0].get("loc", []))
        primary_msg = f"Validation error at '{loc}': {errors[0].get('msg')}"

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": primary_msg,
                "details": errors
            }
        }
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """
    Prevents exposing Python stack traces to API clients on unexpected server errors.
    """
    logger.exception("An unhandled exception occurred")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred on the server. Please contact system support."
            }
        }
    )

@app.get("/")
def read_root():
    return {
        "app": "EduGrade Backend GPA Engine",
        "status": "online",
        "version": settings.ENGINE_VERSION,
        "docs_url": "/docs"
    }
