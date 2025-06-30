/**
 * 깔끔한 날짜 네비게이션 컴포넌트
 * 직관적이고 세련된 디자인으로 날짜 선택을 제공합니다.
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {string} props.selectedDate - 선택된 날짜 (YYYY-MM-DD 형식)
 * @param {Function} props.onDateChange - 날짜 변경 핸들러 함수
 * @returns {JSX.Element} 날짜 네비게이션 컴포넌트
 */

import React, { useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  TextField,
  Stack,
  Button,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Today,
  CalendarMonth,
} from '@mui/icons-material';
import { format, addDays, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';

const DateNavigation = ({ selectedDate, onDateChange }) => {
  // 문자열 날짜를 Date 객체로 변환 (useMemo로 최적화)
  const currentDate = useMemo(() => new Date(selectedDate), [selectedDate]);

  // 이전 날짜로 이동 (useCallback으로 최적화)
  const handlePrevDay = useCallback(() => {
    const prevDate = subDays(currentDate, 1);
    onDateChange(format(prevDate, 'yyyy-MM-dd'));
  }, [currentDate, onDateChange]);

  // 다음 날짜로 이동 (useCallback으로 최적화)
  const handleNextDay = useCallback(() => {
    const nextDate = addDays(currentDate, 1);
    onDateChange(format(nextDate, 'yyyy-MM-dd'));
  }, [currentDate, onDateChange]);

  // 오늘 날짜로 이동 (useCallback으로 최적화)
  const handleToday = useCallback(() => {
    const today = new Date();
    onDateChange(format(today, 'yyyy-MM-dd'));
  }, [onDateChange]);

  // 날짜 직접 입력 (useCallback으로 최적화)
  const handleDateInputChange = useCallback((event) => {
    const newDate = event.target.value;
    if (newDate) {
      onDateChange(newDate);
    }
  }, [onDateChange]);

  // 날짜 포맷팅 및 오늘 여부 계산 (useMemo로 최적화)
  const { formattedDate, isToday } = useMemo(() => {
    const koreanDate = format(currentDate, 'yyyy년 MM월 dd일 (E)', { locale: ko });
    const todayCheck = format(currentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
    return { formattedDate: koreanDate, isToday: todayCheck };
  }, [currentDate]);

  return (
    <Paper 
      sx={{ 
        p: 3, 
        mb: 3, 
        backgroundColor: "white",
        border: "1px solid #e2e8f0",
        borderRadius: 3
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        {/* 중앙: 날짜 표시 및 네비게이션 */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ flex: 1, justifyContent: "center" }}>
          <IconButton
            onClick={handlePrevDay}
            sx={{
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              color: "#64748b",
              '&:hover': {
                backgroundColor: "#f1f5f9",
                borderColor: "#cbd5e1"
              },
            }}
          >
            <ChevronLeft />
          </IconButton>

          <Box sx={{ mx: 4, textAlign: 'center', minWidth: 320 }}>
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mb: 1 }}>
              <CalendarMonth sx={{ color: "#3b82f6", fontSize: 28 }} />
              <Typography
                variant="h5"
                sx={{ 
                  fontWeight: 700,
                  color: "#1e293b"
                }}
              >
                {formattedDate}
              </Typography>
              {isToday && (
                <Box
                  sx={{
                    backgroundColor: "#dcfce7",
                    color: "#166534",
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: "0.75rem",
                    fontWeight: 600
                  }}
                >
                  오늘
                </Box>
              )}
            </Stack>
            <Typography variant="body2" color="text.secondary">
              좌우 화살표 또는 달력으로 날짜를 변경하세요
            </Typography>
          </Box>

          <IconButton
            onClick={handleNextDay}
            sx={{
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              color: "#64748b",
              '&:hover': {
                backgroundColor: "#f1f5f9",
                borderColor: "#cbd5e1"
              },
            }}
          >
            <ChevronRight />
          </IconButton>
        </Stack>

        {/* 오른쪽: 날짜 입력 및 오늘 버튼 */}
        <Stack direction="row" alignItems="center" spacing={2}>
          <TextField
            type="date"
            value={selectedDate}
            onChange={handleDateInputChange}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: "#f8fafc",
                borderRadius: 2,
                '& fieldset': {
                  borderColor: '#e2e8f0',
                },
                '&:hover fieldset': {
                  borderColor: '#cbd5e1',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#3b82f6',
                },
              },
            }}
          />

          <Button
            onClick={handleToday}
            startIcon={<Today />}
            variant="contained"
            size="small"
            sx={{
              backgroundColor: "#3b82f6",
              color: "white",
              fontWeight: 600,
              px: 2,
              '&:hover': {
                backgroundColor: "#2563eb"
              },
              '&:disabled': {
                backgroundColor: "#9ca3af"
              }
            }}
            disabled={isToday}
          >
            오늘
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default React.memo(DateNavigation);