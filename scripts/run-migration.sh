#!/bin/bash
# ==============================================
# Run SQL migration against hosted Supabase DB
# Usage: SUPABASE_DB_PASSWORD=your_password bash scripts/run-migration.sh
# ==============================================

PROJECT_REF="uvnqsamswfmrfxedawko"
DB_HOST="aws-0-us-east-1.pooler.supabase.com"
DB_PORT="6543"
DB_NAME="postgres"
DB_USER="postgres.${PROJECT_REF}"

if [ -z "$SUPABASE_DB_PASSWORD" ]; then
    echo ""
    echo "  Ingresa tu Database Password de Supabase"
    echo "  (Dashboard > Settings > Database > Connection string)"
    echo ""
    read -s -p "  Password: " SUPABASE_DB_PASSWORD
    echo ""
fi

echo ""
echo "  Conectando a Supabase y ejecutando migracion..."
echo ""

PGPASSWORD="$SUPABASE_DB_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -f "supabase/migrations/20260215_admin_reset_password.sql" \
    2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "  Migracion ejecutada exitosamente!"
    echo "  La funcion admin_reset_password ya esta disponible."
    echo ""
else
    echo ""
    echo "  Error al ejecutar la migracion."
    echo "  Verifica tu password e intenta de nuevo."
    echo ""
fi
