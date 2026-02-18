import enum
from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, Enum, ForeignKey, Integer, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class LessonStatus(str, enum.Enum):
    pending = "pending"
    ready = "ready"
    error = "error"


class Paper(Base):
    __tablename__ = "papers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    doi: Mapped[str] = mapped_column(Text, unique=True, nullable=False, index=True)
    title: Mapped[str | None] = mapped_column(Text)
    authors: Mapped[list | None] = mapped_column(JSON)
    abstract: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    lesson: Mapped["Lesson | None"] = relationship(back_populates="paper")


class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    paper_id: Mapped[int] = mapped_column(ForeignKey("papers.id"), nullable=False)
    status: Mapped[LessonStatus] = mapped_column(
        Enum(LessonStatus), nullable=False, default=LessonStatus.pending
    )
    js_path: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    paper: Mapped["Paper"] = relationship(back_populates="lesson")
