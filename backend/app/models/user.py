"""Workspace identities used by the RAVEN login boundary."""

from sqlalchemy import Boolean, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base
from app.models.base_model import MutableBaseModel


class User(Base, MutableBaseModel):
    __tablename__ = "users"
    __table_args__ = (Index("ix_users_username", "username"),)

    username: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    display_name: Mapped[str] = mapped_column(String(160), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
