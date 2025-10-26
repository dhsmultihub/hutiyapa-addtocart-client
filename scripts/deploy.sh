#!/bin/bash

# Production deployment script
# Usage: ./scripts/deploy.sh [environment] [version]

set -e

# Default values
ENVIRONMENT=${1:-"staging"}
VERSION=${2:-"latest"}
DOCKER_REGISTRY=${DOCKER_REGISTRY:-"hutiyapa"}
IMAGE_NAME=${IMAGE_NAME:-"hutiyapa-ecommerce"}
FULL_IMAGE_NAME="$DOCKER_REGISTRY/$IMAGE_NAME:$VERSION"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_step "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker info &> /dev/null; then
        log_error "Docker is not running"
        exit 1
    fi
    
    # Check if required environment variables are set
    if [ -z "$DOCKER_REGISTRY" ]; then
        log_error "DOCKER_REGISTRY environment variable is not set"
        exit 1
    fi
    
    log_info "Prerequisites check passed"
}

# Build Docker image
build_image() {
    log_step "Building Docker image: $FULL_IMAGE_NAME"
    
    # Build the image
    docker build -t "$FULL_IMAGE_NAME" .
    
    if [ $? -eq 0 ]; then
        log_info "Docker image built successfully"
    else
        log_error "Docker image build failed"
        exit 1
    fi
}

# Run tests
run_tests() {
    log_step "Running tests..."
    
    # Run unit tests
    log_info "Running unit tests..."
    docker run --rm -v "$(pwd)":/app -w /app "$FULL_IMAGE_NAME" npm run test:ci
    
    if [ $? -eq 0 ]; then
        log_info "Unit tests passed"
    else
        log_error "Unit tests failed"
        exit 1
    fi
    
    # Run integration tests
    log_info "Running integration tests..."
    docker run --rm -v "$(pwd)":/app -w /app "$FULL_IMAGE_NAME" npm run test:integration
    
    if [ $? -eq 0 ]; then
        log_info "Integration tests passed"
    else
        log_error "Integration tests failed"
        exit 1
    fi
}

# Push image to registry
push_image() {
    log_step "Pushing image to registry..."
    
    # Login to Docker registry (if required)
    if [ "$DOCKER_REGISTRY" != "localhost" ]; then
        log_info "Logging in to Docker registry..."
        docker login "$DOCKER_REGISTRY"
    fi
    
    # Push the image
    docker push "$FULL_IMAGE_NAME"
    
    if [ $? -eq 0 ]; then
        log_info "Image pushed successfully"
    else
        log_error "Image push failed"
        exit 1
    fi
}

# Deploy to environment
deploy_to_environment() {
    log_step "Deploying to $ENVIRONMENT environment..."
    
    case $ENVIRONMENT in
        "staging")
            deploy_staging
            ;;
        "production")
            deploy_production
            ;;
        *)
            log_error "Unknown environment: $ENVIRONMENT"
            exit 1
            ;;
    esac
}

# Deploy to staging
deploy_staging() {
    log_info "Deploying to staging environment..."
    
    # Update docker-compose for staging
    export IMAGE_TAG="$VERSION"
    export ENVIRONMENT="staging"
    
    # Deploy using docker-compose
    docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d
    
    if [ $? -eq 0 ]; then
        log_info "Staging deployment successful"
    else
        log_error "Staging deployment failed"
        exit 1
    fi
}

# Deploy to production
deploy_production() {
    log_info "Deploying to production environment..."
    
    # Update docker-compose for production
    export IMAGE_TAG="$VERSION"
    export ENVIRONMENT="production"
    
    # Deploy using docker-compose
    docker-compose -f docker-compose.yml -f docker-compose.production.yml up -d
    
    if [ $? -eq 0 ]; then
        log_info "Production deployment successful"
    else
        log_error "Production deployment failed"
        exit 1
    fi
}

# Run health checks
run_health_checks() {
    log_step "Running health checks..."
    
    # Wait for services to start
    log_info "Waiting for services to start..."
    sleep 30
    
    # Run health check script
    ./scripts/health-check.sh
    
    if [ $? -eq 0 ]; then
        log_info "Health checks passed"
    else
        log_error "Health checks failed"
        exit 1
    fi
}

# Cleanup old images
cleanup_old_images() {
    log_step "Cleaning up old images..."
    
    # Remove old images (keep last 3 versions)
    docker images "$DOCKER_REGISTRY/$IMAGE_NAME" --format "table {{.Tag}}" | tail -n +2 | head -n -3 | xargs -r docker rmi "$DOCKER_REGISTRY/$IMAGE_NAME"
    
    log_info "Cleanup completed"
}

# Rollback deployment
rollback() {
    log_step "Rolling back deployment..."
    
    # Get previous version
    local previous_version=$(docker images "$DOCKER_REGISTRY/$IMAGE_NAME" --format "table {{.Tag}}" | tail -n +2 | head -n 1)
    
    if [ -z "$previous_version" ]; then
        log_error "No previous version found for rollback"
        exit 1
    fi
    
    log_info "Rolling back to version: $previous_version"
    
    # Deploy previous version
    export IMAGE_TAG="$previous_version"
    docker-compose up -d
    
    if [ $? -eq 0 ]; then
        log_info "Rollback successful"
    else
        log_error "Rollback failed"
        exit 1
    fi
}

# Main deployment function
main() {
    log_info "Starting deployment process..."
    log_info "Environment: $ENVIRONMENT"
    log_info "Version: $VERSION"
    log_info "Image: $FULL_IMAGE_NAME"
    
    # Check prerequisites
    check_prerequisites
    
    # Build image
    build_image
    
    # Run tests
    run_tests
    
    # Push image
    push_image
    
    # Deploy to environment
    deploy_to_environment
    
    # Run health checks
    run_health_checks
    
    # Cleanup old images
    cleanup_old_images
    
    log_info "Deployment completed successfully! 🚀"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -v|--version)
            VERSION="$2"
            shift 2
            ;;
        -r|--registry)
            DOCKER_REGISTRY="$2"
            shift 2
            ;;
        --rollback)
            rollback
            exit 0
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS] [ENVIRONMENT] [VERSION]"
            echo "Options:"
            echo "  -e, --environment ENV  Target environment (staging|production)"
            echo "  -v, --version VER      Version to deploy (default: latest)"
            echo "  -r, --registry REG     Docker registry (default: hutiyapa)"
            echo "  --rollback             Rollback to previous version"
            echo "  -h, --help            Show this help message"
            exit 0
            ;;
        *)
            if [ -z "$ENVIRONMENT" ] || [ "$ENVIRONMENT" = "staging" ]; then
                ENVIRONMENT="$1"
            elif [ -z "$VERSION" ] || [ "$VERSION" = "latest" ]; then
                VERSION="$1"
            fi
            shift
            ;;
    esac
done

# Run the deployment
main
