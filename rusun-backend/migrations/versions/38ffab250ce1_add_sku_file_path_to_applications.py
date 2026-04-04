"""Add sku_file_path to applications

Revision ID: 38ffab250ce1
Revises: ef34052e48b2
Create Date: 2026-04-04 13:19:04.632847

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '38ffab250ce1'
down_revision: Union[str, None] = 'ef34052e48b2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Check for existing columns to make this migration idempotent
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [c['name'] for c in inspector.get_columns('applications')]

    with op.batch_alter_table('applications', schema=None) as batch_op:
        if 'sku_file_path' not in columns:
            batch_op.add_column(sa.Column('sku_file_path', sa.String(), nullable=True))
        if 'skck_file_path' not in columns:
            batch_op.add_column(sa.Column('skck_file_path', sa.String(), nullable=True))
        if 'health_cert_file_path' not in columns:
            batch_op.add_column(sa.Column('health_cert_file_path', sa.String(), nullable=True))
        if 'photo_file_path' not in columns:
            batch_op.add_column(sa.Column('photo_file_path', sa.String(), nullable=True))
        if 'has_signed_statement' not in columns:
            batch_op.add_column(sa.Column('has_signed_statement', sa.Boolean(), nullable=False, server_default=sa.text('false')))


def downgrade() -> None:
    # Check for existing columns before dropping to make this migration idempotent
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [c['name'] for c in inspector.get_columns('applications')]

    with op.batch_alter_table('applications', schema=None) as batch_op:
        if 'has_signed_statement' in columns:
            batch_op.drop_column('has_signed_statement')
        if 'photo_file_path' in columns:
            batch_op.drop_column('photo_file_path')
        if 'health_cert_file_path' in columns:
            batch_op.drop_column('health_cert_file_path')
        if 'skck_file_path' in columns:
            batch_op.drop_column('skck_file_path')
        if 'sku_file_path' in columns:
            batch_op.drop_column('sku_file_path')
