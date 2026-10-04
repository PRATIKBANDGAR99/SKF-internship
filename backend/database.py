import os
import logging
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("skf-backend-db")

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/skf_inspection_db"
)

# Create SQLAlchemy engine
# pool_pre_ping=True tests connections before giving them to sessions
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Dependency providing a transactional database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Attempts to auto-create database tables on server startup."""
    try:
        Base.metadata.create_all(bind=engine)
        try:
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE inspection_records ADD COLUMN IF NOT EXISTS submitted_by VARCHAR(150);"))
                conn.commit()
        except Exception as col_err:
            logger.debug(f"Column check notice: {col_err}")
        logger.info("Database tables initialized successfully via SQLAlchemy.")
        return True
    except Exception as e:
        logger.warning(
            "Could not connect to PostgreSQL on startup (%s). "
            "Please ensure PostgreSQL is running and credentials in backend/.env are correct.",
            e
        )
        return False
