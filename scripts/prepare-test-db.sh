#!/usr/bin/env bash

set -euo pipefail

export DATABASE_URL="${DATABASE_URL:-postgresql://journey:journey@localhost:5432/journey_test?schema=public}"

pnpm prisma:migrate:deploy
