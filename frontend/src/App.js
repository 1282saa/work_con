/**
 * 서울경제신문 콘텐츠 플랫폼
 * 깔끔하고 직관적인 뉴스 작업 관리 시스템
 *
 * BigKinds API를 활용하여 뉴스 데이터를 가져오고,
 * Excel과 유사한 고밀도 인터페이스로 작업 상태를 관리합니다.
 *
 * @returns {JSX.Element} 메인 애플리케이션 컴포넌트
 */

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Snackbar,
  Container,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  Paper,
  Stack,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  Home as HomeIcon,
  Language as LanguageIcon,
  Newspaper as NewspaperIcon,
  CheckCircle,
  Assignment,
  AutoAwesome as SparkleIcon,
  MenuBook as MenuBookIcon,
} from "@mui/icons-material";
import { format } from "date-fns";

import WorkStatusTable from "./components/WorkStatusTable";
import DateNavigation from "./components/DateNavigation";
import EmbeddedPage from "./components/EmbeddedPage";
import PromptSidebar from "./components/PromptSidebar";
import TimeBasedBackground from "./components/FloatingParticles";
import { useNewsData } from "./hooks/useNewsData";

// 탭 패널 컴포넌트
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function App() {
  // 상태 관리
  const [currentTab, setCurrentTab] = useState(0);
  const [searchParams, setSearchParams] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    query: "",
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [particlesActive, setParticlesActive] = useState(true);
  const [currentFilter, setCurrentFilter] = useState("all");

  // 뉴스 데이터 관리 (커스텀 훅 사용)
  const {
    filteredNewsData,
    loading,
    error,
    stats,
    fetchNews,
    updateNewsStatus,
    resetAllNews,
  } = useNewsData(searchParams, currentFilter);

  // 뉴스 상태 변경 처리
  const handleStatusChange = async (newsId, newStatus) => {
    try {
      await updateNewsStatus(newsId, newStatus);
    } catch (err) {
      console.error("상태 변경 실패:", err);
      setSnackbar({
        open: true,
        message: "상태 변경 중 오류가 발생했습니다.",
        severity: "error",
      });
    }
  };

  // 복사 성공 처리
  const handleCopySuccess = (message) => {
    setSnackbar({
      open: true,
      message: message,
      severity: "success",
    });
  };

  // 검색 핸들러
  const handleSearch = (query) => {
    setSearchParams((prev) => ({ ...prev, query }));
  };

  // 날짜 변경 핸들러
  const handleDateChange = (date) => {
    setSearchParams((prev) => ({ ...prev, date }));
  };

  // 스낵바 닫기 핸들러
  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // 탭 변경 핸들러
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // 사이드바 토글
  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // 파티클 토글
  const handleToggleParticles = () => {
    setParticlesActive(!particlesActive);
  };

  // 필터 변경 핸들러
  const handleFilterChange = (newFilter) => {
    setCurrentFilter(newFilter);
  };

  // 초기화 핸들러
  const handleReset = async () => {
    try {
      await resetAllNews();
    } catch (err) {
      console.error("초기화 실패:", err);
      setSnackbar({
        open: true,
        message: "초기화 중 오류가 발생했습니다.",
        severity: "error",
      });
    }
  };

  return (
    <>
      {/* 시간대별 아름다운 배경 효과 */}
      <TimeBasedBackground isActive={particlesActive} />

      <AppBar
        position="static"
        color="default"
        elevation={0}
        sx={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}
      >
        <Toolbar sx={{ minHeight: "80px" }}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={2}
            sx={{ flex: 1 }}
          >
            <Assignment sx={{ color: "#3b82f6", fontSize: 32 }} />
            <Box>
              <Typography
                variant="h5"
                sx={{ fontWeight: 700, color: "#1e293b", mb: 0.5 }}
              >
                오늘의 작업
              </Typography>
            </Box>
          </Stack>

          {/* 우측 헤더 버튼들 */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <Tooltip
              title={particlesActive ? "배경 효과 끄기" : "배경 효과 켜기"}
            >
              <IconButton
                onClick={handleToggleParticles}
                sx={{
                  color: particlesActive ? "#ffd700" : "#9ca3af",
                  "&:hover": {
                    backgroundColor: "rgba(255, 215, 0, 0.1)",
                  },
                }}
              >
                <SparkleIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="프롬프트 메모장">
              <IconButton
                onClick={handleToggleSidebar}
                sx={{
                  color: sidebarOpen ? "#667eea" : "#6b7280",
                  background: sidebarOpen
                    ? "linear-gradient(45deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))"
                    : "transparent",
                  "&:hover": {
                    background:
                      "linear-gradient(45deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))",
                  },
                }}
              >
                <MenuBookIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container
        maxWidth="xl"
        sx={{
          py: 4,
          pr: sidebarOpen ? "420px" : 4,
          transition: "padding-right 0.3s ease",
        }}
      >
        <Box
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            bgcolor: "white",
            borderRadius: "8px 8px 0 0",
          }}
        >
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            aria-label="메인 탭"
          >
            <Tab
              icon={<HomeIcon />}
              iconPosition="start"
              label="뉴스 워크플로우"
            />
            <Tab icon={<LanguageIcon />} iconPosition="start" label="캐럿" />
            <Tab
              icon={<NewspaperIcon />}
              iconPosition="start"
              label="서울경제"
            />
          </Tabs>
        </Box>

        <TabPanel value={currentTab} index={0}>
          {/* 날짜 네비게이션 */}
          <DateNavigation
            selectedDate={searchParams.date}
            onDateChange={handleDateChange}
            onReset={handleReset}
            onFilterChange={handleFilterChange}
            currentFilter={currentFilter}
            searchQuery={searchParams.query}
            onSearchChange={handleSearch}
            loading={loading}
            fetchNews={() => fetchNews(searchParams)}
            stats={stats}
          />

          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
              <CircularProgress />
            </Box>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          {!loading && filteredNewsData.length > 0 && (
            <WorkStatusTable
              newsData={filteredNewsData}
              onStatusChange={handleStatusChange}
              onCopySuccess={handleCopySuccess}
            />
          )}
          {!loading && filteredNewsData.length === 0 && !error && (
            <Paper sx={{ p: 6, textAlign: "center" }}>
              <CheckCircle
                sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary">
                데이터가 없습니다.
              </Typography>
            </Paper>
          )}
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <EmbeddedPage src="https://carat.im/" title="캐럿 (carat.im)" />
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          <EmbeddedPage src="https://www.sedaily.com/" title="서울경제" />
        </TabPanel>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>

      {/* 프롬프트 사이드바 */}
      <PromptSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onCopySuccess={handleCopySuccess}
      />
    </>
  );
}

export default App;
