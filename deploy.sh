#!/bin/bash

# 서울경제신문 콘텐츠 플랫폼 Google Cloud Run 배포 스크립트

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
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

# 필수 환경변수 확인
check_env() {
    log_info "환경변수 확인 중..."
    
    if [ -z "$BIGKINDS_API_KEY" ]; then
        log_error "BIGKINDS_API_KEY 환경변수가 설정되지 않았습니다."
        echo "다음 명령어로 설정하세요:"
        echo "export BIGKINDS_API_KEY=your_api_key_here"
        exit 1
    fi
    
    if [ -z "$PROJECT_ID" ]; then
        log_error "PROJECT_ID 환경변수가 설정되지 않았습니다."
        echo "다음 명령어로 설정하세요:"
        echo "export PROJECT_ID=your-gcp-project-id"
        exit 1
    fi
    
    log_success "환경변수 확인 완료"
}

# Google Cloud 프로젝트 설정
setup_gcloud() {
    log_info "Google Cloud 프로젝트 설정 중..."
    
    gcloud config set project $PROJECT_ID
    gcloud auth configure-docker
    
    log_success "Google Cloud 설정 완료"
}

# Docker 이미지 빌드
build_image() {
    log_info "Docker 이미지 빌드 중..."
    
    docker build -t gcr.io/$PROJECT_ID/seoul-economy-platform:latest .
    
    log_success "Docker 이미지 빌드 완료"
}

# Container Registry에 푸시
push_image() {
    log_info "Container Registry에 이미지 푸시 중..."
    
    docker push gcr.io/$PROJECT_ID/seoul-economy-platform:latest
    
    log_success "이미지 푸시 완료"
}

# Cloud Run에 배포
deploy_to_cloudrun() {
    log_info "Cloud Run에 배포 중..."
    
    gcloud run deploy seoul-economy-platform \
        --image gcr.io/$PROJECT_ID/seoul-economy-platform:latest \
        --region asia-northeast3 \
        --platform managed \
        --allow-unauthenticated \
        --port 8080 \
        --memory 1Gi \
        --cpu 1 \
        --max-instances 10 \
        --set-env-vars "FLASK_ENV=production,BIGKINDS_API_KEY=$BIGKINDS_API_KEY"
    
    log_success "Cloud Run 배포 완료"
}

# 배포 URL 가져오기
get_service_url() {
    log_info "서비스 URL 가져오는 중..."
    
    SERVICE_URL=$(gcloud run services describe seoul-economy-platform \
        --region asia-northeast3 \
        --format 'value(status.url)')
    
    log_success "배포가 완료되었습니다!"
    echo -e "${GREEN}서비스 URL: ${SERVICE_URL}${NC}"
}

# 메인 실행
main() {
    log_info "서울경제신문 콘텐츠 플랫폼 배포를 시작합니다..."
    
    check_env
    setup_gcloud
    build_image
    push_image
    deploy_to_cloudrun
    get_service_url
    
    log_success "모든 배포 과정이 완료되었습니다!"
}

# 스크립트 실행
main "$@" 