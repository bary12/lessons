from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import Base, engine, get_db
from models import Lesson, LessonStatus, Paper


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(title="Deixis", lifespan=lifespan)


class DOIRequest(BaseModel):
    doi: str


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/doi")
async def lookup_doi(body: DOIRequest, db: AsyncSession = Depends(get_db)):
    doi = body.doi.strip().lower()

    result = await db.execute(
        select(Paper).where(Paper.doi == doi).options(selectinload(Paper.lesson))
    )
    paper = result.scalar_one_or_none()

    if paper is None:
        paper = Paper(doi=doi)
        db.add(paper)
        await db.flush()

        lesson = Lesson(paper_id=paper.id, status=LessonStatus.pending)
        db.add(lesson)
        await db.commit()
        await db.refresh(paper)
        await db.refresh(lesson)
        paper.lesson = lesson
        created = True
    else:
        created = False

    return {
        "paper": {
            "id": paper.id,
            "doi": paper.doi,
            "title": paper.title,
            "authors": paper.authors,
            "abstract": paper.abstract,
        },
        "lesson": {
            "id": paper.lesson.id,
            "status": paper.lesson.status,
            "js_path": paper.lesson.js_path,
        }
        if paper.lesson
        else None,
        "created": created,
    }
