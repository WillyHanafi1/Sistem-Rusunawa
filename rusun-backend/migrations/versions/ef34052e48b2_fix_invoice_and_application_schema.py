"""fix_invoice_and_application_schema

Revision ID: ef34052e48b2
Revises: ee7142609c74
Create Date: 2026-04-04 01:00:20.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
import sqlmodel

# revision identifiers, used by Alembic.
revision: str = 'ef34052e48b2'
down_revision: Union[str, None] = 'ee7142609c74'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Tambahkan kolom ke tabel 'applications' ---
    op.add_column('applications', sa.Column('kk_file_path', sa.String(), nullable=True))
    op.add_column('applications', sa.Column('marriage_cert_file_path', sa.String(), nullable=True))
    op.add_column('applications', sa.Column('sku_file_path', sa.String(), nullable=True))
    op.add_column('applications', sa.Column('skck_file_path', sa.String(), nullable=True))
    op.add_column('applications', sa.Column('health_cert_file_path', sa.String(), nullable=True))
    op.add_column('applications', sa.Column('photo_file_path', sa.String(), nullable=True))
    op.add_column('applications', sa.Column('has_signed_statement', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('applications', sa.Column('is_documents_verified', sa.Boolean(), server_default='false', nullable=False))

    # --- Tambahkan kolom ke tabel 'invoices' ---
    op.add_column('invoices', sa.Column('penalty_amount', sa.Numeric(precision=12, scale=2), server_default='0', nullable=False))
    op.add_column('invoices', sa.Column('document_type', sa.String(), server_default='skrd', nullable=False))
    op.add_column('invoices', sa.Column('document_status_updated_at', sa.DateTime(), nullable=True))
    op.add_column('invoices', sa.Column('skrd_number', sa.String(), nullable=True))
    op.add_column('invoices', sa.Column('skrd_date', sa.Date(), nullable=True))
    op.add_column('invoices', sa.Column('teguran1_number', sa.String(), nullable=True))
    op.add_column('invoices', sa.Column('teguran1_date', sa.Date(), nullable=True))
    op.add_column('invoices', sa.Column('teguran2_number', sa.String(), nullable=True))
    op.add_column('invoices', sa.Column('teguran2_date', sa.Date(), nullable=True))
    op.add_column('invoices', sa.Column('teguran3_number', sa.String(), nullable=True))
    op.add_column('invoices', sa.Column('teguran3_date', sa.Date(), nullable=True))

    # --- Tambahkan kolom ke tabel 'tenants' ---
    op.add_column('tenants', sa.Column('bank_name', sa.String(), nullable=True))
    op.add_column('tenants', sa.Column('bank_account_number', sa.String(), nullable=True))
    op.add_column('tenants', sa.Column('bank_account_holder', sa.String(), nullable=True))


def downgrade() -> None:
    # Downgrade logic (Opsional, tapi sebaiknya ada)
    op.drop_column('tenants', 'bank_account_holder')
    op.drop_column('tenants', 'bank_account_number')
    op.drop_column('tenants', 'bank_name')
    # ... dst jika ingin lengkap
    pass
