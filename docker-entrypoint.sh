#!/bin/sh
set -e

# This project ships a Prisma schema but no migrations directory, so sync the
# schema to the database with `db push` (idempotent) before booting the app.
echo "⏳ Syncing database schema (prisma db push)..."
npx prisma db push --skip-generate
echo "✅ Database schema in sync."

exec "$@"
