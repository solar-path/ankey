#!/bin/bash

# Ankey Multi-Tenant Application Setup Script
# This script sets up the complete development environment on Linux

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to detect OS
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command_exists apt-get; then
            echo "ubuntu"
        elif command_exists yum; then
            echo "centos"
        elif command_exists pacman; then
            echo "arch"
        else
            echo "unknown"
        fi
    else
        echo "unsupported"
    fi
}

# Function to install PostgreSQL
install_postgresql() {
    local os=$1
    log_info "Installing PostgreSQL..."
    
    case $os in
        ubuntu)
            sudo apt-get update
            sudo apt-get install -y postgresql postgresql-contrib
            ;;
        centos)
            sudo yum install -y postgresql-server postgresql-contrib
            sudo postgresql-setup initdb
            ;;
        arch)
            sudo pacman -S --noconfirm postgresql
            sudo -u postgres initdb --locale en_US.UTF-8 -D /var/lib/postgres/data
            ;;
        *)
            log_error "Unsupported OS for automatic PostgreSQL installation"
            exit 1
            ;;
    esac
    
    # Start and enable PostgreSQL
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    log_success "PostgreSQL installed and started"
}

# Function to install Bun
install_bun() {
    log_info "Installing Bun..."
    if ! command_exists bun; then
        curl -fsSL https://bun.sh/install | bash
        source ~/.bashrc
        export PATH="$HOME/.bun/bin:$PATH"
        log_success "Bun installed"
    else
        log_info "Bun already installed"
    fi
}

# Function to install Node.js (if needed)
install_node() {
    log_info "Checking Node.js..."
    if ! command_exists node; then
        log_info "Installing Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
        log_success "Node.js installed"
    else
        log_info "Node.js already installed ($(node --version))"
    fi
}

# Function to setup PostgreSQL databases
setup_databases() {
    log_info "Setting up PostgreSQL databases..."
    
    # Create postgres user if not exists and set password
    sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';" 2>/dev/null || {
        log_warning "Could not set postgres user password, might already be set"
    }
    
    # Create core database
    sudo -u postgres createdb ankey_core 2>/dev/null || {
        log_warning "Database ankey_core might already exist"
    }
    
    # Create reserved tenant databases
    for tenant in shop hunt edu swap; do
        sudo -u postgres createdb "${tenant}" 2>/dev/null || {
            log_warning "Database ${tenant} might already exist"
        }
    done
    
    log_success "Databases created/verified"
}

# Function to setup environment file
setup_environment() {
    log_info "Setting up environment configuration..."
    
    if [[ ! -f .env ]]; then
        log_error ".env file not found. Creating from template..."
        cat > .env << EOF
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=ankey_core

# Email Configuration (configure with your SMTP settings)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Application Configuration
NODE_ENV=development
PORT=3001

# JWT Secret (generated)
JWT_SECRET=$(openssl rand -base64 32)
EOF
        log_success "Environment file created"
    else
        log_info "Environment file already exists"
    fi
}

# Function to install dependencies
install_dependencies() {
    log_info "Installing project dependencies..."
    
    if command_exists bun; then
        bun install
    else
        npm install
    fi
    
    log_success "Dependencies installed"
}

# Function to setup database schema
setup_database_schema() {
    log_info "Setting up database schema..."
    
    # Generate Drizzle migrations
    if command_exists bun; then
        bun run db:generate
        bun run db:push
    else
        npm run db:generate
        npm run db:push
    fi
    
    log_success "Database schema setup complete"
}

# Function to seed database with initial data
seed_database() {
    log_info "Seeding database with initial data..."
    
    if [[ -f "scripts/seed-database.ts" ]]; then
        if command_exists bun; then
            bun run seed
        else
            npx tsx scripts/seed-database.ts
        fi
        log_success "Database seeding complete"
    else
        log_warning "seed-database.ts script not found, skipping seeding"
    fi
}

