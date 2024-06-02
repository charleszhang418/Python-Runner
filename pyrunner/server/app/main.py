from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.future import select
from sqlalchemy import delete
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import Column, Integer, Text
import subprocess
import sys

app = FastAPI()

DATABASE_URL = "sqlite+aiosqlite:///./app/test.db"
engine = create_async_engine(DATABASE_URL, echo=True, future=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession)
Base = declarative_base()

class ExecutionHistory(Base):
    __tablename__ = 'execution_histories'
    id = Column(Integer, primary_key=True, index=True)
    code = Column(Text)
    output = Column(Text)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        await db.close()

class Code(BaseModel):
    code: str

@app.post("/run/")
async def run_code(code: Code, db: AsyncSession = Depends(get_db)):
    try:
        result = subprocess.run(
            [sys.executable, "-c", code.code],
            text=True,
            capture_output=True,
            timeout=5
        )
        history = ExecutionHistory(code=code.code, output=result.stdout if result.returncode == 0 else result.stderr)
        db.add(history)
        await db.commit()
        if result.stderr:
            return {"error": result.stderr}
        return {"result": result.stdout}
    except subprocess.TimeoutExpired:
        return {"error": "Timeout: Code took too long to execute"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history/")
async def get_history(db: AsyncSession = Depends(get_db)):
    async with db.begin():
        result = await db.execute(select(ExecutionHistory))
        histories = result.scalars().all()
        return [{"code": history.code, "output": history.output} for history in histories]

@app.delete("/clear-history/")
async def clear_history(db: AsyncSession = Depends(get_db)):
    await db.execute(delete(ExecutionHistory))
    await db.commit()
    return {"message": "History cleared successfully"}
    
    
