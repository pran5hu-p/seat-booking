from sqlalchemy.orm import Session


def comma_separated_to_list(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


def row_label_for_index(index: int) -> str:
    """Excel-style column label for a 0-based row index: A, B, ..., Z, AA, AB, ..."""
    label = ""
    index += 1
    while index > 0:
        index, remainder = divmod(index - 1, 26)
        label = chr(ord("A") + remainder) + label
    return label


def commit_or_rollback(db: Session) -> None:
    """Commit the transaction, or roll back and re-raise if it failed."""
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
