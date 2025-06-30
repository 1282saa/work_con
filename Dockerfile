# 멀티스테이지 빌드: 프론트엔드 빌드 단계
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# package.json과 package-lock.json 복사
COPY frontend/package*.json ./

# 의존성 설치 (빌드를 위해 모든 의존성 필요)
RUN npm ci

# 소스 코드 복사
COPY frontend/ ./

# React 앱 빌드
RUN npm run build

# 백엔드 + 서빙 단계
FROM python:3.9-slim

WORKDIR /app

# 시스템 의존성 설치
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Python 의존성 설치
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# 백엔드 소스 코드 복사
COPY backend/ ./

# 프론트엔드 빌드 결과물 복사
COPY --from=frontend-builder /app/frontend/build ./static

# 포트 설정
EXPOSE 8080

# 환경변수 설정
ENV FLASK_APP=app.py
ENV FLASK_ENV=production
ENV PORT=8080

# 프로덕션용 서버 실행
CMD ["sh", "-c", "exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 app:app"] 