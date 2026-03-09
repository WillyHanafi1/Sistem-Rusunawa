"""Add family members and bio fields

Revision ID: 5ffe19182fba
Revises: 
Create Date: 2026-03-09 20:55:30.702836

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '5ffe19182fba'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create family_members table
    op.create_table(
        'family_members',
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('age', sa.Integer(), nullable=False),
        sa.Column('gender', sa.String(), nullable=False),
        sa.Column('religion', sa.String(), nullable=True),
        sa.Column('marital_status', sa.String(), nullable=True),
        sa.Column('relation', sa.String(), nullable=False),
        sa.Column('occupation', sa.String(), nullable=True),
        sa.Column('application_id', sa.Integer(), nullable=True),
        sa.Column('tenant_id', sa.Integer(), nullable=True),
        sa.Column('id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['application_id'], ['applications.id'], ),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # 2. Add columns to applications
    with op.batch_alter_table('applications', schema=None) as batch_op:
        batch_op.add_column(sa.Column('place_of_birth', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('date_of_birth', sa.Date(), nullable=True))
        batch_op.add_column(sa.Column('religion', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('marital_status', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('occupation', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('previous_address', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('sk_number', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('sk_date', sa.Date(), nullable=True))
        batch_op.add_column(sa.Column('ps_number', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('ps_date', sa.Date(), nullable=True))
        batch_op.add_column(sa.Column('sip_number', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('sip_date', sa.Date(), nullable=True))
        batch_op.add_column(sa.Column('entry_time', sa.String(), nullable=True))

    # 3. Add columns to tenants
    with op.batch_alter_table('tenants', schema=None) as batch_op:
        batch_op.add_column(sa.Column('place_of_birth', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('date_of_birth', sa.Date(), nullable=True))
        batch_op.add_column(sa.Column('religion', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('marital_status', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('occupation', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('previous_address', sa.String(), nullable=True))


def downgrade() -> None:
    # 1. Drop columns from tenants
    with op.batch_alter_table('tenants', schema=None) as batch_op:
        batch_op.drop_column('previous_address')
        batch_op.drop_column('occupation')
        batch_op.drop_column('marital_status')
        batch_op.drop_column('religion')
        batch_op.drop_column('date_of_birth')
        batch_op.drop_column('place_of_birth')

    # 2. Drop columns from applications
    with op.batch_alter_table('applications', schema=None) as batch_op:
        batch_op.drop_column('entry_time')
        batch_op.drop_column('sip_date')
        batch_op.drop_column('sip_number')
        batch_op.drop_column('ps_date')
        batch_op.drop_column('ps_number')
        batch_op.drop_column('sk_date')
        batch_op.drop_column('sk_number')
        batch_op.drop_column('previous_address')
        batch_op.drop_column('occupation')
        batch_op.drop_column('marital_status')
        batch_op.drop_column('religion')
        batch_op.drop_column('date_of_birth')
        batch_op.drop_column('place_of_birth')

    # 3. Drop family_members table
    op.drop_table('family_members')
