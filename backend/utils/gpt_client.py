"""
OpenAI GPT API를 활용한 인스타그램 콘텐츠 생성 클라이언트
뉴스 기사를 바탕으로 인스타그램용 설명글과 해시태그를 자동 생성합니다.
"""

import os
import openai
from dotenv import load_dotenv

# .env 파일에서 환경변수 로드
load_dotenv()

class GPTClient:
    """OpenAI GPT API 클라이언트 클래스"""
    
    def __init__(self):
        """GPT 클라이언트 초기화"""
        self.api_key = os.getenv('OPENAI_API_KEY')
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY가 설정되지 않았습니다. .env 파일을 확인해주세요.")
        
        # OpenAI 클라이언트 초기화
        self.client = openai.OpenAI(api_key=self.api_key)
        
    def generate_instagram_content(self, title, content, category=None):
        """
        뉴스 기사를 바탕으로 인스타그램용 콘텐츠를 생성합니다.
        
        Args:
            title (str): 뉴스 제목
            content (str): 뉴스 본문
            category (str): 뉴스 카테고리 (선택사항)
            
        Returns:
            dict: 생성된 인스타그램 콘텐츠
                - description: 인스타그램용 설명글
                - hashtags: 해시태그 리스트
        """
        try:
            # 카테고리 정보 포함 여부 확인
            category_info = f"\n카테고리: {category}" if category else ""
            
            # GPT 프롬프트 구성
            prompt = f"""
다음 뉴스 기사를 바탕으로 매력적인 인스타그램 포스팅용 콘텐츠를 생성해주세요.

제목: {title}
본문: {content[:1000]}...{category_info}

출력 형식 (정확히 이 형태로):
[뉴스 제목을 매력적으로 재작성]

1️⃣ [첫 번째 핵심 포인트 제목]
[첫 번째 포인트에 대한 구체적 설명]
2️⃣ [두 번째 핵심 포인트 제목]  
[두 번째 포인트에 대한 구체적 설명]
3️⃣ [세 번째 핵심 포인트 제목]
[세 번째 포인트에 대한 구체적 설명]
4️⃣ [네 번째 핵심 포인트 제목] (필요시)
[네 번째 포인트에 대한 구체적 설명]

경제·산업·생활·사회
가장 빠른 속보는 여기👉 @economy_dragon_

#핵심키워드1 #핵심키워드2 #핵심키워드3 #핵심키워드4 #뉴스

작성 가이드:
- 🔥💡📊⚡ 등 임팩트 있는 이모지 활용
- "완전 미친", "레전드", "ㄷㄷ" 등 젊은 감각의 표현 사용
- 숫자와 데이터를 강조하여 임팩트 증대
- 독자의 호기심을 자극하는 문체
- 해시태그는 정확히 5개만 (마지막은 반드시 #뉴스)
- 줄바꿈을 적절히 사용하여 가독성 향상
- "경제·산업·생활·사회" 및 "@economy_dragon_" 문구는 반드시 포함

참고 예시:
북한에 쌀병 보내려던 미국인 6명 강화도서 현장 검거

1️⃣ 새벽의 미스터리, 북한행 쌀병
美시민 6명, 강화도 해안서 쌀·달러·성경 담긴 페트병 1300여 개 북한으로 보내려다 붙잡혀.
2️⃣ 군부대 신고로 발각
인근 군부대가 수상한 움직임 감지 후 즉시 경찰 신고. 즉각 체포돼 조사 중.

경제·산업·생활·사회
가장 빠른 속보는 여기👉 @economy_dragon_

#강화도 #북한 #미국인 #현장검거 #뉴스
"""

            # GPT API 호출 (gpt-4o-mini 사용 - 가성비 좋음)
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system", 
                        "content": "당신은 소셜미디어 마케팅 전문가입니다. 뉴스 기사를 매력적인 인스타그램 콘텐츠로 변환하는 것이 전문입니다."
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                max_tokens=1000,
                temperature=0.7
            )
            
            # 응답 파싱
            generated_content = response.choices[0].message.content
            
            # 이제 통합된 형태로 반환 (파싱 없이 전체 텍스트 사용)
            return {
                'success': True,
                'content': generated_content.strip(),
                'raw_response': generated_content
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'content': '',
                'raw_response': ''
            }
    
    def generate_quick_hashtags(self, title, category=None):
        """
        제목만으로 빠르게 해시태그를 생성합니다.
        
        Args:
            title (str): 뉴스 제목
            category (str): 뉴스 카테고리 (선택사항)
            
        Returns:
            dict: 생성된 해시태그
        """
        try:
            category_info = f" (카테고리: {category})" if category else ""
            
            prompt = f"""
다음 뉴스 제목에 적합한 인스타그램 해시태그 10개를 생성해주세요:

제목: {title}{category_info}

요구사항:
- 한국어와 영어 해시태그 혼합
- 트렌드 반영
- 뉴스 내용과 관련성 높게

응답 형식: #태그1 #태그2 #태그3 ...
"""

            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system", 
                        "content": "해시태그 생성 전문가입니다. 간결하고 효과적인 해시태그만 생성해주세요."
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                max_tokens=200,
                temperature=0.7
            )
            
            hashtags_text = response.choices[0].message.content
            hashtag_list = [tag.strip() for tag in hashtags_text.split('#') if tag.strip()]
            
            return {
                'success': True,
                'hashtags': hashtag_list
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'hashtags': []
            } 