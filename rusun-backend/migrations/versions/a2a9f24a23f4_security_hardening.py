"""security_hardening

Revision ID: a2a9f24a23f4
Revises: f5d6eb32ae18
Create Date: 2026-04-13 09:13:53.606999

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a2a9f24a23f4'
down_revision: Union[str, None] = 'f5d6eb32ae18'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # 1. FK application_id di Tenant
    with op.batch_alter_table('tenants', schema=None) as batch_op:
        batch_op.add_column(sa.Column('application_id', sa.Integer(), sa.ForeignKey('applications.id', name='fk_tenants_application'), nullable=True))
    
    # 2. Conditional unique index
    # Note: SQLite supports this from 3.9+ which is widespread.
    op.execute("""
        CREATE UNIQUE INDEX uq_application_nik_active
        ON applications (nik)
        WHERE status NOT IN ('rejected')
    """)

def downgrade():
    op.execute("DROP INDEX IF EXISTS uq_application_nik_active")
    with op.batch_alter_table('tenants', schema=None) as batch_op:
        batch_op.drop_column('application_id')
