#!/bin/bash

# Database Reset and Seed Script for FastAPI RBAC
# This script provides options to reset the database and seed it with initial data

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    cat << EOF
${BLUE}FastAPI RBAC Database Reset and Seed Script${NC}

Usage: bash reset_and_seed.sh [OPTIONS]

Options:
    -h, --help              Show this help message
    -r, --reset             Reset the database (drop all tables)
    -s, --seed              Seed the database with initial data
    -a, --all               Reset and seed the database (equivalent to -rs)
    -m, --migrate-only      Run only Alembic migrations (no reset)
    --skip-cache            Skip clearing FastAPI caches
    -v, --verbose           Show detailed output

Examples:
    # Reset and seed the database
    bash reset_and_seed.sh --all

    # Reset database only
    bash reset_and_seed.sh --reset

    # Seed database only (assumes schema exists)
    bash reset_and_seed.sh --seed

    # Run migrations only
    bash reset_and_seed.sh --migrate-only

EOF
}

# Default values
RESET=false
SEED=false
SKIP_CACHE=false
VERBOSE=false
MIGRATE_ONLY=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        -r|--reset)
            RESET=true
            shift
            ;;
        -s|--seed)
            SEED=true
            shift
            ;;
        -a|--all)
            RESET=true
            SEED=true
            shift
            ;;
        -m|--migrate-only)
            MIGRATE_ONLY=true
            shift
            ;;
        --skip-cache)
            SKIP_CACHE=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# If no options specified, show usage
if [ "$RESET" = false ] && [ "$SEED" = false ] && [ "$MIGRATE_ONLY" = false ]; then
    print_warning "No options specified. Use --help for usage information."
    show_usage
    exit 1
fi

# Change to backend directory
cd "$SCRIPT_DIR"

# Activate virtual environment if it exists
if [ -f "venv/bin/activate" ]; then
    print_info "Activating virtual environment..."
    source venv/bin/activate
fi

# Build the Python command
PYTHON_CMD="python alembic/reset_db.py"

if [ "$RESET" = true ]; then
    # No flag needed for reset, it's the default behavior
    PYTHON_CMD="$PYTHON_CMD"
fi

if [ "$SEED" = false ]; then
    PYTHON_CMD="$PYTHON_CMD --no-seed"
fi

if [ "$SKIP_CACHE" = true ]; then
    PYTHON_CMD="$PYTHON_CMD --skip-cache"
fi

if [ "$MIGRATE_ONLY" = true ]; then
    print_info "Running Alembic migrations only..."
    python -m alembic upgrade head
    print_success "Migrations completed successfully!"
    exit 0
fi

# Run the Python script
if [ "$VERBOSE" = true ]; then
    print_info "Running: $PYTHON_CMD"
fi

print_info "Starting database reset and seed process..."
echo ""

if eval "$PYTHON_CMD"; then
    print_success "Database operation completed successfully!"
    echo ""
    print_success "Database Status:"
    print_success "  - Schema created/reset: $([ "$RESET" = true ] && echo 'YES' || echo 'NO')"
    print_success "  - Data seeded: $([ "$SEED" = true ] && echo 'YES' || echo 'NO')"
    echo ""
    print_info "You can now start the application with:"
    print_info "  bash start.sh"
else
    print_error "Database operation failed!"
    exit 1
fi
