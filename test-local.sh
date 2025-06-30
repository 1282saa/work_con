#!/bin/bash

# 로컬 Docker 테스트 스크립트

set -e

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# API 키 확인
if [ -z "$BIGKINDS_API_KEY" ]; then
    echo "BIGKINDS_API_KEY 환경변수를 설정하세요:"
    echo "export BIGKINDS_API_KEY=254bec69-1c13-470f-904a-c4bc9e46cc80"
    exit 1
fi

log_info "Docker 이미지 빌드 중..."
docker build -t seoul-economy-platform:local .

log_success "Docker 이미지 빌드 완료"

log_info "로컬 컨테이너 실행 중..."
docker run -p 8080:8080 \
    -e FLASK_ENV=production \
    -e BIGKINDS_API_KEY=$BIGKINDS_API_KEY \
    seoul-economy-platform:local

log_success "컨테이너가 실행되었습니다. http://localhost:8080 에서 확인하세요." 