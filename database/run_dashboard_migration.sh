#!/bin/bash

# Dashboard Tables Migration Script
# This script creates all necessary tables for the dashboard features

echo "Running dashboard tables migration..."

# Get MySQL credentials
read -p "MySQL username (default: root): " MYSQL_USER
MYSQL_USER=${MYSQL_USER:-root}

read -sp "MySQL password: " MYSQL_PASSWORD
echo ""

# Run the migration
mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" attendance_db < "$(dirname "$0")/dashboard_tables.sql"

if [ $? -eq 0 ]; then
    echo "✅ Dashboard tables migration completed successfully!"
else
    echo "❌ Migration failed. Please check the error messages above."
    exit 1
fi
