"""add_bast_and_document_paths

Revision ID: c1662e87091a
Revises: 087ec09b18b5
Create Date: 2026-04-11 17:38:00.958861

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'c1662e87091a'
down_revision: Union[str, None] = '087ec09b18b5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Use inspector to check if columns exist (safety for local dev)
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    app_columns = [c['name'] for c in inspector.get_columns('applications')]
    tenant_columns = [c['name'] for c in inspector.get_columns('tenants')]

    with op.batch_alter_table('applications', schema=None) as batch_op:
        if 'ba_number' not in app_columns:
            batch_op.add_column(sa.Column('ba_number', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
        if 'ba_date' not in app_columns:
            batch_op.add_column(sa.Column('ba_date', sa.Date(), nullable=True))
        if 'ba_wawancara_path' not in app_columns:
            batch_op.add_column(sa.Column('ba_wawancara_path', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
        if 'permohonan_doc_path' not in app_columns:
            batch_op.add_column(sa.Column('permohonan_doc_path', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
        if 'sip_doc_path' not in app_columns:
            batch_op.add_column(sa.Column('sip_doc_path', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
        if 'pk_doc_path' not in app_columns:
            batch_op.add_column(sa.Column('pk_doc_path', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
        if 'sp_doc_path' not in app_columns:
            batch_op.add_column(sa.Column('sp_doc_path', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
        if 'bast_doc_path' not in app_columns:
            batch_op.add_column(sa.Column('bast_doc_path', sqlmodel.sql.sqltypes.AutoString(), nullable=True))

    with op.batch_alter_table('tenants', schema=None) as batch_op:
        if 'ba_wawancara_path' not in tenant_columns:
            batch_op.add_column(sa.Column('ba_wawancara_path', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
        if 'permohonan_doc_path' not in tenant_columns:
            batch_op.add_column(sa.Column('permohonan_doc_path', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
        if 'sip_doc_path' not in tenant_columns:
            batch_op.add_column(sa.Column('sip_doc_path', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
        if 'pk_doc_path' not in tenant_columns:
            batch_op.add_column(sa.Column('pk_doc_path', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
        if 'sp_doc_path' not in tenant_columns:
            batch_op.add_column(sa.Column('sp_doc_path', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
        if 'bast_doc_path' not in tenant_columns:
            batch_op.add_column(sa.Column('bast_doc_path', sqlmodel.sql.sqltypes.AutoString(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('tenants', schema=None) as batch_op:
        batch_op.drop_column('bast_doc_path')
        batch_op.drop_column('sp_doc_path')
        batch_op.drop_column('pk_doc_path')
        batch_op.drop_column('sip_doc_path')
        batch_op.drop_column('permohonan_doc_path')
        batch_op.drop_column('ba_wawancara_path')

    with op.batch_alter_table('applications', schema=None) as batch_op:
        batch_op.drop_column('bast_doc_path')
        batch_op.drop_column('sp_doc_path')
        batch_op.drop_column('pk_doc_path')
        batch_op.drop_column('sip_doc_path')
        batch_op.drop_column('permohonan_doc_path')
        batch_op.drop_column('ba_wawancara_path')
        batch_op.drop_column('ba_date')
        batch_op.drop_column('ba_number')
