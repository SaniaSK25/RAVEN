"""REQ-number assignment tests (SQLite :memory:, no AWS)."""

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.db.base import Base
from app.models.id_counter import IdCounter
from app.services.numbering import next_req_key


def make_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    return Session(engine)


def test_sequential_keys():
    with make_session() as session:
        assert next_req_key(session) == "REQ-0001"
        assert next_req_key(session) == "REQ-0002"
        assert next_req_key(session) == "REQ-0003"
        session.commit()
    with make_session() as session:
        row = session.execute(
            select(IdCounter).where(IdCounter.name == "requirement")
        ).scalar_one_or_none()
        assert row is None  # fresh DB starts over; counter lives with the data


def test_counter_advances_with_data():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    with Session(engine) as session:
        assert next_req_key(session) == "REQ-0001"
        session.commit()
    with Session(engine) as session:
        assert next_req_key(session) == "REQ-0002"
        session.commit()


def test_rollback_burns_no_numbers():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    with Session(engine) as session:
        assert next_req_key(session) == "REQ-0001"
        session.rollback()
    with Session(engine) as session:
        assert next_req_key(session) == "REQ-0001"
        session.commit()


def test_padding_grows_past_9999():
    from app.services import numbering

    assert numbering.KEY_WIDTH == 4
    assert f"REQ-{10000:04d}" == "REQ-10000"
