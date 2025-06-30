#!/usr/bin/env python3
"""
정적 파일 서빙 테스트 스크립트
Flask 애플리케이션의 정적 파일 처리 기능을 테스트합니다.
"""

import os
import sys
import logging
from static_serve import StaticFileHandler

# 로깅 설정
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def test_static_handler():
    """정적 파일 핸들러 테스트"""
    print("=== 정적 파일 핸들러 테스트 ===\n")
    
    # 현재 디렉토리에서 핸들러 생성
    handler = StaticFileHandler(os.getcwd())
    
    print(f"현재 작업 디렉토리: {os.getcwd()}")
    print(f"정적 파일 경로들: {handler.static_paths}")
    
    # index.html 경로 확인
    index_path = handler.get_index_html_path()
    print(f"index.html 경로: {index_path}")
    
    # 사용 가능한 파일 목록
    files = handler.list_available_files()
    print("\n=== 사용 가능한 정적 파일들 ===")
    for path, file_list in files.items():
        print(f"\n경로: {path}")
        for file in file_list[:10]:  # 처음 10개만 표시
            print(f"  - {file}")
        if len(file_list) > 10:
            print(f"  ... 및 {len(file_list) - 10}개의 파일 더 있음")
    
    # 특정 파일 찾기 테스트
    test_files = [
        'static/css/main.c362cf89.css',
        'static/js/main.e2348e78.js',
        'manifest.json',
        'index.html'
    ]
    
    print("\n=== 파일 찾기 테스트 ===")
    for test_file in test_files:
        base_path, file_path = handler.find_static_file(test_file)
        if base_path:
            print(f"✅ {test_file} -> {os.path.join(base_path, file_path)}")
        else:
            print(f"❌ {test_file} -> 찾을 수 없음")

def check_directory_structure():
    """디렉토리 구조 확인"""
    print("\n=== 디렉토리 구조 확인 ===\n")
    
    current_dir = os.getcwd()
    print(f"현재 디렉토리: {current_dir}")
    
    # 주요 디렉토리들 확인
    directories_to_check = [
        os.path.join(current_dir, 'static'),
        os.path.join(os.path.dirname(current_dir), 'frontend', 'build'),
        os.path.join(current_dir, 'build')
    ]
    
    for dir_path in directories_to_check:
        print(f"\n디렉토리: {dir_path}")
        if os.path.exists(dir_path):
            print("  상태: 존재함")
            try:
                contents = os.listdir(dir_path)
                print(f"  내용 ({len(contents)}개):")
                for item in sorted(contents)[:5]:
                    print(f"    - {item}")
                if len(contents) > 5:
                    print(f"    ... 및 {len(contents) - 5}개의 항목 더 있음")
            except Exception as e:
                print(f"  오류: {e}")
        else:
            print("  상태: 존재하지 않음")

if __name__ == '__main__':
    try:
        check_directory_structure()
        test_static_handler()
        print("\n테스트 완료!")
    except Exception as e:
        print(f"테스트 중 오류 발생: {e}")
        sys.exit(1)