"""
콘텐츠 플랫폼 백엔드 애플리케이션
빅카인즈 API를 활용하여 뉴스 데이터를 가져오고, 
작업 상태를 관리하는 API를 제공합니다.
"""

from flask import Flask, jsonify, request, send_from_directory, send_file, Response
from flask_cors import CORS
import json
import os
import logging
from datetime import datetime, timedelta
from dotenv import load_dotenv
from utils.api_client import BigkindsClient
from utils.gpt_client import GPTClient
import mimetypes
import subprocess
from static_serve import StaticFileHandler
import time
import threading

# .env 파일 로드 (가장 먼저)
load_dotenv()

# 환경변수 로딩 확인
print(f"현재 작업 디렉토리: {os.getcwd()}")
print(f".env 파일 존재 여부: {os.path.exists('.env')}")
openai_key = os.getenv('OPENAI_API_KEY')
print(f"OpenAI API 키 로드됨: {'예' if openai_key else '아니오'}")
if openai_key:
    print(f"API 키 앞 20자: {openai_key[:20]}...")

# Flask 애플리케이션 초기화
app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app)  # CORS 설정 - 모든 도메인에서의 요청 허용

# 로깅 설정
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# MIME 타입 초기화
mimetypes.init()
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('text/css', '.css')

# 빅카인즈 API 클라이언트 초기화
api_client = BigkindsClient()

# GPT API 클라이언트 초기화
try:
    logger.info("GPT 클라이언트 초기화 시작...")
    
    gpt_client = GPTClient()
    logger.info("GPT 클라이언트 초기화 완료")
except Exception as e:
    logger.error(f"GPT 클라이언트 초기화 실패: {e}")
    logger.error(f"오류 타입: {type(e).__name__}")
    import traceback
    logger.error(f"전체 스택 트레이스: {traceback.format_exc()}")
    gpt_client = None

# 정적 파일 핸들러 초기화
static_handler = StaticFileHandler(os.getcwd())

# 뉴스 상태 데이터 저장소 (실제 환경에서는 데이터베이스 사용 권장)
# { news_id: { "status": "미진행" | "작업중" | "작업완료", "ai_content": "생성된 콘텐츠" } }
news_status = {}

# 상태 파일 경로
STATUS_FILE = "news_status.json"

# 상태 파일 로드
def load_status():
    global news_status
    try:
        if os.path.exists(STATUS_FILE):
            with open(STATUS_FILE, 'r', encoding='utf-8') as f:
                news_status = json.load(f)
            print(f"상태 데이터 로드 완료: {len(news_status)} 개의 뉴스")
    except Exception as e:
        print(f"상태 데이터 로드 중 오류 발생: {e}")

# 상태 파일 저장
def save_status():
    try:
        with open(STATUS_FILE, 'w', encoding='utf-8') as f:
            json.dump(news_status, f, ensure_ascii=False, indent=2)
        print("상태 데이터 저장 완료")
    except Exception as e:
        print(f"상태 데이터 저장 중 오류 발생: {e}")

# 애플리케이션 시작 시 상태 데이터 로드
load_status()

# 디버깅: 현재 디렉토리 구조 출력
def debug_directory_structure():
    """애플리케이션 시작 시 디렉토리 구조 디버깅"""
    logger.info("=" * 80)
    logger.info("현재 작업 디렉토리: %s", os.getcwd())
    logger.info("=" * 80)
    
    # static 폴더 경로
    static_folder = os.path.join(os.getcwd(), 'static')
    logger.info("정적 파일 폴더 경로: %s", static_folder)
    logger.info("정적 파일 폴더 존재 여부: %s", os.path.exists(static_folder))
    
    # 디렉토리 구조 출력
    if os.path.exists(static_folder):
        logger.info("\n--- 정적 파일 디렉토리 구조 ---")
        for root, dirs, files in os.walk(static_folder):
            level = root.replace(static_folder, '').count(os.sep)
            indent = ' ' * 2 * level
            logger.info('%s%s/', indent, os.path.basename(root))
            subindent = ' ' * 2 * (level + 1)
            for file in files:
                logger.info('%s%s', subindent, file)
    else:
        logger.warning("⚠️  정적 파일 폴더가 존재하지 않습니다!")
        # Docker 환경에서 파일 시스템 확인
        logger.info("\n--- 현재 디렉토리 내용 ---")
        try:
            result = subprocess.run(['ls', '-la'], capture_output=True, text=True)
            logger.info(result.stdout)
        except Exception as e:
            logger.error("디렉토리 리스트 확인 실패: %s", e)
    
    logger.info("=" * 80)

