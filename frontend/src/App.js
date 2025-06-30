/**
 * 서울경제신문 콘텐츠 플랫폼
 * 깔끔하고 직관적인 뉴스 작업 관리 시스템
 * 
 * BigKinds API를 활용하여 뉴스 데이터를 가져오고,
 * Excel과 유사한 고밀도 인터페이스로 작업 상태를 관리합니다.
 * 
 * @returns {JSX.Element} 메인 애플리케이션 컴포넌트
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  TextField,
  IconButton,
  InputAdornment,
  CircularProgress,
  Alert,
  Snackbar,
  Container,
  Paper,
  Fade,
  Chip,
  Stack,
} from "@mui/material";
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  TrendingUp,
  Assignment,
  CheckCircle,
} from "@mui/icons-material";
import { format } from "date-fns";

import WorkStatusTable from "./components/WorkStatusTable";
import DateNavigation from "./components/DateNavigation";

function App() {
  // 핵심 상태만 유지
  const [workNewsData, setWorkNewsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [searchQuery, setSearchQuery] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // 뉴스 데이터 로딩 (useCallback으로 최적화)
  const fetchWorkNews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get("/api/news/hours", {
        params: {
          query: searchQuery,
          date: selectedDate,
        },
      });

      if (response.data.success) {
        setWorkNewsData(response.data.data);
      } else {
        throw new Error(response.data.message || "데이터 로딩 중 오류가 발생했습니다.");
      }
    } catch (err) {
      console.error("뉴스 데이터 로딩 실패:", err);
      const errorMessage = err.response?.data?.message || err.message || "데이터를 가져오는 중 오류가 발생했습니다.";
      setError(errorMessage);
      setSnackbar({
        open: true,
        message: "데이터 로딩에 실패했습니다.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedDate]);

  // 초기 데이터 로딩 및 날짜/검색어 변경 시 자동 갱신
  useEffect(() => {
    fetchWorkNews();
  }, [fetchWorkNews]);

  // 뉴스 상태 변경 처리 (useCallback으로 최적화)
  const handleStatusChange = useCallback(async (newsId, newStatus) => {
    try {
      const response = await axios.post("/api/news/status", {
        news_id: newsId,
        status: newStatus,
      });

      if (response.data.success) {
        // WorkNewsData 내의 상태 업데이트
        setWorkNewsData(prevData => {
          if (!prevData?.hourly_articles) return prevData;
          
          const updatedArticles = { ...prevData.hourly_articles };
          Object.keys(updatedArticles).forEach(hour => {
            updatedArticles[hour] = updatedArticles[hour].map(item =>
              item.news_id === newsId ? { ...item, status: newStatus } : item
            );
          });
          
          return {
            ...prevData,
            hourly_articles: updatedArticles
          };
        });

        setSnackbar({
          open: true,
          message: "상태가 변경되었습니다.",
          severity: "success",
        });
      } else {
        throw new Error(response.data.message || "상태 변경에 실패했습니다.");
      }
    } catch (err) {
      console.error("상태 변경 실패:", err);
      const errorMessage = err.response?.data?.message || err.message || "상태 변경 중 오류가 발생했습니다.";
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    }
  }, []);

  // 검색 실행 (useCallback으로 최적화)
  const handleSearch = useCallback(() => {
    fetchWorkNews();
  }, [fetchWorkNews]);

  // Enter 키로 검색 (useCallback으로 최적화)
  const handleKeyPress = useCallback((event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  // 날짜 변경 핸들러 (useCallback으로 최적화)
  const handleDateChange = useCallback((newDate) => {
    setSelectedDate(newDate);
  }, []);

  // 스낵바 닫기 (useCallback으로 최적화)
  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  // 복사 성공 핸들러 (useCallback으로 최적화)
  const handleCopySuccess = useCallback((message) => {
    setSnackbar({
      open: true,
      message,
      severity: "success",
    });
  }, []);

  // 통계 계산 (useMemo로 최적화)
  const { newsItems, stats } = useMemo(() => {
    const items = workNewsData?.hourly_articles 
      ? Object.values(workNewsData.hourly_articles).flat() 
      : [];
    
    const statistics = {
      total: items.length,
      completed: items.filter(item => item.status === '작업완료').length,
      inProgress: items.filter(item => item.status === '작업중').length,
      pending: items.filter(item => item.status === '미진행').length,
    };
    
    return { newsItems: items, stats: statistics };
  }, [workNewsData]);

  return (
    <Box sx={{ 
      minHeight: "100vh", 
      backgroundColor: "#f8fafc",
      pb: 4
    }}>
      {/* 깔끔한 헤더 */}
      <Paper 
        elevation={0} 
        sx={{ 
          backgroundColor: "white",
          borderBottom: "1px solid #e2e8f0",
          mb: 3
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ py: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Assignment sx={{ color: "#3b82f6", fontSize: 32 }} />
              <Box>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 700,
                    color: "#1e293b",
                    mb: 0.5
                  }}
                >
                  서울경제신문 콘텐츠 플랫폼
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  효율적인 뉴스 콘텐츠 작업 관리
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Container>
      </Paper>

      <Container maxWidth="xl">
        {/* 간단한 통계 표시 */}
        {stats.total > 0 && (
          <Fade in={true}>
            <Paper sx={{ p: 3, mb: 3, backgroundColor: "white" }}>
              <Stack direction="row" spacing={4} alignItems="center">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <TrendingUp sx={{ color: "#6b7280" }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: "#374151" }}>
                    오늘의 작업
                  </Typography>
                </Box>
                
                <Stack direction="row" spacing={3}>
                  <Chip 
                    label={`전체 ${stats.total}건`}
                    sx={{ 
                      backgroundColor: "#f1f5f9",
                      color: "#475569",
                      fontWeight: 600
                    }}
                  />
                  <Chip 
                    label={`완료 ${stats.completed}건`}
                    sx={{ 
                      backgroundColor: "#dcfce7",
                      color: "#166534",
                      fontWeight: 600
                    }}
                  />
                  <Chip 
                    label={`진행중 ${stats.inProgress}건`}
                    sx={{ 
                      backgroundColor: "#fef3c7",
                      color: "#92400e",
                      fontWeight: 600
                    }}
                  />
                  <Chip 
                    label={`미진행 ${stats.pending}건`}
                    sx={{ 
                      backgroundColor: "#fee2e2",
                      color: "#991b1b",
                      fontWeight: 600
                    }}
                  />
                </Stack>
              </Stack>
            </Paper>
          </Fade>
        )}

        {/* 날짜 네비게이션 */}
        <DateNavigation
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
        />

        {/* 간소화된 검색 */}
        <Paper sx={{ p: 3, mb: 3, backgroundColor: "white" }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              placeholder="검색어를 입력하세요..."
              size="medium"
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "#6b7280" }} />
                  </InputAdornment>
                ),
                sx: {
                  backgroundColor: "#f8fafc",
                  borderRadius: 2,
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    border: '1px solid #d1d5db'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    border: '2px solid #3b82f6'
                  }
                }
              }}
            />
            
            <IconButton
              onClick={handleSearch}
              disabled={loading}
              sx={{
                backgroundColor: "#3b82f6",
                color: "white",
                p: 1.5,
                '&:hover': {
                  backgroundColor: "#2563eb"
                },
                '&:disabled': {
                  backgroundColor: "#9ca3af"
                }
              }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: "white" }} /> : <RefreshIcon />}
            </IconButton>
          </Stack>
        </Paper>

        {/* 에러 표시 */}
        {error && (
          <Fade in={true}>
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          </Fade>
        )}

        {/* 메인 콘텐츠 */}
        {!error && (
          <Fade in={!loading}>
            <Box>
              {workNewsData && newsItems.length > 0 ? (
                <WorkStatusTable
                  newsData={newsItems}
                  onStatusChange={handleStatusChange}
                  onCopySuccess={handleCopySuccess}
                />
              ) : !loading ? (
                <Paper sx={{ p: 6, textAlign: "center", backgroundColor: "white" }}>
                  <CheckCircle sx={{ fontSize: 64, color: "#6b7280", mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    선택한 날짜에 기사가 없습니다
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    다른 날짜를 선택하거나 검색어를 변경해보세요
                  </Typography>
                </Paper>
              ) : null}
            </Box>
          </Fade>
        )}

        {/* 로딩 표시 */}
        {loading && (
          <Box sx={{ 
            display: "flex", 
            flexDirection: "column",
            alignItems: "center", 
            justifyContent: "center",
            py: 8 
          }}>
            <CircularProgress size={48} sx={{ mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              데이터를 불러오는 중...
            </Typography>
          </Box>
        )}
      </Container>

      {/* 스낵바 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ 
            minWidth: 250,
            fontWeight: 500
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default App;