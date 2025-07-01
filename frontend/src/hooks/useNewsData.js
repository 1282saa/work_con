/**
 * 뉴스 데이터 관리 커스텀 훅
 * 데이터 로딩, 상태 변경, 필터링 로직을 캡슐화
 * 자동 새로고침으로 실시간 동기화 지원
 */

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import axios from "axios";

export const useNewsData = (searchParams, currentFilter) => {
  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const intervalRef = useRef(null);
  const eventSourceRef = useRef(null);

  // 뉴스 데이터 로딩
  const fetchNews = useCallback(async (params, isBackground = false) => {
    try {
      if (!isBackground) {
        setLoading(true);
        setError(null);
      }

      const response = await axios.get("/api/news", { params });

      if (response.data.success) {
        setNewsData(response.data.data || []);
        if (!isBackground) {
          console.log(
            "📊 뉴스 데이터 업데이트됨:",
            response.data.data.length,
            "개"
          );
        }
      } else {
        throw new Error(
          response.data.message || "데이터 로딩 중 오류가 발생했습니다."
        );
      }
    } catch (err) {
      console.error("뉴스 데이터 로딩 실패:", err);
      if (!isBackground) {
        setError(err.message || "데이터를 가져오는 중 오류가 발생했습니다.");
      }
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
    }
  }, []);

  // 사용자 활동 감지
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  // 뉴스 상태 변경 (Optimistic UI)
  const updateNewsStatus = useCallback(
    async (newsId, newStatus) => {
      updateActivity(); // 사용자 활동 기록

      // 1. 즉시 UI 업데이트 (Optimistic)
      const previousData = newsData;
      setNewsData((prevData) =>
        prevData.map((item) =>
          item.news_id === newsId ? { ...item, status: newStatus } : item
        )
      );

      try {
        // 2. 서버에 요청
        const response = await axios.post("/api/news/status", {
          news_id: newsId,
          status: newStatus,
        });

        if (!response.data.success) {
          throw new Error(response.data.message || "상태 변경에 실패했습니다.");
        }
      } catch (error) {
        // 3. 실패 시 롤백
        setNewsData(previousData);
        throw error;
      }
    },
    [newsData, updateActivity]
  );

  // 모든 뉴스 초기화
  const resetAllNews = useCallback(async () => {
    updateActivity(); // 사용자 활동 기록

    const resetPromises = newsData.map(async (news) => {
      if (news.status !== "미진행") {
        return axios.post("/api/news/status", {
          news_id: news.news_id,
          status: "미진행",
        });
      }
      return Promise.resolve();
    });

    await Promise.all(resetPromises);

    setNewsData((prevData) =>
      prevData.map((item) => ({ ...item, status: "미진행" }))
    );
  }, [newsData, updateActivity]);

  // 통계 계산
  const stats = useMemo(() => {
    if (!newsData) return { total: 0, completed: 0, inProgress: 0, pending: 0 };
    return {
      total: newsData.length,
      completed: newsData.filter((item) => item.status === "작업완료").length,
      inProgress: newsData.filter((item) => item.status === "작업중").length,
      pending: newsData.filter((item) => item.status === "미진행").length,
    };
  }, [newsData]);

  // 필터링된 데이터
  const filteredNewsData = useMemo(() => {
    if (!newsData) return [];
    if (currentFilter === "all") return newsData;
    if (currentFilter === "pending")
      return newsData.filter((item) => item.status === "미진행");
    if (currentFilter === "completed")
      return newsData.filter((item) => item.status === "작업완료");
    if (currentFilter === "inProgress")
      return newsData.filter((item) => item.status === "작업중");
    return newsData;
  }, [newsData, currentFilter]);

  // Server-Sent Events 설정
  useEffect(() => {
    // SSE 연결 설정
    const connectSSE = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      console.log("🔗 실시간 업데이트 연결 중...");
      eventSourceRef.current = new EventSource("/api/events");

      eventSourceRef.current.onmessage = (event) => {
        try {
          const updateEvent = JSON.parse(event.data);
          console.log("📡 실시간 업데이트 수신:", updateEvent);

          if (updateEvent.type === "status_change") {
            // 상태 변경 실시간 반영
            setNewsData((prevData) =>
              prevData.map((item) =>
                item.news_id === updateEvent.data.news_id
                  ? { ...item, status: updateEvent.data.status }
                  : item
              )
            );
          } else if (updateEvent.type === "ai_content_generated") {
            // AI 콘텐츠 생성 실시간 반영
            setNewsData((prevData) =>
              prevData.map((item) =>
                item.news_id === updateEvent.data.news_id
                  ? { ...item, ai_content: "생성됨" } // 실제 콘텐츠는 클릭 시 로드
                  : item
              )
            );
          }
        } catch (error) {
          console.error("SSE 이벤트 파싱 오류:", error);
        }
      };

      eventSourceRef.current.onerror = (error) => {
        console.error("SSE 연결 오류:", error);
        // 5초 후 재연결 시도
        setTimeout(connectSSE, 5000);
      };

      eventSourceRef.current.onopen = () => {
        console.log("✅ 실시간 업데이트 연결됨");
      };
    };

    connectSSE();

    // 컴포넌트 언마운트 시 정리
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // 기존 자동 새로고침도 유지 (백업용)
  useEffect(() => {
    // 30초마다 백그라운드에서 데이터 새로고침 (SSE 백업)
    const startAutoRefresh = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(() => {
        // 최근 5분 이내에 사용자 활동이 있었다면 새로고침
        const timeSinceActivity = Date.now() - lastActivity;
        if (timeSinceActivity < 5 * 60 * 1000) {
          // 5분
          console.log("🔄 백업 새로고침 중...");
          fetchNews(searchParams, true); // 백그라운드 새로고침
        }
      }, 30000); // 30초마다 (SSE 백업용)
    };

    startAutoRefresh();

    // 컴포넌트 언마운트 시 정리
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [searchParams, fetchNews, lastActivity]);

  // 파라미터 변경시 데이터 로딩
  useEffect(() => {
    fetchNews(searchParams);
  }, [searchParams, fetchNews]);

  // 사용자 활동 감지 이벤트 리스너
  useEffect(() => {
    const handleUserActivity = () => updateActivity();

    // 마우스, 키보드, 터치 이벤트 감지
    window.addEventListener("mousedown", handleUserActivity);
    window.addEventListener("keydown", handleUserActivity);
    window.addEventListener("touchstart", handleUserActivity);
    window.addEventListener("scroll", handleUserActivity);

    return () => {
      window.removeEventListener("mousedown", handleUserActivity);
      window.removeEventListener("keydown", handleUserActivity);
      window.removeEventListener("touchstart", handleUserActivity);
      window.removeEventListener("scroll", handleUserActivity);
    };
  }, [updateActivity]);

  return {
    newsData,
    filteredNewsData,
    loading,
    error,
    stats,
    fetchNews,
    updateNewsStatus,
    resetAllNews,
    updateActivity, // 수동으로 활동 업데이트
  };
};
