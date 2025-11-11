#!/usr/bin/env bash
set -euo pipefail

echo "Running Prisma schema synchronization..."
npx prisma db push --skip-generate

echo "Seeding database..."
npm run db:seed

echo "Starting application..."
exec npm run start

