#!/bin/bash

# Deploy migration and fix embeddings
# This script:
# 1. Deploys the aoma_unified_vectors migration to Supabase
# 2. Runs the embedding migration script
# 3. Verifies the migration
# 4. Tests the hybrid integration

set -e  # Exit on error

echo "🚀 DEPLOYING MIGRATION AND FIXING EMBEDDINGS"
echo "=============================================================="
echo ""

# Step 1: Deploy migration
echo "📦 Step 1: Deploying aoma_unified_vectors migration..."
echo "--------------------------------------------------------------"

if command -v supabase &> /dev/null; then
    echo "✅ Supabase CLI found"

    # Check if migration exists
    if [ -f "supabase/migrations/001_aoma_vector_store_optimized.sql" ]; then
        echo "✅ Migration file found"

        # Deploy migration
        echo ""
        echo "🔄 Running: supabase db push"
        echo ""
        supabase db push

        echo ""
        echo "✅ Migration deployed successfully!"
    else
        echo "❌ Migration file not found: supabase/migrations/001_aoma_vector_store_optimized.sql"
        exit 1
    fi
else
    echo "❌ Supabase CLI not found. Install it first:"
    echo "   npm install -g supabase"
    echo ""
    echo "Or deploy manually via Supabase dashboard:"
    echo "   https://supabase.com/dashboard/project/_/sql/new"
    echo ""
    echo "Paste the contents of:"
    echo "   supabase/migrations/001_aoma_vector_store_optimized.sql"
    echo ""
    read -p "Press Enter after you've deployed the migration manually..."
fi

# Step 2: Run embedding migration
echo ""
echo ""
echo "📊 Step 2: Migrating embeddings from TEXT to vector(1536)..."
echo "--------------------------------------------------------------"
echo ""
echo "This will:"
echo "  - Read 393 wiki documents"
echo "  - Read 6,040 JIRA tickets"
echo "  - Generate OpenAI embeddings (vector(1536))"
echo "  - Insert into aoma_unified_vectors"
echo ""
echo "Estimated time: ~1 hour"
echo "Progress is saved - you can resume if interrupted"
echo ""

read -p "Ready to start? (y/N) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 Starting migration..."
    echo ""
    node scripts/fix-supabase-embeddings.js

    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Embedding migration complete!"
    else
        echo ""
        echo "❌ Migration failed. Check logs above."
        echo "💾 Progress is saved - you can resume by running:"
        echo "   node scripts/fix-supabase-embeddings.js"
        exit 1
    fi
else
    echo "⏭️  Skipping embedding migration"
    echo "   You can run it manually later:"
    echo "   node scripts/fix-supabase-embeddings.js"
    exit 0
fi

# Step 3: Verify integration
echo ""
echo ""
echo "🔍 Step 3: Verifying hybrid integration..."
echo "--------------------------------------------------------------"
echo ""
node scripts/test-hybrid-integration.js

echo ""
echo ""
echo "🎉 ALL DONE!"
echo "=============================================================="
echo ""
echo "Your hybrid AOMA + Supabase system is now FULLY OPERATIONAL!"
echo ""
echo "Next steps:"
echo "  1. Test locally: npm run dev"
echo "  2. Ask AOMA questions in chat"
echo "  3. Verify both Railway MCP and Supabase return results"
echo "  4. Deploy to production: git push origin main"
echo ""
echo "Expected behavior:"
echo "  - Railway MCP: ~10s, AOMA documentation"
echo "  - Supabase: ~500ms, wiki + JIRA results"
echo "  - Total searchable documents: 6,433"
echo ""
