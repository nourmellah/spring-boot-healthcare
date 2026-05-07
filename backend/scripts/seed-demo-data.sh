#!/usr/bin/env bash
set -euo pipefail

# Demo seed runner for the Healthcare Spring Boot + Angular app.
# Default target matches the user's Docker command:
# docker run --name healthcare-mysql -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=healthcare_db -p 3306:3306 -d mysql:8.0
#
# Usage:
#   ./backend/scripts/seed-demo-data.sh users
#   ./backend/scripts/seed-demo-data.sh appointments
#   ./backend/scripts/seed-demo-data.sh clinical
#   ./backend/scripts/seed-demo-data.sh notifications
#   ./backend/scripts/seed-demo-data.sh all
#
# Optional environment overrides:
#   MYSQL_CONTAINER=healthcare-mysql MYSQL_DATABASE=healthcare_db MYSQL_USER=root MYSQL_PASSWORD=root ./backend/scripts/seed-demo-data.sh all
#   USE_DOCKER=0 MYSQL_HOST=127.0.0.1 MYSQL_PORT=3306 MYSQL_DATABASE=healthcare_db MYSQL_USER=root MYSQL_PASSWORD=root ./backend/scripts/seed-demo-data.sh all

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
SQL_DIR="${BACKEND_DIR}/sql/demo-seed"

MODE="${1:-all}"
USE_DOCKER="${USE_DOCKER:-1}"
MYSQL_CONTAINER="${MYSQL_CONTAINER:-healthcare-mysql}"
MYSQL_HOST="${MYSQL_HOST:-127.0.0.1}"
MYSQL_PORT="${MYSQL_PORT:-3306}"
MYSQL_DATABASE="${MYSQL_DATABASE:-healthcare_db}"
MYSQL_USER="${MYSQL_USER:-root}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-root}"

run_sql() {
  local file="$1"
  echo "==> Running $(basename "$file")"

  if [[ "$USE_DOCKER" == "1" ]]; then
    docker exec -i "$MYSQL_CONTAINER" mysql "-u${MYSQL_USER}" "-p${MYSQL_PASSWORD}" "$MYSQL_DATABASE" < "$file"
  else
    mysql -h "$MYSQL_HOST" -P "$MYSQL_PORT" "-u${MYSQL_USER}" "-p${MYSQL_PASSWORD}" "$MYSQL_DATABASE" < "$file"
  fi
}

check_database_ready() {
  echo "==> Checking database and generated tables"

  if [[ "$USE_DOCKER" == "1" ]]; then
    if ! docker ps --format '{{.Names}}' | grep -qx "$MYSQL_CONTAINER"; then
      echo "ERROR: Docker container '$MYSQL_CONTAINER' is not running."
      echo "Start it first, for example: docker start $MYSQL_CONTAINER"
      exit 1
    fi

    if ! docker exec -i "$MYSQL_CONTAINER" mysql "-u${MYSQL_USER}" "-p${MYSQL_PASSWORD}" "$MYSQL_DATABASE" -e "SHOW TABLES LIKE 'users';" | grep -q "users"; then
      echo "ERROR: Table 'users' was not found in database '$MYSQL_DATABASE'."
      echo "Start the Spring Boot backend once first so Hibernate creates/updates the tables, then rerun this script."
      exit 1
    fi
  else
    if ! mysql -h "$MYSQL_HOST" -P "$MYSQL_PORT" "-u${MYSQL_USER}" "-p${MYSQL_PASSWORD}" "$MYSQL_DATABASE" -e "SHOW TABLES LIKE 'users';" | grep -q "users"; then
      echo "ERROR: Table 'users' was not found in database '$MYSQL_DATABASE'."
      echo "Start the Spring Boot backend once first so Hibernate creates/updates the tables, then rerun this script."
      exit 1
    fi
  fi
}

check_database_ready

case "$MODE" in
  users|base)
    run_sql "$SQL_DIR/01-users-specialties-medicines.sql"
    ;;
  appointments)
    run_sql "$SQL_DIR/01-users-specialties-medicines.sql"
    run_sql "$SQL_DIR/02-appointments.sql"
    ;;
  clinical)
    run_sql "$SQL_DIR/01-users-specialties-medicines.sql"
    run_sql "$SQL_DIR/02-appointments.sql"
    run_sql "$SQL_DIR/03-clinical-records.sql"
    ;;
  notifications)
    run_sql "$SQL_DIR/01-users-specialties-medicines.sql"
    run_sql "$SQL_DIR/02-appointments.sql"
    run_sql "$SQL_DIR/03-clinical-records.sql"
    run_sql "$SQL_DIR/04-notifications-emergencies-audit.sql"
    ;;
  all)
    run_sql "$SQL_DIR/01-users-specialties-medicines.sql"
    run_sql "$SQL_DIR/02-appointments.sql"
    run_sql "$SQL_DIR/03-clinical-records.sql"
    run_sql "$SQL_DIR/04-notifications-emergencies-audit.sql"
    ;;
  *)
    echo "ERROR: Unknown mode '$MODE'."
    echo "Valid modes: users, appointments, clinical, notifications, all"
    exit 1
    ;;
esac

echo "==> Demo seeding finished."
echo "Demo password for all seeded users: Demo@123456"
echo "Useful accounts:"
echo "  doctor:  youssef.abbes.doctor@demo.local"
echo "  doctor:  leila.trabelsi.doctor@demo.local"
echo "  patient: sarah.benali.patient@demo.local"
echo "  patient: amir.khelifi.patient@demo.local"
echo "  lab:     ines.mansouri.lab@demo.local"
