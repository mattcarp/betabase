#!/bin/bash
# Script to import secrets from .env.local to Infisical

set -e

ENV_FILE="${1:-.env.local}"
INFISICAL_ENV="${2:-dev}"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: $ENV_FILE not found"
    exit 1
fi

echo "Importing secrets from $ENV_FILE to Infisical environment: $INFISICAL_ENV"
echo "=================================================="

# Read each line from .env.local
IMPORTED=0
SKIPPED=0

while IFS= read -r line || [ -n "$line" ]; do
    # Skip empty lines and comments
    if [ -z "$line" ] || [[ "$line" =~ ^[[:space:]]*# ]]; then
        continue
    fi

    # Check if line contains =
    if [[ "$line" =~ = ]]; then
        # Extract key and value
        KEY=$(echo "$line" | cut -d'=' -f1)
        VALUE=$(echo "$line" | cut -d'=' -f2-)

        # Skip if key is empty
        if [ -z "$KEY" ]; then
            continue
        fi

        echo -n "Importing $KEY... "

        # Set the secret in Infisical
        if infisical secrets set "$KEY=$VALUE" --env="$INFISICAL_ENV" --silent 2>/dev/null; then
            echo "✅"
            ((IMPORTED++))
        else
            echo "❌"
            ((SKIPPED++))
        fi
    fi
done < "$ENV_FILE"

echo "=================================================="
echo "Import complete!"
echo "Imported: $IMPORTED secrets"
echo "Skipped: $SKIPPED secrets"
echo ""
echo "To verify, run: infisical run --env=$INFISICAL_ENV -- node -e \"console.log(Object.keys(process.env).length, 'env vars loaded')\""
