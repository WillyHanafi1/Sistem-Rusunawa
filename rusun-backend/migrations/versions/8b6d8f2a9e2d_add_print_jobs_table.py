"""add_print_jobs_table

Revision ID: 8b6d8f2a9e2d
Revises: a2a9f24a23f4
Create Date: 2026-04-13 17:51:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel

# revision identifiers, used by Alembic.
revision = '8b6d8f2a9e2d'
down_revision = 'a2a9f24a23f4'
branch_labels = None
depends_on = None

def upgrade():
    op.create_table('print_jobs',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('month', sa.Integer(), nullable=False),
        sa.Column('year', sa.Integer(), nullable=False),
        sa.Column('doc_type', sa.String(), nullable=False),
        sa.Column('building', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('total', sa.Integer(), nullable=False),
        sa.Column('processed', sa.Integer(), nullable=False),
        sa.Column('file_path', sa.String(), nullable=True),
        sa.Column('error', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade():
    op.drop_table('print_jobs')
