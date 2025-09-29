"""
Database connection and configuration
"""

import os
from sqlalchemy import create_engine, MetaData
from databases import Database
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5433/qa_report_db")

# SQLAlchemy
engine = create_engine(DATABASE_URL)
metadata = MetaData()

# Databases (for async)
database = Database(DATABASE_URL)