# 애플리케이션 시작 시 디버깅 함수 실행
if os.getenv('FLASK_ENV') != 'production' or os.getenv('DEBUG_MODE') == 'true':
    with app.app_context():
        debug_directory_structure()

@app.route('/api/news', methods=['GET'])
def get_news():
    """뉴스 데이터를 가져오는 API 엔드포인트"""
    try:
        # URL 쿼리 파라미터에서 검색 조건 추출
        query = request.args.get('query', '')
        selected_date = request.args.get('date', '')
        limit = request.args.get('limit', 1000, type=int)  # 기본값을 1000으로 증가
        
        # 최대 10000개로 제한 (API 한계)
        if limit > 10000:
            limit = 10000
        
        # 단일 날짜에서 시작일/종료일 자동 생성
        if not selected_date:
            selected_date = datetime.now().strftime('%Y-%m-%d')
        
        from_date = selected_date
        start_date = datetime.strptime(selected_date, '%Y-%m-%d')
        until_date = (start_date + timedelta(days=1)).strftime('%Y-%m-%d')
        
        # API로 뉴스 데이터 가져오기
        result = api_client.get_news(
            query=query, 
            from_date=from_date, 
            until_date=until_date,
            provider=[],
            return_size=limit  # 실제 limit 값 사용
        )
        
        # ----- 변경 시작: 응답 구조에 맞게 documents 추출 -----
        if isinstance(result, dict):
            if isinstance(result.get('result'), list):
                # 기존 구조 호환
                news_list = result.get('result', [])
            elif 'return_object' in result and 'documents' in result['return_object']:
                news_list = result['return_object']['documents']
            else:
                news_list = []
        else:
            news_list = []
        # ----- 변경 끝 -----
        
        # 뉴스 상태 정보 추가
        for news in news_list:
            news_id = news.get('news_id')
            if news_id in news_status:
                news['status'] = news_status[news_id]['status']
                news['ai_content'] = news_status[news_id].get('ai_content', '')
            else:
                # 상태 정보가 없으면 '미진행' 상태로 초기화
                news['status'] = '미진행'
                news['ai_content'] = ''
                news_status[news_id] = {'status': '미진행', 'ai_content': ''}
            
            # 카테고리 정보 처리 (배열인 경우 첫 번째 값 사용)
            if 'category' in news and isinstance(news['category'], list):
                news['category'] = news['category'][0] if news['category'] else None
            
            # 디버깅: 첫 번째 기사의 필드 정보 출력
            if news_list.index(news) == 0:
                logger.debug("첫 번째 기사 필드 정보: %s", list(news.keys()))
        
        # 상태 정보 저장
        save_status()
        
        return jsonify({
            'success': True,
            'data': news_list,
            'total': len(news_list),
            'requested_limit': limit,
            'actual_count': len(news_list)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/news/status', methods=['POST'])
def update_news_status():
    """뉴스 상태를 업데이트하는 API 엔드포인트"""
    try:
        data = request.get_json()
        news_id = data.get('news_id')
        status = data.get('status')
        
        if not news_id or not status:
            return jsonify({
                'success': False,
                'message': '뉴스 ID와 상태 정보가 필요합니다.'
            }), 400
            
        if status not in ['미진행', '작업중', '작업완료']:
            return jsonify({
                'success': False,
                'message': '상태는 미진행, 작업중, 작업완료 중 하나여야 합니다.'
            }), 400
            
        # 상태 업데이트
        if news_id not in news_status:
            news_status[news_id] = {'status': '미진행', 'ai_content': ''}
        
        news_status[news_id]['status'] = status
        news_status[news_id]['updated_at'] = datetime.now().isoformat()
        
        # 상태 저장
        save_status()
        
        # 실시간 업데이트 이벤트 발생
        add_update_event('status_change', {
            'news_id': news_id,
            'status': status,
            'updated_at': datetime.now().isoformat()
        })
        
        return jsonify({
            'success': True,
            'data': {
                'news_id': news_id,
                'status': status
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/news/hours', methods=['GET'])
def get_news_by_hours():
    """시간대별로 그룹화된 뉴스 데이터를 가져오는 API 엔드포인트"""
    try:
        # URL 쿼리 파라미터에서 검색 조건 추출
        query = request.args.get('query', '')
        selected_date = request.args.get('date', '')
        limit = request.args.get('limit', 100, type=int)
        
        # 단일 날짜에서 시작일/종료일 자동 생성
        if not selected_date:
            selected_date = datetime.now().strftime('%Y-%m-%d')
        
        from_date = selected_date
        start_date = datetime.strptime(selected_date, '%Y-%m-%d')
        until_date = (start_date + timedelta(days=1)).strftime('%Y-%m-%d')
        
        # API로 뉴스 데이터 가져오기
        result = api_client.get_news(
            query=query, 
            from_date=from_date, 
            until_date=until_date,
            provider=[],
            return_size=limit
        )
        
        # 응답 구조에 맞게 documents 추출
        if isinstance(result, dict):
            if isinstance(result.get('result'), list):
                news_list = result.get('result', [])
            elif 'return_object' in result and 'documents' in result['return_object']:
                news_list = result['return_object']['documents']
            else:
                news_list = []
        else:
            news_list = []
        
        # 시간대별로 그룹화
        hourly_articles = {}
        for news in news_list:
            # 뉴스 상태 정보 추가
            news_id = news.get('news_id')
            if news_id in news_status:
                news['status'] = news_status[news_id]['status']
                news['ai_content'] = news_status[news_id].get('ai_content', '')
            else:
                news['status'] = '미진행'
                news['ai_content'] = ''
                news_status[news_id] = {'status': '미진행', 'ai_content': ''}
            
            # 카테고리 정보 처리 (배열인 경우 첫 번째 값 사용)
            if 'category' in news and isinstance(news['category'], list):
                news['category'] = news['category'][0] if news['category'] else None
            
            # 시간 정보 추출
            date_str = news.get('dateline') or news.get('published_at', '')
            if date_str:
                try:
                    # 날짜 파싱
                    news_date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                    hour_key = f"{news_date.hour}시"
                    
                    if hour_key not in hourly_articles:
                        hourly_articles[hour_key] = []
                    
                    hourly_articles[hour_key].append(news)
                except Exception as e:
                    print(f"날짜 파싱 오류: {date_str}, {e}")
                    # 파싱 실패 시 기타 그룹에 추가
                    if '기타' not in hourly_articles:
                        hourly_articles['기타'] = []
                    hourly_articles['기타'].append(news)
        
        # 상태 정보 저장
        save_status()
        
        # 시간대별 정렬
        sorted_hours = sorted(hourly_articles.keys(), key=lambda x: 
                            int(x.replace('시', '')) if x != '기타' else 999)
        
        return jsonify({
            'success': True,
            'data': {
                'search_date': from_date,
                'total': len(news_list),
                'hourly_articles': hourly_articles,
                'hours_with_articles': sorted_hours
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/news/status/summary', methods=['GET'])
def get_status_summary():
    """뉴스 상태 요약 정보를 제공하는 API 엔드포인트"""
    try:
        # 상태별 카운트
        summary = {
            '미진행': 0,
            '작업중': 0,
            '작업완료': 0,
            '전체': len(news_status)
        }
        
        # 각 상태별 카운트 계산
        for news_id, info in news_status.items():
            status = info.get('status', '미진행')
            if status in summary:
                summary[status] += 1
                
        return jsonify({
            'success': True,
            'data': summary
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/generate/instagram', methods=['POST'])
def generate_instagram_content():
    """뉴스 기사를 바탕으로 인스타그램 콘텐츠를 생성하는 API 엔드포인트"""
    try:
        if not gpt_client:
            return jsonify({
                'success': False,
                'message': 'GPT 클라이언트가 초기화되지 않았습니다. API 키를 확인해주세요.'
            }), 500
        
        data = request.get_json()
        title = data.get('title', '')
        content = data.get('content', '')
        category = data.get('category', '')
        news_id = data.get('news_id', '')
        
        if not title:
            return jsonify({
                'success': False,
                'message': '제목이 필요합니다.'
            }), 400
        
        # 이미 생성된 콘텐츠가 있는지 확인
        if news_id and news_id in news_status and news_status[news_id].get('ai_content'):
            return jsonify({
                'success': True,
                'data': {
                    'content': news_status[news_id]['ai_content'],
                    'cached': True
                }
            })
        
        # GPT로 인스타그램 콘텐츠 생성
        result = gpt_client.generate_instagram_content(
            title=title,
            content=content,
            category=category
        )
        
        if result['success']:
            # 생성된 콘텐츠를 저장 (상태는 변경하지 않음)
            if news_id:
                if news_id not in news_status:
                    news_status[news_id] = {'status': '미진행', 'ai_content': ''}
                news_status[news_id]['ai_content'] = result['content']
                news_status[news_id]['ai_generated_at'] = datetime.now().isoformat()
                save_status()
                
                # 실시간 업데이트 이벤트 발생
                add_update_event('ai_content_generated', {
                    'news_id': news_id,
                    'has_content': True,
                    'generated_at': datetime.now().isoformat()
                })
            
            return jsonify({
                'success': True,
                'data': {
                    'content': result['content'],
                    'raw_response': result.get('raw_response', ''),
                    'cached': False
                }
            })
        else:
            return jsonify({
                'success': False,
                'message': f"콘텐츠 생성 실패: {result.get('error', '알 수 없는 오류')}"
            }), 500
        
    except Exception as e:
        logger.error(f"인스타그램 콘텐츠 생성 중 오류: {e}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/generate/hashtags', methods=['POST'])
def generate_hashtags():
    """제목만으로 빠르게 해시태그를 생성하는 API 엔드포인트"""
    try:
        if not gpt_client:
            return jsonify({
                'success': False,
                'message': 'GPT 클라이언트가 초기화되지 않았습니다.'
            }), 500
        
        data = request.get_json()
        title = data.get('title', '')
        category = data.get('category', '')
        
        if not title:
            return jsonify({
                'success': False,
                'message': '제목이 필요합니다.'
            }), 400
        
        # GPT로 해시태그 생성
        result = gpt_client.generate_quick_hashtags(
            title=title,
            category=category
        )
        
        if result['success']:
            return jsonify({
                'success': True,
                'data': {
                    'hashtags': result['hashtags']
                }
            })
        else:
            return jsonify({
                'success': False,
                'message': f"해시태그 생성 실패: {result.get('error', '알 수 없는 오류')}"
            }), 500
        
    except Exception as e:
        logger.error(f"해시태그 생성 중 오류: {e}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

# 빌드된 정적 자산 (assets) 서빙
@app.route('/static/<path:filepath>')
def serve_static_assets(filepath):
    """React 정적 파일 서빙 (CSS, JS, 이미지 등)"""
    logger.debug("\n=== 정적 파일 요청 ===")
    logger.debug("요청된 파일 경로: /static/%s", filepath)
    
    try:
        response = static_handler.serve_file(os.path.join('static', filepath))
        
        # MIME 타입 확인 및 설정
        mime_type = None
        if filepath.endswith('.js'):
            mime_type = 'application/javascript'
        elif filepath.endswith('.css'):
            mime_type = 'text/css'
        elif filepath.endswith('.map'):
            mime_type = 'application/json'
        
        if mime_type:
            response.headers['Content-Type'] = mime_type
            
        # 캐싱 헤더 추가
        if filepath.endswith(('.js', '.css')):
            response.headers['Cache-Control'] = 'public, max-age=31536000'  # 1년
        else:
            response.headers['Cache-Control'] = 'public, max-age=3600'  # 1시간
            
        return response
    except Exception as e:
        logger.error("파일 서빙 중 오류: %s", e)
        return jsonify({'error': 'File not found', 'path': filepath}), 404

@app.route('/manifest.json')
def serve_manifest():
    """React manifest.json 서빙"""
    logger.debug("\n=== manifest.json 요청 ===")
    
    try:
        return static_handler.serve_file('manifest.json')
    except:
        logger.warning("❌ manifest.json을 찾을 수 없음")
        return jsonify({'error': 'manifest.json not found'}), 404


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react_app(path):
    """React 앱 서빙 (SPA 라우팅 지원)"""
    logger.debug("\n=== React 앱 요청 ===")
    logger.debug("요청된 경로: %s", path or '/')
    
    # API 경로는 제외 (이미 위에서 정의됨)
    if path.startswith('api/'):
        logger.debug("API 경로이므로 건너뜀")
        return jsonify({'error': 'API endpoint not found'}), 404
    
    # 파비콘, 로고 등의 파일들 처리
    static_files = ['favicon.ico', 'logo192.png', 'logo512.png', 'robots.txt']
    if path in static_files:
        for base_path in [os.path.join(os.getcwd(), 'static'), 
                         os.path.join(os.path.dirname(os.getcwd()), 'frontend', 'build')]:
            file_path = os.path.join(base_path, path)
            if os.path.exists(file_path):
                return send_from_directory(base_path, path)
        return '', 404
    
    # index.html 서빙 시도
    index_base_path = static_handler.get_index_html_path()
    
    if index_base_path:
        try:
            response = send_from_directory(index_base_path, 'index.html')
            # 캐싱 방지 (SPA는 항상 최신 버전 제공)
            response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            response.headers['Pragma'] = 'no-cache'
            response.headers['Expires'] = '0'
            return response
        except Exception as e:
            logger.error("index.html 서빙 중 오류: %s", e)
    
    logger.error("❌ index.html을 찾을 수 없음")
    
    # 디버깅 정보 제공
    debug_info = {
        'error': 'React app not found',
        'current_directory': os.getcwd(),
        'static_paths': static_handler.static_paths,
        'available_files': static_handler.list_available_files() if logger.isEnabledFor(logging.DEBUG) else 'Enable DEBUG mode to see files'
    }
    
    return jsonify(debug_info), 404

# 추가 헬스 체크 라우트
@app.route('/health')
def health_check():
    """헬스 체크 엔드포인트"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    })

# 추가 디버깅 라우트
@app.route('/api/debug/structure')
def debug_structure():
    """현재 파일 시스템 구조를 반환하는 디버깅 엔드포인트"""
    debug_info = {
        'current_directory': os.getcwd(),
        'parent_directory': os.path.dirname(os.getcwd()),
        'environment': {
            'FLASK_ENV': os.getenv('FLASK_ENV', 'development'),
            'NODE_ENV': os.getenv('NODE_ENV', 'not set')
        },
        'directory_structure': {}
    }
    
    # 현재 디렉토리 구조
    try:
        debug_info['directory_structure']['current'] = {
            'path': os.getcwd(),
            'contents': os.listdir(os.getcwd())
        }
    except Exception as e:
        debug_info['directory_structure']['current'] = {'error': str(e)}
    
    # static 폴더 구조
    static_path = os.path.join(os.getcwd(), 'static')
    if os.path.exists(static_path):
        try:
            static_structure = {}
            for root, dirs, files in os.walk(static_path):
                rel_path = os.path.relpath(root, static_path)
                static_structure[rel_path] = {
                    'dirs': dirs,
                    'files': files
                }
            debug_info['directory_structure']['static'] = static_structure
        except Exception as e:
            debug_info['directory_structure']['static'] = {'error': str(e)}
    else:
        debug_info['directory_structure']['static'] = 'Not found'
    
    # frontend/build 구조 확인
    frontend_build = os.path.join(os.path.dirname(os.getcwd()), 'frontend', 'build')
    if os.path.exists(frontend_build):
        try:
            debug_info['directory_structure']['frontend_build'] = {
                'path': frontend_build,
                'contents': os.listdir(frontend_build)
            }
        except Exception as e:
            debug_info['directory_structure']['frontend_build'] = {'error': str(e)}
    else:
        debug_info['directory_structure']['frontend_build'] = 'Not found'
    
    # 사용 가능한 정적 파일 목록
    debug_info['available_static_files'] = static_handler.list_available_files()
    
    return jsonify(debug_info)

# 실시간 업데이트를 위한 이벤트 저장소
update_events = []
update_lock = threading.Lock()

def add_update_event(event_type, data):
    """실시간 업데이트 이벤트 추가"""
    with update_lock:
        timestamp = datetime.now().isoformat()
        event = {
            'type': event_type,
            'data': data,
            'timestamp': timestamp
        }
        update_events.append(event)
        # 최근 100개 이벤트만 유지
        if len(update_events) > 100:
            update_events.pop(0)
        print(f"📡 실시간 이벤트 추가: {event_type}")

@app.route('/api/events')
def stream_updates():
    """Server-Sent Events 스트림"""
    def event_stream():
        last_sent = 0
        while True:
            with update_lock:
                # 새로운 이벤트만 전송
                new_events = update_events[last_sent:]
                for event in new_events:
                    yield f"data: {json.dumps(event)}\n\n"
                last_sent = len(update_events)
            
            time.sleep(1)  # 1초마다 체크
    
    return Response(
        event_stream(),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control'
        }
    )

if __name__ == '__main__':
    # 개발/프로덕션 환경 분기
    if os.getenv('FLASK_ENV') == 'production':
        # 프로덕션: gunicorn이 실행
        logger.info("프로덕션 모드로 실행 중...")
        pass
    else:
        # 개발: Flask 개발 서버 실행
        logger.info("개발 모드로 실행 중...")
        app.run(debug=True, port=5000) 