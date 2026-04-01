"""add renewal_count to Tenant

Revision ID: ee7142609c74
Revises: 5ffe19182fba
Create Date: 2026-04-01 18:08:41.398655

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ee7142609c74'
down_revision: Union[str, None] = '5ffe19182fba'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('tenants', sa.Column('renewal_count', sa.Integer(), server_default='0', nullable=False))


def downgrade() -> None:
    op.drop_column('tenants', 'renewal_count')
