"""add_performance_indexes_to_invoices

Revision ID: f5d6eb32ae18
Revises: c1662e87091a
Create Date: 2026-04-12 02:16:17.764940

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel
from datetime import datetime


# revision identifiers, used by Alembic.
revision: str = 'f5d6eb32ae18'
down_revision: Union[str, None] = 'c1662e87091a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Use inspector to check if columns exist
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    # --- Check Columns for 'invoices' ---
    inv_columns = [c['name'] for c in inspector.get_columns('invoices')]
    inv_indexes = [i['name'] for i in inspector.get_indexes('invoices')]
    
    with op.batch_alter_table('invoices', schema=None) as batch_op:
        # Add missing columns if they don't exist
        if 'strd_number' not in inv_columns:
            batch_op.add_column(sa.Column('strd_number', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
        if 'strd_date' not in inv_columns:
            batch_op.add_column(sa.Column('strd_date', sa.Date(), nullable=True))
        if 'jaminan_number' not in inv_columns:
            batch_op.add_column(sa.Column('jaminan_number', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
        if 'jaminan_date' not in inv_columns:
            batch_op.add_column(sa.Column('jaminan_date', sa.Date(), nullable=True))
        if 'payment_url' not in inv_columns:
            batch_op.add_column(sa.Column('payment_url', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
        if 'payment_id' not in inv_columns:
            batch_op.add_column(sa.Column('payment_id', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
        if 'midtrans_order_id' not in inv_columns:
            batch_op.add_column(sa.Column('midtrans_order_id', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
        if 'paid_at' not in inv_columns:
            batch_op.add_column(sa.Column('paid_at', sa.DateTime(), nullable=True))
        if 'notes' not in inv_columns:
            batch_op.add_column(sa.Column('notes', sqlmodel.sql.sqltypes.AutoString(), nullable=True))

        # Standardize existing columns (if they exist)
        for col in ['skrd_number', 'teguran1_number', 'teguran2_number', 'teguran3_number']:
            if col in inv_columns:
                batch_op.alter_column(col, existing_type=sa.TEXT(), type_=sqlmodel.sql.sqltypes.AutoString(), existing_nullable=True)

        # Performance Indexes
        # Drop old indexes if they exist (clean up any inconsistent state)
        if 'idx_invoices_status' in inv_indexes:
            batch_op.drop_index('idx_invoices_status')
        if 'idx_invoices_tenant' in inv_indexes:
            batch_op.drop_index('idx_invoices_tenant')
        if 'idx_invoices_year_month' in inv_indexes:
            batch_op.drop_index('idx_invoices_year_month')
            
        # Create new optimized indexes
        if 'ix_invoices_period_year' not in inv_indexes:
            batch_op.create_index('ix_invoices_period_year', ['period_year'], unique=False)
        if 'ix_invoices_status' not in inv_indexes:
            batch_op.create_index('ix_invoices_status', ['status'], unique=False)
        if 'ix_invoices_tenant_id' not in inv_indexes:
            batch_op.create_index('ix_invoices_tenant_id', ['tenant_id'], unique=False)

    # --- Check Columns for 'applications' (Consistency) ---
    app_columns = [c['name'] for c in inspector.get_columns('applications')]
    with op.batch_alter_table('applications', schema=None) as batch_op:
        for col in ['ba_number', 'ba_wawancara_path', 'permohonan_doc_path', 'sip_doc_path', 'pk_doc_path', 'sp_doc_path', 'bast_doc_path']:
            if col in app_columns:
                batch_op.alter_column(col, existing_type=sa.TEXT(), type_=sqlmodel.sql.sqltypes.AutoString(), existing_nullable=True)

    # --- Check Columns for 'tenants' (Consistency) ---
    tenant_columns = [c['name'] for c in inspector.get_columns('tenants')]
    with op.batch_alter_table('tenants', schema=None) as batch_op:
        for col in ['ba_wawancara_path', 'permohonan_doc_path', 'sip_doc_path', 'pk_doc_path', 'sp_doc_path', 'bast_doc_path']:
            if col in tenant_columns:
                batch_op.alter_column(col, existing_type=sa.TEXT(), type_=sqlmodel.sql.sqltypes.AutoString(), existing_nullable=True)


def downgrade() -> None:
    # Safe downgrade logic
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    inv_indexes = [i['name'] for i in inspector.get_indexes('invoices')]
    
    with op.batch_alter_table('invoices', schema=None) as batch_op:
        if 'ix_invoices_tenant_id' in inv_indexes:
            batch_op.drop_index('ix_invoices_tenant_id')
        if 'ix_invoices_status' in inv_indexes:
            batch_op.drop_index('ix_invoices_status')
        if 'ix_invoices_period_year' in inv_indexes:
            batch_op.drop_index('ix_invoices_period_year')
        
        # We don't necessarily drop the "missing" columns here to prevent data loss 
        # unless it was an intentional rollback of a feature.
    pass
