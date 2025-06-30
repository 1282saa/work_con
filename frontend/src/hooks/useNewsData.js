/**
 * 뉴스 데이터 관리 커스텀 훅
 * 데이터 로딩, 상태 변경, 필터링 로직을 캡슐화
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";

export const useNewsData = (searchParams, currentFilter) => {
  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 뉴스 데이터 로딩
  const fetchNews = useCallback(async (params) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get("/api/news", { params });

      if (response.data.success) {
        setNewsData(response.data.data || []);
      } else {
        throw new Error(
          response.data.message || "데이터 로딩 중 오류가 발생했습니다."
        );
      }
    } catch (err) {
      console.error("뉴스 데이터 로딩 실패:", err);
      setError(err.message || "데이터를 가져오는 중 오류가 발생했습니다.");
      // 팝업 제거 - 속도 우선
    } finally {
      setLoading(false);
    }
  }, []);

  // 뉴스 상태 변경 (Optimistic UI)
  const updateNewsStatus = useCallback(
    async (newsId, newStatus) => {
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
    [newsData]
  );

  // 모든 뉴스 초기화
  const resetAllNews = useCallback(async () => {
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
  }, [newsData]);

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

  // 파라미터 변경시 데이터 로딩
  useEffect(() => {
    fetchNews(searchParams);
  }, [searchParams, fetchNews]);

  return {
    newsData,
    filteredNewsData,
    loading,
    error,
    stats,
    fetchNews,
    updateNewsStatus,
    resetAllNews,
  };
};
