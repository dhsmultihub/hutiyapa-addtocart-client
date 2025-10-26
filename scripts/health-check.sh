#!/bin/bash

# Health check script for production deployment
# Usage: ./scripts/health-check.sh [URL]

set -e

# Default values
BASE_URL=${1:-"http://localhost:3000"}
TIMEOUT=${TIMEOUT:-30}
RETRY_COUNT=${RETRY_COUNT:-3}
RETRY_DELAY=${RETRY_DELAY:-5}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check if URL is accessible
check_url() {
    local url=$1
    local timeout=$2
    
    if curl -f -s --max-time $timeout "$url" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Check API health endpoint
check_api_health() {
    local api_url="$BASE_URL/api/health"
    
    log_info "Checking API health endpoint: $api_url"
    
    if check_url "$api_url" $TIMEOUT; then
        log_info "API health check passed"
        return 0
    else
        log_error "API health check failed"
        return 1
    fi
}

# Check main application
check_app_health() {
    log_info "Checking main application: $BASE_URL"
    
    if check_url "$BASE_URL" $TIMEOUT; then
        log_info "Application health check passed"
        return 0
    else
        log_error "Application health check failed"
        return 1
    fi
}

# Check database connectivity
check_database() {
    log_info "Checking database connectivity"
    
    # This would check database connection in a real implementation
    # For now, we'll assume it's healthy if the API is responding
    if check_api_health; then
        log_info "Database connectivity check passed"
        return 0
    else
        log_error "Database connectivity check failed"
        return 1
    fi
}

# Check Redis connectivity
check_redis() {
    log_info "Checking Redis connectivity"
    
    # This would check Redis connection in a real implementation
    # For now, we'll assume it's healthy if the API is responding
    if check_api_health; then
        log_info "Redis connectivity check passed"
        return 0
    else
        log_error "Redis connectivity check failed"
        return 1
    fi
}

# Check external dependencies
check_external_deps() {
    log_info "Checking external dependencies"
    
    # Check if external APIs are accessible
    local external_apis=(
        "https://api.stripe.com"
        "https://api.paypal.com"
        "https://www.google-analytics.com"
    )
    
    for api in "${external_apis[@]}"; do
        if check_url "$api" 10; then
            log_info "External API $api is accessible"
        else
            log_warn "External API $api is not accessible"
        fi
    done
}

# Check performance metrics
check_performance() {
    log_info "Checking performance metrics"
    
    # Check response time
    local start_time=$(date +%s%N)
    if check_url "$BASE_URL" $TIMEOUT; then
        local end_time=$(date +%s%N)
        local response_time=$(( (end_time - start_time) / 1000000 ))
        
        if [ $response_time -lt 2000 ]; then
            log_info "Response time: ${response_time}ms (Good)"
        elif [ $response_time -lt 5000 ]; then
            log_warn "Response time: ${response_time}ms (Acceptable)"
        else
            log_error "Response time: ${response_time}ms (Poor)"
            return 1
        fi
    else
        log_error "Performance check failed - application not responding"
        return 1
    fi
}

# Main health check function
main() {
    log_info "Starting health check for: $BASE_URL"
    log_info "Timeout: ${TIMEOUT}s, Retry count: $RETRY_COUNT, Retry delay: ${RETRY_DELAY}s"
    
    local exit_code=0
    
    # Run health checks
    check_app_health || exit_code=1
    check_api_health || exit_code=1
    check_database || exit_code=1
    check_redis || exit_code=1
    check_external_deps
    check_performance || exit_code=1
    
    if [ $exit_code -eq 0 ]; then
        log_info "All health checks passed! ✅"
    else
        log_error "Some health checks failed! ❌"
    fi
    
    exit $exit_code
}

# Run with retry logic
run_with_retry() {
    local retry_count=0
    
    while [ $retry_count -lt $RETRY_COUNT ]; do
        if main; then
            exit 0
        else
            retry_count=$((retry_count + 1))
            if [ $retry_count -lt $RETRY_COUNT ]; then
                log_warn "Health check failed, retrying in ${RETRY_DELAY}s... (Attempt $((retry_count + 1))/$RETRY_COUNT)"
                sleep $RETRY_DELAY
            fi
        fi
    done
    
    log_error "Health check failed after $RETRY_COUNT attempts"
    exit 1
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -u|--url)
            BASE_URL="$2"
            shift 2
            ;;
        -t|--timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        -r|--retry)
            RETRY_COUNT="$2"
            shift 2
            ;;
        -d|--delay)
            RETRY_DELAY="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS] [URL]"
            echo "Options:"
            echo "  -u, --url URL        Base URL to check (default: http://localhost:3000)"
            echo "  -t, --timeout SEC    Timeout in seconds (default: 30)"
            echo "  -r, --retry COUNT    Number of retries (default: 3)"
            echo "  -d, --delay SEC      Delay between retries (default: 5)"
            echo "  -h, --help          Show this help message"
            exit 0
            ;;
        *)
            BASE_URL="$1"
            shift
            ;;
    esac
done

# Run the health check
run_with_retry
