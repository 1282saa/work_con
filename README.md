# 서울경제신문 콘텐츠 플랫폼

빅카인즈 API를 활용하여 서울경제신문의 뉴스 데이터를 조회하고, 작업 상태를 관리하는 웹 애플리케이션입니다.

## 프로젝트 구조

```
/
├── Dockerfile              # Docker 컨테이너 설정
├── cloudbuild.yaml         # Google Cloud Build 설정
├── deploy.sh               # 배포 스크립트
├── .dockerignore           # Docker 빌드 제외 파일
├── .gitignore              # Git 추적 제외 파일
├── backend/                # 백엔드 (Python/Flask)
│   ├── app.py              # Flask 애플리케이션
│   ├── utils/              # 유틸리티 모듈
│   │   └── api_client.py   # 빅카인즈 API 클라이언트
│   ├── .env.example        # 환경변수 예제 파일
│   └── requirements.txt    # 필요한 Python 패키지 목록
│
└── frontend/               # 프론트엔드 (React)
    ├── public/             # 정적 파일
    └── src/                # 소스 코드
        ├── components/     # React 컴포넌트
        │   ├── NewsTable.js    # 뉴스 테이블 컴포넌트
        │   ├── StatusBadge.js  # 상태 배지 컴포넌트
        │   └── StatsBar.js     # 통계 표시 컴포넌트
        ├── App.js          # 메인 애플리케이션 컴포넌트
        └── styles/         # CSS 스타일 파일
```

## 기능

- 빅카인즈 API를 통한 서울경제신문 기사 데이터 조회
- 기사 제목, 날짜, 내용, 원문 링크 표시
- 각 기사의 작업 상태(미진행, 작업중, 작업완료) 관리
- 상태별 색상 표시 및 클릭으로 상태 변경
- 작업 진행 상황에 대한 통계 정보 표시
- 기사 검색 및 날짜 필터링 기능
- 단일 날짜 선택으로 해당 날짜 기사 자동 조회

## 로컬 개발 환경 설정

### 필수 요구사항

- Python 3.8 이상
- Node.js 16.0 이상
- NPM 7.0 이상

### 백엔드 설정

1. 백엔드 디렉토리로 이동합니다.

   ```bash
   cd backend
   ```

2. 필요한 Python 패키지를 설치합니다.

   ```bash
   pip install -r requirements.txt
   ```

3. `.env` 파일을 생성하고 빅카인즈 API 키를 설정합니다.
   ```bash
   cp .env.example .env
   ```
   `.env` 파일을 열어 `BIGKINDS_API_KEY` 값을 실제 API 키로 변경합니다.

### 프론트엔드 설정

1. 프론트엔드 디렉토리로 이동합니다.

   ```bash
   cd frontend
   ```

2. 필요한 NPM 패키지를 설치합니다.
   ```bash
   npm install
   ```

## 로컬 실행

### 백엔드 서버 실행

```bash
cd backend
python app.py
```

Flask 서버가 `http://localhost:5000`에서 실행됩니다.

### 프론트엔드 개발 서버 실행

```bash
cd frontend
npm start
```

React 개발 서버가 `http://localhost:3000`에서 실행됩니다.

## Google Cloud Run 배포

### 사전 준비

1. **Google Cloud 프로젝트 설정**

   ```bash
   # Google Cloud CLI 설치 및 로그인
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

2. **필요한 API 활성화**

   ```bash
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   gcloud services enable containerregistry.googleapis.com
   ```

3. **환경변수 설정**
   ```bash
   export PROJECT_ID=your-gcp-project-id
   export BIGKINDS_API_KEY=254bec69-1c13-470f-904a-c4bc9e46cc80
   ```

### 자동 배포 스크립트 사용

```bash
# 배포 스크립트 실행 권한 부여
chmod +x deploy.sh

# 배포 실행
./deploy.sh
```

### 수동 배포

1. **Docker 이미지 빌드**

   ```bash
   docker build -t gcr.io/$PROJECT_ID/seoul-economy-platform:latest .
   ```

2. **Container Registry에 푸시**

   ```bash
   docker push gcr.io/$PROJECT_ID/seoul-economy-platform:latest
   ```

3. **Cloud Run에 배포**
   ```bash
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
   ```

### GitHub에서 Cloud Build 자동 배포

1. **GitHub 저장소 연결**

   ```bash
   gcloud builds triggers create github \
       --repo-name=seoul-economy-platform \
       --repo-owner=your-github-username \
       --branch-pattern="^main$" \
       --build-config=cloudbuild.yaml
   ```

2. **환경변수 설정 (Cloud Build)**
   - Google Cloud Console에서 Cloud Build > 트리거 > 설정에서 환경변수 추가:
     - `BIGKINDS_API_KEY`: 빅카인즈 API 키

## 사용 방법

1. 애플리케이션이 실행되면 서울경제신문 기사 목록이 표시됩니다.
2. 날짜 선택기로 특정 날짜의 기사를 조회할 수 있습니다.
3. 검색어 입력으로 특정 기사를 필터링할 수 있습니다.
4. 각 기사의 상태 배지를 클릭하여 작업 상태를 변경할 수 있습니다.
5. 상단의 통계 정보에서 작업 진행 상황을 확인할 수 있습니다.
6. 기사 행의 확장 버튼을 클릭하면 기사의 전체 내용을 볼 수 있습니다.

## 문제 해결

### 일반적인 문제

1. **API 키 오류**

   - `.env` 파일에 올바른 `BIGKINDS_API_KEY`가 설정되어 있는지 확인하세요.

2. **CORS 오류**

   - 백엔드 서버가 정상적으로 실행되고 있는지 확인하세요.
   - 프론트엔드의 `package.json`에 `proxy` 설정이 올바른지 확인하세요.

3. **배포 오류**
   - Google Cloud 프로젝트 권한을 확인하세요.
   - 필요한 API가 활성화되어 있는지 확인하세요.

### 로그 확인

- **로컬 개발**: 브라우저 개발자 도구 Console 탭 확인
- **Cloud Run**: Google Cloud Console > Cloud Run > 로그 탭 확인

## 기술 스택

- **백엔드**: Python, Flask, Gunicorn
- **프론트엔드**: React, Material-UI
- **배포**: Docker, Google Cloud Run
- **API**: BigKinds 뉴스 검색 API