# Function to test the installation
test_installation() {
    log_info "Testing installation..."
    
    # Test database connection
    if sudo -u postgres psql -d ankey_core -c "SELECT 1;" >/dev/null 2>&1; then
        log_success "Database connection: OK"
    else
        log_error "Database connection: FAILED"
        return 1
    fi
    
    # Test bun/npm
    if command_exists bun; then
        if bun --version >/dev/null 2>&1; then
            log_success "Bun: OK ($(bun --version))"
        else
            log_error "Bun: FAILED"
            return 1
        fi
    elif command_exists npm; then
        if npm --version >/dev/null 2>&1; then
            log_success "NPM: OK ($(npm --version))"
        else
            log_error "NPM: FAILED"
            return 1
        fi
    else
        log_error "Neither Bun nor NPM found"
        return 1
    fi
    
    log_success "All tests passed!"
}

# Function to start development servers
start_dev_servers() {
    log_info "Starting development servers..."
    
    # Kill any existing processes on ports 3000, 3001, 5173, 5174
    log_info "Cleaning up existing processes on development ports..."
    for port in 3000 3001 5173 5174; do
        if lsof -ti:$port >/dev/null 2>&1; then
            log_warning "Killing process on port $port"
            kill -9 $(lsof -ti:$port) 2>/dev/null || true
        fi
    done
    
    sleep 2
    
    log_info "Starting development servers with 'bun run dev'..."
    echo ""
    echo "================================================"
    echo "🚀 Ankey Multi-Tenant Application Setup Complete!"
    echo "================================================"
    echo ""
    echo "Next steps:"
    echo "1. Frontend will be available at: http://localhost:5173"
    echo "2. Backend API will be available at: http://localhost:3001"
    echo "3. Core admin login:"
    echo "   Email: itgroup.luck@gmail.com"
    echo "   Password: Mir@nd@32"
    echo ""
    echo "4. Test subdomains (add to /etc/hosts if needed):"
    echo "   127.0.0.1 shop.localhost"
    echo "   127.0.0.1 hunt.localhost" 
    echo "   127.0.0.1 edu.localhost"
    echo "   127.0.0.1 swap.localhost"
    echo ""
    echo "Press Ctrl+C to stop the development servers"
    echo "================================================"
    echo ""
    
    # Start development servers
    if command_exists bun; then
        bun run dev
    else
        npm run dev
    fi
}

# Main installation process
main() {
    echo "================================================"
    echo "🔧 Ankey Multi-Tenant Application Setup"
    echo "================================================"
    echo ""
    
    # Detect OS
    OS=$(detect_os)
    log_info "Detected OS: $OS"
    
    if [[ "$OS" == "unsupported" || "$OS" == "unknown" ]]; then
        log_error "Unsupported operating system"
        exit 1
    fi
    
    # Check if we're in the right directory
    if [[ ! -f "package.json" ]]; then
        log_error "package.json not found. Please run this script from the project root directory."
        exit 1
    fi
    
    # Install system dependencies
    log_info "Installing system dependencies..."
    
    # Install curl and other basic tools
    case $OS in
        ubuntu)
            sudo apt-get update
            sudo apt-get install -y curl wget gnupg2 software-properties-common lsof
            ;;
        centos)
            sudo yum install -y curl wget gnupg2 lsof
            ;;
        arch)
            sudo pacman -S --noconfirm curl wget gnupg lsof
            ;;
    esac
    
    # Install PostgreSQL
    if ! command_exists psql; then
        install_postgresql $OS
    else
        log_info "PostgreSQL already installed"
        sudo systemctl start postgresql 2>/dev/null || true
    fi
    
    # Install Bun (preferred) or Node.js
    if ! command_exists bun; then
        install_bun
        # Reload PATH for current session
        export PATH="$HOME/.bun/bin:$PATH"
    else
        log_info "Bun already installed ($(bun --version))"
    fi
    
    # Setup databases
    setup_databases
    
    # Setup environment
    setup_environment
    
    # Install project dependencies
    install_dependencies
    
    # Setup database schema
    setup_database_schema
    
    # Seed database with initial data
    seed_database
    
    # Test installation
    if test_installation; then
        log_success "Installation completed successfully!"
        echo ""
        read -p "Do you want to start the development servers now? (y/n): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            start_dev_servers
        else
            echo ""
            echo "To start the development servers later, run:"
            echo "  bun run dev"
            echo ""
        fi
    else
        log_error "Installation test failed. Please check the errors above."
        exit 1
    fi
}

# Run main function
main "$@"