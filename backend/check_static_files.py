#!/usr/bin/env python3
"""
정적 파일 상태 확인 스크립트
Docker 컨테이너 또는 개발 환경에서 정적 파일들이 올바르게 배치되었는지 확인합니다.
"""

import os
import json
import sys

def check_static_files():
    """정적 파일 상태 확인"""
    current_dir = os.getcwd()
    
    report = {
        'current_directory': current_dir,
        'timestamp': __import__('datetime').datetime.now().isoformat(),
        'environment': {
            'FLASK_ENV': os.getenv('FLASK_ENV', 'development'),
            'DEBUG_MODE': os.getenv('DEBUG_MODE', 'false')
        },
        'paths': {},
        'critical_files': {}
    }
    
    # 확인할 경로들
    paths_to_check = {
        'docker_static': os.path.join(current_dir, 'static'),
        'dev_frontend_build': os.path.join(os.path.dirname(current_dir), 'frontend', 'build'),
        'build_dir': os.path.join(current_dir, 'build')
    }
    
    for name, path in paths_to_check.items():
        path_info = {
            'path': path,
            'exists': os.path.exists(path),
            'is_directory': False,
            'contents': []
        }
        
        if path_info['exists']:
            path_info['is_directory'] = os.path.isdir(path)
            if path_info['is_directory']:
                try:
                    contents = os.listdir(path)
                    path_info['contents'] = sorted(contents)
                    path_info['file_count'] = len([f for f in contents if os.path.isfile(os.path.join(path, f))])
                    path_info['dir_count'] = len([f for f in contents if os.path.isdir(os.path.join(path, f))])
                except Exception as e:
                    path_info['error'] = str(e)
        
        report['paths'][name] = path_info
    
    # 중요한 파일들 확인
    critical_files = [
        'index.html',
        'manifest.json',
        'static/css/main.c362cf89.css',
        'static/js/main.e2348e78.js'
    ]
    
    for file_name in critical_files:
        found_paths = []
        
        for path_name, path_info in report['paths'].items():
            if path_info['exists'] and path_info['is_directory']:
                full_file_path = os.path.join(path_info['path'], file_name)
                if os.path.exists(full_file_path):
                    found_paths.append({
                        'location': path_name,
                        'full_path': full_file_path,
                        'size': os.path.getsize(full_file_path) if os.path.isfile(full_file_path) else 0
                    })
        
        report['critical_files'][file_name] = {
            'found': len(found_paths) > 0,
            'locations': found_paths
        }
    
    return report

def main():
    """메인 함수"""
    try:
        report = check_static_files()
        
        print("=== 정적 파일 상태 보고서 ===\n")
        print(f"현재 디렉토리: {report['current_directory']}")
        print(f"환경: {report['environment']}")
        print(f"확인 시각: {report['timestamp']}")
        
        print("\n=== 경로 상태 ===")
        for name, info in report['paths'].items():
            status = "✅ 존재" if info['exists'] else "❌ 없음"
            print(f"{name}: {status}")
            if info['exists'] and info['is_directory']:
                print(f"  - 파일: {info.get('file_count', 0)}개")
                print(f"  - 디렉토리: {info.get('dir_count', 0)}개")
                if info.get('contents'):
                    print(f"  - 내용: {', '.join(info['contents'][:5])}")
                    if len(info['contents']) > 5:
                        print(f"    ... 및 {len(info['contents']) - 5}개 더")
        
        print("\n=== 중요 파일 상태 ===")
        all_found = True
        for file_name, info in report['critical_files'].items():
            status = "✅ 찾음" if info['found'] else "❌ 없음"
            print(f"{file_name}: {status}")
            if info['found']:
                for location in info['locations']:
                    size_kb = location['size'] / 1024 if location['size'] > 0 else 0
                    print(f"  - {location['location']}: {size_kb:.1f}KB")
            else:
                all_found = False
        
        # JSON 출력 (로그 분석용)
        if os.getenv('OUTPUT_JSON') == 'true':
            print(f"\n=== JSON 보고서 ===")
            print(json.dumps(report, indent=2, ensure_ascii=False))
        
        # 결과 반환
        if not all_found:
            print("\n⚠️  일부 중요 파일을 찾을 수 없습니다.")
            return 1
        else:
            print("\n✅ 모든 중요 파일이 정상적으로 확인되었습니다.")
            return 0
            
    except Exception as e:
        print(f"오류 발생: {e}")
        return 1

if __name__ == '__main__':
    sys.exit(main())