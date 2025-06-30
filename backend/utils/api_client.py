"""
빅카인즈 API 통신을 담당하는 클라이언트 모듈입니다.
뉴스 데이터를 검색하고 가져오는 기능을 제공합니다.
"""

import os
import requests
from dotenv import load_dotenv

# .env 파일에서 환경변수 로드
load_dotenv()

class BigkindsClient:
    """빅카인즈 API 클라이언트 클래스"""
    
    def __init__(self):
        """빅카인즈 API 클라이언트 초기화"""
        self.api_key = os.getenv('BIGKINDS_API_KEY')
        if not self.api_key:
            raise ValueError("BIGKINDS_API_KEY가 설정되지 않았습니다. .env 파일을 확인해주세요.")
        
        self.base_url = "https://tools.kinds.or.kr/search/news"
        
    def get_news(self, query="", from_date="", until_date="", provider=None, return_size=10000):
        """
        뉴스 데이터를 검색하여 가져옵니다.
        
        Args:
            query (str): 검색어 (빈 문자열이면 전체 검색)
            from_date (str): 시작 날짜 (YYYY-MM-DD 형식)
            until_date (str): 종료 날짜 (YYYY-MM-DD 형식)
            provider (list): 제공자 목록
            return_size (int): 반환할 기사 개수 (최대 10000)
            
        Returns:
            dict: 검색 결과
        """
        # 요청 페이로드 설정
        payload = {
            "access_key": self.api_key,
            "argument": {
                "news_ids": [],
                "query": query,
                "published_at": {
                    "from": from_date,
                    "until": until_date
                },
                "provider": provider if provider is not None else [],
                "category": [],
                "category_incident": [],
                "provider_subject": [],
                "subject_info": [],
                "sort": {"date": "desc"},
                "return_from": 0,
                "return_size": return_size,
                "fields": [
                    "title", "news_id", "published_at", "content", "provider",
                    "byline", "provider_link_page", "dateline", "enveloped_at", "hilight",
                    "category", "category_incident", "provider_subject", "subject_info"
                ]
            }
        }
        
        # API 요청
        response = requests.post(self.base_url, json=payload)
        
        # 응답 확인
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"API 요청 실패: {response.status_code} - {response.text}") 