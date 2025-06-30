/**
 * 날짜 네비게이션 컴포넌트
 * 날짜 선택, 필터링, 검색, 초기화 기능을 통합 제공
 */

import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  InputAdornment,
  Button,
  Chip,
  Select,
  MenuItem,
  FormControl,
  Popover,
  Grid,
} from "@mui/material";
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  CalendarToday as CalendarIcon,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";
import {
  format,
  subDays,
  addDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
} from "date-fns";

const DateNavigation = ({
  selectedDate,
  onDateChange,
  onReset,
  onFilterChange,
  currentFilter,
  searchQuery,
  onSearchChange,
  loading,
  fetchNews,
  stats,
}) => {
  const [calendarAnchor, setCalendarAnchor] = useState(null);
  const [calendarDate, setCalendarDate] = useState(new Date(selectedDate));

  const handlePrevDay = () => {
    const date = new Date(selectedDate);
    onDateChange(format(subDays(date, 1), "yyyy-MM-dd"));
  };

  const handleNextDay = () => {
    const date = new Date(selectedDate);
    onDateChange(format(addDays(date, 1), "yyyy-MM-dd"));
  };

  const handleToday = () => {
    onDateChange(format(new Date(), "yyyy-MM-dd"));
  };

  const handleCalendarOpen = (event) => {
    setCalendarAnchor(event.currentTarget);
    setCalendarDate(new Date(selectedDate));
  };

  const handleCalendarClose = () => {
    setCalendarAnchor(null);
  };

  const handleDateSelect = (date) => {
    onDateChange(format(date, "yyyy-MM-dd"));
    handleCalendarClose();
  };

  const handleCalendarMonthChange = (direction) => {
    if (direction === "prev") {
      setCalendarDate(subDays(startOfMonth(calendarDate), 1));
    } else {
      setCalendarDate(addDays(endOfMonth(calendarDate), 1));
    }
  };

  // 달력 렌더링
  const renderCalendar = () => {
    const monthStart = startOfMonth(calendarDate);
    const monthEnd = endOfMonth(calendarDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // 월의 첫 번째 날이 시작하는 요일만큼 앞쪽에 빈 칸 추가
    const startDay = monthStart.getDay();
    const emptyDays = Array(startDay).fill(null);

    return (
      <Box sx={{ p: 2, width: 280 }}>
        {/* 달력 헤더 */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <IconButton
            size="small"
            onClick={() => handleCalendarMonthChange("prev")}
          >
            <ChevronLeft />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            {format(calendarDate, "yyyy년 MM월")}
          </Typography>
          <IconButton
            size="small"
            onClick={() => handleCalendarMonthChange("next")}
          >
            <ChevronRight />
          </IconButton>
        </Box>

        {/* 요일 헤더 */}
        <Grid container spacing={0} sx={{ mb: 1 }}>
          {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
            <Grid item xs key={day} sx={{ textAlign: "center" }}>
              <Typography
                variant="caption"
                sx={{ fontWeight: "bold", color: "text.secondary" }}
              >
                {day}
              </Typography>
            </Grid>
          ))}
        </Grid>

        {/* 날짜 그리드 */}
        <Grid container spacing={0}>
          {emptyDays.map((_, index) => (
            <Grid item xs key={`empty-${index}`} sx={{ aspectRatio: "1" }} />
          ))}
          {days.map((day) => {
            const isSelected = isSameDay(day, new Date(selectedDate));
            const isToday = isSameDay(day, new Date());

            return (
              <Grid item xs key={day.getTime()} sx={{ aspectRatio: "1" }}>
                <Button
                  onClick={() => handleDateSelect(day)}
                  sx={{
                    width: "100%",
                    height: "100%",
                    minWidth: 0,
                    borderRadius: 1,
                    backgroundColor: isSelected ? "#3b82f6" : "transparent",
                    color: isSelected
                      ? "white"
                      : isToday
                      ? "#3b82f6"
                      : "text.primary",
                    fontWeight: isToday ? "bold" : "normal",
                    "&:hover": {
                      backgroundColor: isSelected ? "#2563eb" : "#f1f5f9",
                    },
                  }}
                >
                  {format(day, "d")}
                </Button>
              </Grid>
            );
          })}
        </Grid>

        {/* 오늘 버튼 */}
        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Button size="small" onClick={() => handleDateSelect(new Date())}>
            오늘로 이동
          </Button>
        </Box>
      </Box>
    );
  };

  return (
    <Paper
      sx={{
        p: 2,
        mb: 3,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {/* 좌측: 필터 드롭다운 + 통계 */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <Select
            value={currentFilter}
            onChange={(e) => onFilterChange(e.target.value)}
            displayEmpty
          >
            <MenuItem value="all">전체보기</MenuItem>
            <MenuItem value="pending">미진행만</MenuItem>
            <MenuItem value="completed">완료만</MenuItem>
            <MenuItem value="inProgress">진행중만</MenuItem>
          </Select>
        </FormControl>

        <Chip
          label={`완료 ${stats.completed}건`}
          color="success"
          variant="outlined"
          size="small"
        />
        <Chip
          label={`진행중 ${stats.inProgress}건`}
          color="warning"
          variant="outlined"
          size="small"
        />
        <Chip
          label={`미진행 ${stats.pending}건`}
          color="error"
          variant="outlined"
          size="small"
        />
      </Box>

      {/* 중앙: 날짜 네비게이션 */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          flex: 1,
          justifyContent: "center",
        }}
      >
        <IconButton onClick={handleCalendarOpen}>
          <CalendarIcon sx={{ color: "#3b82f6" }} />
        </IconButton>
        <IconButton onClick={handlePrevDay}>
          <TrendingUp style={{ transform: "rotate(-135deg)" }} />
        </IconButton>
        <Typography
          variant="h6"
          sx={{ mx: 2, minWidth: "200px", textAlign: "center" }}
        >
          {format(new Date(selectedDate), "yyyy년 MM월 dd일 (E)")}
        </Typography>
        <IconButton onClick={handleNextDay}>
          <TrendingUp style={{ transform: "rotate(45deg)" }} />
        </IconButton>
        <Button variant="outlined" size="small" onClick={handleToday}>
          오늘
        </Button>
      </Box>

      {/* 우측: 검색 + 초기화 */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          flex: 1,
          justifyContent: "flex-end",
        }}
      >
        <TextField
          size="small"
          label="검색어 입력..."
          variant="outlined"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{ minWidth: "200px" }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: (
              <IconButton size="small" onClick={fetchNews} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            ),
          }}
        />
        <Button variant="outlined" size="small" onClick={onReset} color="error">
          초기화
        </Button>
      </Box>

      {/* 달력 팝오버 */}
      <Popover
        open={Boolean(calendarAnchor)}
        anchorEl={calendarAnchor}
        onClose={handleCalendarClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        {renderCalendar()}
      </Popover>
    </Paper>
  );
};

export default React.memo(DateNavigation);
