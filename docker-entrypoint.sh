#!/bin/sh
set -e

echo "Waiting for database..."
until pg_isready -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "${DB_USER:-postgres}" > /dev/null 2>&1; do
  sleep 1
done
echo "Database is ready."

echo "Running Prisma migrations..."
npx prisma db push --skip-generate

echo "Running seed..."
npx tsx prisma/seed.ts

echo "Starting server..."
exec "$@"
