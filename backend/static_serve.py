"""
정적 파일 서빙을 위한 미들웨어 및 유틸리티 함수
Flask 애플리케이션이 React 빌드 파일들을 올바르게 서빙하도록 지원
"""

import os
import logging
from flask import send_from_directory
from werkzeug.exceptions import NotFound

logger = logging.getLogger(__name__)


class StaticFileHandler:
    """정적 파일 처리를 위한 헬퍼 클래스"""
    
    def __init__(self, app_root):
        self.app_root = app_root
        self.static_paths = self._initialize_static_paths()
        
    def _initialize_static_paths(self):
        """가능한 정적 파일 경로들을 초기화"""
        paths = []
        
        # Docker 환경: React 빌드가 복사되는 경로
        docker_static = os.path.join(self.app_root, 'static')
        if os.path.exists(docker_static):
            paths.append(docker_static)
            logger.info(f"Docker static path found: {docker_static}")
        
        # 개발 환경: frontend/build 경로
        dev_static = os.path.join(os.path.dirname(self.app_root), 'frontend', 'build')
        if os.path.exists(dev_static):
            paths.append(dev_static)
            logger.info(f"Development static path found: {dev_static}")
            
        return paths
    
    def find_static_file(self, filepath):
        """정적 파일을 찾아서 전체 경로를 반환"""
        for base_path in self.static_paths:
            full_path = os.path.join(base_path, filepath)
            if os.path.exists(full_path) and os.path.isfile(full_path):
                return base_path, filepath
                
        # static/static 구조 체크 (React 빌드의 중첩 구조)
        if filepath.startswith('static/'):
            for base_path in self.static_paths:
                nested_path = os.path.join(base_path, filepath)
                if os.path.exists(nested_path) and os.path.isfile(nested_path):
                    return base_path, filepath
                    
        return None, None
    
    def serve_file(self, filepath):
        """파일을 찾아서 서빙"""
        base_path, file_path = self.find_static_file(filepath)
        
        if base_path and file_path:
            try:
                return send_from_directory(base_path, file_path)
            except Exception as e:
                logger.error(f"Error serving file {filepath}: {e}")
                raise NotFound(f"Error serving file: {e}")
        else:
            logger.warning(f"Static file not found: {filepath}")
            raise NotFound(f"Static file not found: {filepath}")
    
    def get_index_html_path(self):
        """index.html의 경로를 반환"""
        for base_path in self.static_paths:
            index_path = os.path.join(base_path, 'index.html')
            if os.path.exists(index_path):
                return base_path
        return None
    
    def list_available_files(self):
        """디버깅용: 사용 가능한 정적 파일 목록 반환"""
        files = {}
        for base_path in self.static_paths:
            path_files = []
            for root, dirs, filenames in os.walk(base_path):
                for filename in filenames:
                    rel_path = os.path.relpath(os.path.join(root, filename), base_path)
                    path_files.append(rel_path)
            files[base_path] = path_files
        return files