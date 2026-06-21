"""Pure unit tests for the security helpers — no DB, no network, very fast.

This is the simplest kind of test to copy: import a function, call it, assert
on the result. Good for anything in ``app/core``, ``app/services`` and schemas.
"""

from __future__ import annotations

from datetime import timedelta

from jose import jwt

from app.core.config import ALGORITHM, SECRET_KEY
from app.core.security import create_access_token, hash_password, verify_password


def test_hash_password_is_not_plaintext_and_verifies() -> None:
    hashed = hash_password("s3cret")

    assert hashed != "s3cret"
    assert verify_password("s3cret", hashed) is True


def test_verify_password_rejects_wrong_password() -> None:
    hashed = hash_password("s3cret")

    assert verify_password("wrong-password", hashed) is False


def test_create_access_token_round_trips_subject() -> None:
    token = create_access_token("42", expires_delta=timedelta(minutes=5))

    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    assert payload["sub"] == "42"
    assert "exp" in payload
