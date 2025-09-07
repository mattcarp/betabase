#!/bin/bash

# SIAM Documentation Tag Manager
# For creating technical demonstration videos

set -e

DOCS_DIR="${1:-docs}"
ACTION="${2:-search}"
TAGS="${3:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

function show_help {
    echo -e "${BLUE}SIAM Documentation Tag Manager${NC}"
    echo ""
    echo "Usage: ./tag-manager.sh [docs_dir] [action] [tags]"
    echo ""
    echo "Actions:"
    echo "  search [tag1,tag2]    - Find documents with specified tags"
    echo "  list                  - List all unique tags in use"
    echo "  stats                 - Show tag usage statistics"
    echo "  video [category]      - Find documents for video production"
    echo "  add [file] [tags]     - Add tags to a document"
    echo "  validate              - Check for missing or invalid tags"
    echo ""
    echo "Video Categories:"
    echo "  architecture          - System architecture deep dive"
    echo "  ai-innovation        - AI/ML features showcase"
    echo "  knowledge-mgmt       - Knowledge curation system"
    echo "  production           - Production engineering"
    echo "  technical-demo       - General technical demonstration"
    echo ""
    echo "Examples:"
    echo "  ./tag-manager.sh docs search 'architecture,mcp-servers'"
    echo "  ./tag-manager.sh docs video ai-innovation"
    echo "  ./tag-manager.sh docs stats"
}

function search_by_tags {
    local tags=$1
    echo -e "${BLUE}Searching for documents with tags: ${tags}${NC}"
    echo ""
    
    # Convert comma-separated tags to OR pattern
    local pattern=$(echo $tags | sed 's/,/\\|/g')
    
    # Find files containing any of the specified tags
    local files=$(grep -r "TAGS:.*\(${pattern}\)" "$DOCS_DIR" --include="*.md" 2>/dev/null | cut -d: -f1 | sort -u)
    
    if [ -z "$files" ]; then
        echo -e "${YELLOW}No documents found with tags: ${tags}${NC}"
    else
        for file in $files; do
            # Extract title and tags from file
            local title=$(grep -m1 "^# " "$file" 2>/dev/null | sed 's/^# //')
            local file_tags=$(grep "<!-- TAGS:" "$file" 2>/dev/null | sed 's/<!-- TAGS: //' | sed 's/ -->//')
            
            echo -e "${GREEN}📄 ${file}${NC}"
            echo "   Title: ${title:-No title found}"
            echo "   Tags: ${file_tags}"
            echo ""
        done
    fi
}

function list_all_tags {
    echo -e "${BLUE}All tags in use:${NC}"
    echo ""
    
    grep -rh "<!-- TAGS:" "$DOCS_DIR" --include="*.md" 2>/dev/null | \
        sed 's/<!-- TAGS: //' | sed 's/ -->//' | \
        tr ',' '\n' | sed 's/^ *//' | sed 's/ *$//' | \
        sort -u | \
        while read tag; do
            if [ ! -z "$tag" ]; then
                echo "  • $tag"
            fi
        done
}

function show_tag_stats {
    echo -e "${BLUE}Tag Usage Statistics:${NC}"
    echo ""
    
    echo "Top 10 Most Used Tags:"
    grep -rh "<!-- TAGS:" "$DOCS_DIR" --include="*.md" 2>/dev/null | \
        sed 's/<!-- TAGS: //' | sed 's/ -->//' | \
        tr ',' '\n' | sed 's/^ *//' | sed 's/ *$//' | \
        sort | uniq -c | sort -rn | head -10 | \
        while read count tag; do
            printf "  %3d × %s\n" "$count" "$tag"
        done
    
    echo ""
    echo "Documents by Tag Count:"
    local total_docs=$(find "$DOCS_DIR" -name "*.md" -type f 2>/dev/null | wc -l)
    local tagged_docs=$(grep -r "<!-- TAGS:" "$DOCS_DIR" --include="*.md" 2>/dev/null | cut -d: -f1 | sort -u | wc -l)
    
    echo "  Total documents: $total_docs"
    echo "  Tagged documents: $tagged_docs"
    echo "  Untagged documents: $((total_docs - tagged_docs))"
}

