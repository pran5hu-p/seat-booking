"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-08-12

"""
from alembic import op
import sqlalchemy as sa


revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "events",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("event_date", sa.DateTime(), nullable=False),
        sa.Column("rows", sa.Integer(), nullable=False),
        sa.Column("seats_per_row", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
    )

    op.create_table(
        "seats",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("event_id", sa.Integer(), nullable=False),
        sa.Column("row_label", sa.String(length=5), nullable=False),
        sa.Column("seat_number", sa.Integer(), nullable=False),
        sa.Column(
            "is_blocked",
            sa.Boolean(),
            server_default=sa.text("FALSE"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["event_id"], ["events.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("event_id", "row_label", "seat_number", name="uniq_event_seat"),
    )

    op.create_table(
        "booking_groups",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("event_id", sa.Integer(), nullable=False),
        sa.Column("booker_name", sa.String(length=255), nullable=False),
        sa.Column("booker_email", sa.String(length=255), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["event_id"], ["events.id"], ondelete="CASCADE"),
    )

    op.create_table(
        "bookings",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("booking_group_id", sa.Integer(), nullable=False),
        sa.Column("seat_id", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["booking_group_id"], ["booking_groups.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["seat_id"], ["seats.id"]),
        sa.UniqueConstraint("seat_id", name="uniq_seat_booking"),
    )


def downgrade() -> None:
    op.drop_table("bookings")
    op.drop_table("booking_groups")
    op.drop_table("seats")
    op.drop_table("events")
