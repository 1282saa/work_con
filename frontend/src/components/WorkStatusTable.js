/**
 * 최적화된 작업 현황 관리 테이블 컴포넌트
 * Excel 스프레드시트와 유사한 고밀도 인터페이스로 작업 상태를 관리합니다.
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {Array} props.newsData - 뉴스 데이터 배열
 * @param {Function} props.onStatusChange - 상태 변경 핸들러 함수
 * @param {Function} props.onCopySuccess - 복사 성공 콜백 함수
 * @returns {JSX.Element} 작업 현황 테이블 컴포넌트
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  MenuItem,
  Select,
  FormControl,
  Button,
  Stack,
  TableSortLabel,
  Checkbox,
} from '@mui/material';
import { OpenInNew } from '@mui/icons-material';
import { format } from 'date-fns';

// 상수 정의
const STATUS_COLORS = {
  '미진행': '#dc2626',
  '작업중': '#f59e0b',
  '작업완료': '#16a34a',
};

const STATUS_ROW_COLORS = {
  '미진행': '#fef2f2',
  '작업중': '#fefce8',
  '작업완료': '#f0fdf4',
};

const STATUS_CYCLE = ['미진행', '작업중', '작업완료'];

// 유틸리티 함수들
const formatTime = (timeStr) => {
  if (!timeStr) return '00:00';
  
  try {
    const date = new Date(timeStr);
    return format(date, 'HH:mm');
  } catch {
    return '00:00';
  }
};

const cycleStatus = (currentStatus) => {
  const currentIndex = STATUS_CYCLE.indexOf(currentStatus);
  const nextIndex = (currentIndex + 1) % STATUS_CYCLE.length;
  return STATUS_CYCLE[nextIndex];
};

// 메모이제이션된 행 컴포넌트
const TableRowMemo = React.memo(({ 
  item, 
  isSelected, 
  onSelectChange, 
  onTitleCopy, 
  onContentCopy, 
  onStatusClick,
  onOpenLink 
}) => (
  <TableRow
    hover
    selected={isSelected}
    sx={{
      height: 36,
      backgroundColor: STATUS_ROW_COLORS[item.status],
      '&:hover': { 
        backgroundColor: `${STATUS_ROW_COLORS[item.status]} !important`,
        filter: 'brightness(0.95)',
      },
      '&.Mui-selected': {
        backgroundColor: `${STATUS_ROW_COLORS[item.status]} !important`,
        filter: 'brightness(0.9)',
      },
      borderLeft: `3px solid ${STATUS_COLORS[item.status]}`,
    }}
  >
    <TableCell padding="checkbox">
      <Checkbox
        size="small"
        checked={isSelected}
        onChange={(e) => onSelectChange(item.news_id, e.target.checked)}
      />
    </TableCell>

    <TableCell sx={{ width: 80 }}>
      <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.875rem' }}>
        {item.time}
      </Typography>
    </TableCell>

    <TableCell>
      <Typography
        variant="body2"
        sx={{
          cursor: 'pointer',
          '&:hover': { color: 'primary.main', textDecoration: 'underline' },
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          fontSize: '0.8rem',
          lineHeight: 1.3,
        }}
        onClick={() => onTitleCopy(item)}
        title="클릭하면 제목이 클립보드에 복사됩니다"
      >
        {item.title}
      </Typography>
    </TableCell>

    <TableCell>
      <Typography
        variant="body2"
        sx={{
          cursor: 'pointer',
          '&:hover': { color: 'text.primary', backgroundColor: '#f8fafc' },
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          fontSize: '0.75rem',
          lineHeight: 1.3,
          color: 'text.secondary',
          padding: '4px',
          borderRadius: 1,
        }}
        onClick={() => onContentCopy(item)}
        title="클릭하면 본문이 클립보드에 복사됩니다"
      >
        {item.content || '본문 없음'}
      </Typography>
    </TableCell>

    <TableCell>
      <Chip
        size="small"
        label={item.status}
        onClick={() => onStatusClick(item.news_id, item.status)}
        sx={{
          backgroundColor: STATUS_COLORS[item.status],
          color: 'white',
          fontWeight: 'bold',
          fontSize: '0.7rem',
          cursor: 'pointer',
          '&:hover': {
            opacity: 0.8,
            transform: 'scale(1.05)',
          },
          transition: 'all 0.2s ease',
        }}
      />
    </TableCell>

    <TableCell>
      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
        {item.provider || '-'}
      </Typography>
    </TableCell>

    <TableCell>
      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
        {item.byline || '-'}
      </Typography>
    </TableCell>

    <TableCell>
      <Tooltip title="원문 보기">
        <IconButton
          size="small"
          onClick={() => onOpenLink(item.provider_link_page)}
          sx={{ padding: '4px' }}
        >
          <OpenInNew sx={{ fontSize: '16px' }} />
        </IconButton>
      </Tooltip>
    </TableCell>
  </TableRow>
));

TableRowMemo.displayName = 'TableRowMemo';

const WorkStatusTable = ({ newsData, onStatusChange, onCopySuccess }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [sortBy, setSortBy] = useState('time');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');

  // 뉴스 데이터를 작업 아이템으로 변환 및 정렬
  const workItems = useMemo(() => {
    if (!newsData || !Array.isArray(newsData)) return [];

    const items = newsData.map((article) => ({
      ...article,
      status: article.status || '미진행',
      time: formatTime(article.dateline || article.published_at),
    }));

    // 정렬 적용
    return items.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'time':
          comparison = a.time.localeCompare(b.time);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [newsData, sortBy, sortOrder]);

  // 필터링된 아이템들
  const filteredItems = useMemo(() => {
    if (filterStatus === 'all') return workItems;
    return workItems.filter(item => item.status === filterStatus);
  }, [workItems, filterStatus]);

  // 이벤트 핸들러들 (useCallback으로 최적화)
  const handleStatusClick = useCallback(async (newsId, currentStatus) => {
    const newStatus = cycleStatus(currentStatus);
    if (onStatusChange) {
      await onStatusChange(newsId, newStatus);
    }
  }, [onStatusChange]);

  const handleTitleCopy = useCallback(async (article) => {
    try {
      await navigator.clipboard.writeText(article.title);
      if (onCopySuccess) {
        onCopySuccess('제목이 클립보드에 복사되었습니다.');
      }
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
    }
  }, [onCopySuccess]);

  const handleContentCopy = useCallback(async (article) => {
    const text = `제목: ${article.title}\n\n${article.content || ''}\n\n출처: ${article.provider || ''}\n링크: ${article.provider_link_page || ''}`;
    try {
      await navigator.clipboard.writeText(text);
      if (onCopySuccess) {
        onCopySuccess('기사 내용이 클립보드에 복사되었습니다.');
      }
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
    }
  }, [onCopySuccess]);

  const handleSelectAll = useCallback((checked) => {
    setSelectedItems(checked ? filteredItems.map(item => item.news_id) : []);
  }, [filteredItems]);

  const handleSelectItem = useCallback((newsId, checked) => {
    setSelectedItems(prev => 
      checked 
        ? [...prev, newsId]
        : prev.filter(id => id !== newsId)
    );
  }, []);

  const handleSort = useCallback((field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder(field === 'time' ? 'desc' : 'asc');
    }
  }, [sortBy, sortOrder]);

  const handleOpenLink = useCallback((url) => {
    if (url) {
      window.open(url, '_blank');
    }
  }, []);

  // 데이터가 없는 경우
  if (!newsData || newsData.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          작업할 기사가 없습니다.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* 필터 헤더 */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: 'white' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControl size="small">
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                displayEmpty
                sx={{
                  backgroundColor: "#f8fafc",
                  minWidth: 140,
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: '1px solid #e2e8f0'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#cbd5e1'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#3b82f6'
                  }
                }}
              >
                <MenuItem value="all">전체 보기</MenuItem>
                <MenuItem value="미진행">미진행만</MenuItem>
                <MenuItem value="작업중">작업중만</MenuItem>
                <MenuItem value="작업완료">완료만</MenuItem>
              </Select>
            </FormControl>
            
            {selectedItems.length > 0 && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => console.log('선택된 아이템들:', selectedItems)}
                sx={{
                  borderColor: "#3b82f6",
                  color: "#3b82f6",
                  '&:hover': {
                    backgroundColor: "#eff6ff",
                    borderColor: "#2563eb"
                  }
                }}
              >
                선택 항목 일괄처리 ({selectedItems.length})
              </Button>
            )}
          </Stack>
          
          <Typography variant="body2" color="text.secondary">
            총 {filteredItems.length}건의 기사
          </Typography>
        </Stack>
      </Paper>

      {/* 작업 테이블 */}
      <TableContainer 
        component={Paper} 
        sx={{ 
          maxHeight: '75vh',
          border: '1px solid #e2e8f0',
          borderRadius: 2,
          backgroundColor: 'white'
        }}
      >
        <Table 
          stickyHeader 
          size="small" 
          sx={{ 
            '& .MuiTableCell-root': { 
              padding: '4px 8px',
              borderBottom: '1px solid #f1f5f9',
              fontSize: '0.75rem'
            } 
          }}
        >
          <TableHead>
            <TableRow sx={{ 
              backgroundColor: '#f8fafc',
              '& .MuiTableCell-head': {
                backgroundColor: '#f8fafc',
                borderBottom: '2px solid #e2e8f0',
                fontWeight: 600,
                color: '#374151'
              }
            }}>
              <TableCell padding="checkbox" sx={{ width: 42 }}>
                <Checkbox
                  size="small"
                  checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                  indeterminate={selectedItems.length > 0 && selectedItems.length < filteredItems.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </TableCell>
              
              <TableCell sx={{ width: 80 }}>
                <TableSortLabel
                  active={sortBy === 'time'}
                  direction={sortBy === 'time' ? sortOrder : 'desc'}
                  onClick={() => handleSort('time')}
                  size="small"
                >
                  <Typography variant="caption" fontWeight="bold">시간</Typography>
                </TableSortLabel>
              </TableCell>

              <TableCell sx={{ width: '35%' }}>
                <Typography variant="caption" fontWeight="bold">제목</Typography>
              </TableCell>

              <TableCell sx={{ width: '25%' }}>
                <Typography variant="caption" fontWeight="bold">본문</Typography>
              </TableCell>

              <TableCell sx={{ width: 100 }}>
                <TableSortLabel
                  active={sortBy === 'status'}
                  direction={sortBy === 'status' ? sortOrder : 'asc'}
                  onClick={() => handleSort('status')}
                  size="small"
                >
                  <Typography variant="caption" fontWeight="bold">상태</Typography>
                </TableSortLabel>
              </TableCell>

              <TableCell sx={{ width: 80 }}>
                <Typography variant="caption" fontWeight="bold">언론사</Typography>
              </TableCell>

              <TableCell sx={{ width: 90 }}>
                <Typography variant="caption" fontWeight="bold">기자</Typography>
              </TableCell>

              <TableCell sx={{ width: 60 }}>
                <Typography variant="caption" fontWeight="bold">액션</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          
          <TableBody>
            {filteredItems.map((item) => (
              <TableRowMemo
                key={item.news_id}
                item={item}
                isSelected={selectedItems.includes(item.news_id)}
                onSelectChange={handleSelectItem}
                onTitleCopy={handleTitleCopy}
                onContentCopy={handleContentCopy}
                onStatusClick={handleStatusClick}
                onOpenLink={handleOpenLink}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default WorkStatusTable;