function find_video_content {
    local category=$1
    
    case $category in
        architecture)
            echo -e "${BLUE}Finding content for Architecture Video:${NC}"
            search_by_tags "architecture,infrastructure,mcp-servers,technical-depth,architecture-decision"
            ;;
        ai-innovation)
            echo -e "${BLUE}Finding content for AI Innovation Video:${NC}"
            search_by_tags "ai-integration,llm,rag,vector-store,innovation-highlight,demo-ready"
            ;;
        knowledge-mgmt)
            echo -e "${BLUE}Finding content for Knowledge Management Video:${NC}"
            search_by_tags "knowledge-curation,deduplication,roi-metrics,visual-impact,analytics"
            ;;
        production)
            echo -e "${BLUE}Finding content for Production Engineering Video:${NC}"
            search_by_tags "production,monitoring,ci-cd,render-deployment,lessons-learned"
            ;;
        technical-demo)
            echo -e "${BLUE}Finding content for Technical Demo:${NC}"
            search_by_tags "demo-ready,visual-impact,technical-depth,innovation-highlight"
            ;;
        *)
            echo -e "${RED}Unknown video category: $category${NC}"
            echo "Available categories: architecture, ai-innovation, knowledge-mgmt, production, technical-demo"
            ;;
    esac
}

function add_tags_to_file {
    local file=$1
    local tags=$2
    
    if [ ! -f "$file" ]; then
        echo -e "${RED}File not found: $file${NC}"
        return 1
    fi
    
    # Check if tags already exist
    if grep -q "<!-- TAGS:" "$file"; then
        echo -e "${YELLOW}File already has tags. Updating...${NC}"
        # Replace existing tags
        sed -i '' "s/<!-- TAGS:.* -->/<!-- TAGS: $tags -->/" "$file"
    else
        # Add tags after the first heading
        sed -i '' "1,/^#/s/^# .*/&\n<!-- TAGS: $tags -->/" "$file"
    fi
    
    echo -e "${GREEN}✓ Tags added to $file${NC}"
}

function validate_tags {
    echo -e "${BLUE}Validating tags in documentation:${NC}"
    echo ""
    
    # Find markdown files without tags
    echo "Files without tags:"
    find "$DOCS_DIR" -name "*.md" -type f 2>/dev/null | while read file; do
        if ! grep -q "<!-- TAGS:" "$file" 2>/dev/null; then
            echo "  ⚠️  $file"
        fi
    done
    
    echo ""
    echo "Files with potential issues:"
    
    # Find files with too many tags (>7)
    grep -r "<!-- TAGS:" "$DOCS_DIR" --include="*.md" 2>/dev/null | while IFS=: read file tags; do
        tag_count=$(echo "$tags" | tr ',' '\n' | wc -l)
        if [ $tag_count -gt 7 ]; then
            echo "  ⚠️  Too many tags ($tag_count): $file"
        fi
    done
}

# Main execution
case $ACTION in
    search)
        if [ -z "$TAGS" ]; then
            echo -e "${RED}Please specify tags to search for${NC}"
            exit 1
        fi
        search_by_tags "$TAGS"
        ;;
    list)
        list_all_tags
        ;;
    stats)
        show_tag_stats
        ;;
    video)
        if [ -z "$TAGS" ]; then
            echo -e "${RED}Please specify video category${NC}"
            echo "Available: architecture, ai-innovation, knowledge-mgmt, production, technical-demo"
            exit 1
        fi
        find_video_content "$TAGS"
        ;;
    add)
        if [ -z "$TAGS" ] || [ -z "$4" ]; then
            echo -e "${RED}Usage: ./tag-manager.sh docs add [file] [tags]${NC}"
            exit 1
        fi
        add_tags_to_file "$TAGS" "$4"
        ;;
    validate)
        validate_tags
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        show_help
        ;;
esac