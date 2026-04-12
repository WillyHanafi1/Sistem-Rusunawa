#!/bin/bash

set -e



# Run migrations

echo "Running database migrations..."

python -m alembic upgrade head



# Start the application

echo "Starting application..."

exec "$@"