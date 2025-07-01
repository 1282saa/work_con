/**
 * 최적화된 작업 현황 관리 테이블 컴포넌트
 * Excel 스프레드시트와 유사한 고밀도 인터페이스로 작업 상태를 관리합니다.
 *
 * @param {Object} props - 컴포넌트 props
 * @param {Array} props.newsData - 뉴스 데이터 배열
 * @param {Function} props.onStatusChange - 상태 변경 핸들러 함수
 * @param {Function} props.onCopySuccess - 복사 성공 콜백 함수
 * @param {Function} props.updateActivity - 사용자 활동 기록 함수
 * @returns {JSX.Element} 작업 현황 테이블 컴포넌트
 */

import React, { useState, useMemo, useCallback } from "react";
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
} from "@mui/material";
import {
  OpenInNew,
  AutoAwesome,
  SmartToy,
  ContentCopy,
} from "@mui/icons-material";
import { format } from "date-fns";

// CSS 애니메이션 추가
const pulseAnimation = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

// 상수 정의
const STATUS_COLORS = {
  미진행: "#dc2626",
  작업중: "#f59e0b",
  작업완료: "#16a34a",
};

const STATUS_ROW_COLORS = {
  미진행: "#fef2f2",
  작업중: "#fefce8",
  작업완료: "#f0fdf4",
};

const STATUS_CYCLE = ["미진행", "작업중", "작업완료"];

// 작업 진행률 계산 함수
const getProgressPercentage = (status) => {
  switch (status) {
    case "미진행":
      return 0;
    case "작업중":
      return 50;
    case "작업완료":
      return 100;
    default:
      return 0;
  }
};

// AI SEO 버튼을 생성/복사 아이콘으로 분리
const AISeoButton = ({
  status,
  onClick,
  isLoading = false,
  hasContent = false,
}) => {
  const color = STATUS_COLORS[status];

  // 항상 생성 아이콘을 표시
  return (
    <Tooltip
      title={hasContent ? "AI SEO 콘텐츠 재생성하기" : "AI SEO 콘텐츠 생성하기"}
    >
      <IconButton
        onClick={onClick}
        size="small"
        disabled={isLoading}
        sx={{
          backgroundColor: hasContent ? color : "transparent",
          color: hasContent ? "white" : color,
          border: `1px solid ${color}`,
          borderRadius: "6px",
          width: "32px",
          height: "32px",
          "&:hover": {
            backgroundColor: color,
            color: "white",
            transform: "scale(1.05)",
          },
          "&:disabled": {
            opacity: 0.7,
            cursor: "not-allowed",
          },
          transition: "all 0.2s ease",
        }}
      >
        {isLoading ? (
          <SmartToy
            sx={{
              fontSize: "14px",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
        ) : (
          <AutoAwesome sx={{ fontSize: "14px" }} />
        )}
      </IconButton>
    </Tooltip>
  );
};

// 복사 버튼 컴포넌트 추가
const CopyButton = ({ onClick, isLoading = false }) => {
  return (
    <Tooltip title="생성된 AI SEO 콘텐츠 복사하기">
      <IconButton
        onClick={onClick}
        size="small"
        disabled={isLoading}
        sx={{
          backgroundColor: "#16a34a",
          color: "white",
          border: "1px solid #16a34a",
          borderRadius: "6px",
          width: "32px",
          height: "32px",
          "&:hover": {
            backgroundColor: "#15803d",
            transform: "scale(1.05)",
          },
          "&:disabled": {
            opacity: 0.7,
            cursor: "not-allowed",
          },
          transition: "all 0.2s ease",
        }}
      >
        <ContentCopy sx={{ fontSize: "14px" }} />
      </IconButton>
    </Tooltip>
  );
};

// 유틸리티 함수들
const formatTime = (timeStr) => {
  if (!timeStr) return "00:00";

  try {
    const date = new Date(timeStr);
    return format(date, "HH:mm");
  } catch {
    return "00:00";
  }
};

const cycleStatus = (currentStatus) => {
  const currentIndex = STATUS_CYCLE.indexOf(currentStatus);
  const nextIndex = (currentIndex + 1) % STATUS_CYCLE.length;
  return STATUS_CYCLE[nextIndex];
};

// 메모이제이션된 행 컴포넌트
const TableRowMemo = React.memo(
  ({
    item,
    onTitleCopy,
    onContentCopy,
    onStatusClick,
    onOpenLink,
    onInstagramGenerate,
    onInstagramCopy,
    isLoading,
  }) => (
    <TableRow
      hover
      sx={{
        height: 36,
        backgroundColor: STATUS_ROW_COLORS[item.status],
        "&:hover": {
          backgroundColor: `${STATUS_ROW_COLORS[item.status]} !important`,
          filter: "brightness(0.95)",
        },
        borderLeft: `3px solid ${STATUS_COLORS[item.status]}`,
        // 모든 애니메이션 제거 - 순수 속도 우선
      }}
    >
      <TableCell sx={{ width: 80 }}>
        <Typography
          variant="body2"
          fontWeight="500"
          sx={{ fontSize: "0.875rem" }}
        >
          {item.time}
        </Typography>
      </TableCell>

      <TableCell>
        <Typography
          variant="body2"
          sx={{
            cursor: "pointer",
            "&:hover": { color: "primary.main", textDecoration: "underline" },
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            fontSize: "0.8rem",
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
            cursor: "pointer",
            "&:hover": { color: "text.primary", backgroundColor: "#f8fafc" },
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            fontSize: "0.75rem",
            lineHeight: 1.3,
            color: "text.secondary",
            padding: "4px",
            borderRadius: 1,
          }}
          onClick={() => onContentCopy(item)}
          title="클릭하면 본문이 클립보드에 복사됩니다"
        >
          {item.content || "본문 없음"}
        </Typography>
      </TableCell>

      <TableCell>
        <Chip
          size="small"
          label={item.status}
          onClick={() => onStatusClick(item.news_id, item.status)}
          sx={{
            backgroundColor: STATUS_COLORS[item.status],
            color: "white",
            fontWeight: "bold",
            fontSize: "0.7rem",
            cursor: "pointer",
            "&:hover": {
              opacity: 0.8,
            },
          }}
        />
      </TableCell>

      <TableCell>
        <Typography variant="body2" sx={{ fontSize: "0.75rem" }}>
          {item.provider || "-"}
        </Typography>
      </TableCell>

      <TableCell>
        <Typography
          variant="body2"
          sx={{
            fontSize: "0.75rem",
            color: "text.secondary",
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {item.category || "-"}
        </Typography>
      </TableCell>

      <TableCell>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize: "0.75rem" }}
        >
          {item.byline || "-"}
        </Typography>
      </TableCell>

      <TableCell>
        <Tooltip title="원문 보기">
          <IconButton
            size="small"
            onClick={() => onOpenLink(item.provider_link_page)}
            sx={{ padding: "4px" }}
          >
            <OpenInNew sx={{ fontSize: "16px" }} />
          </IconButton>
        </Tooltip>
      </TableCell>

      <TableCell>
        <Tooltip title="AI SEO 콘텐츠 생성/복사">
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <AISeoButton
              status={item.status}
              onClick={() => onInstagramGenerate(item)}
              isLoading={isLoading}
              hasContent={item.ai_content ? true : false}
            />
            {item.ai_content && (
              <CopyButton
                onClick={() => onInstagramCopy(item)}
                isLoading={isLoading}
              />
            )}
          </Box>
        </Tooltip>
      </TableCell>
    </TableRow>
  )
);

TableRowMemo.displayName = "TableRowMemo";

const WorkStatusTable = ({
  newsData,
  onStatusChange,
  onCopySuccess,
  updateActivity,
}) => {
  const [sortBy, setSortBy] = useState("time");
  const [sortOrder, setSortOrder] = useState("desc");
  const [loadingItems, setLoadingItems] = useState(new Set());

  // 뉴스 데이터를 작업 아이템으로 변환 및 정렬
  const workItems = useMemo(() => {
    if (!newsData || !Array.isArray(newsData)) return [];

    const items = newsData.map((article) => ({
      ...article,
      status: article.status || "미진행",
      time: formatTime(article.dateline || article.published_at),
    }));

    // 정렬 적용
    return items.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "time":
          comparison = a.time.localeCompare(b.time);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        default:
          comparison = 0;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [newsData, sortBy, sortOrder]);

  // 이벤트 핸들러들 (useCallback으로 최적화)
  const handleStatusClick = useCallback(
    async (newsId, currentStatus) => {
      const newStatus = cycleStatus(currentStatus);
      if (onStatusChange) {
        await onStatusChange(newsId, newStatus);
      }
    },
    [onStatusChange]
  );

  const handleTitleCopy = useCallback(
    async (article) => {
      try {
        await navigator.clipboard.writeText(article.title);
        if (onCopySuccess) {
          onCopySuccess("제목이 클립보드에 복사되었습니다.");
        }
      } catch (err) {
        console.error("클립보드 복사 실패:", err);
      }
    },
    [onCopySuccess]
  );

  const handleContentCopy = useCallback(
    async (article) => {
      const text = `제목: ${article.title}\n\n${
        article.content || ""
      }\n\n출처: ${article.provider || ""}\n링크: ${
        article.provider_link_page || ""
      }`;
      try {
        await navigator.clipboard.writeText(text);
        if (onCopySuccess) {
          onCopySuccess("기사 내용이 클립보드에 복사되었습니다.");
        }
      } catch (err) {
        console.error("클립보드 복사 실패:", err);
      }
    },
    [onCopySuccess]
  );

  const handleSort = useCallback(
    (field) => {
      if (sortBy === field) {
        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
      } else {
        setSortBy(field);
        setSortOrder(field === "time" ? "desc" : "asc");
      }
    },
    [sortBy, sortOrder]
  );

  const handleOpenLink = useCallback((url) => {
    if (url) {
      window.open(url, "_blank");
    }
  }, []);

  const handleInstagramGenerate = useCallback(
    async (article) => {
      if (loadingItems.has(article.news_id)) return;

      // 사용자 활동 기록 (자동 새로고침을 위해)
      if (updateActivity) {
        updateActivity();
      }

      // 새로운 콘텐츠 생성 (이미 있어도 재생성)
      try {
        setLoadingItems(new Set([...loadingItems, article.news_id]));

        const response = await fetch("/api/generate/instagram", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            news_id: article.news_id,
            title: article.title,
            content: article.content || "",
            category: article.category || "",
          }),
        });

        const result = await response.json();

        if (result.success) {
          // 통합된 콘텐츠를 그대로 클립보드에 복사
          const instagramContent = result.data.content;

          await navigator.clipboard.writeText(instagramContent);

          if (onCopySuccess) {
            const message = result.data.cached
              ? "저장된 AI SEO 콘텐츠가 클립보드에 복사되었습니다!"
              : "새로 생성된 AI SEO 콘텐츠가 클립보드에 복사되었습니다!";
            onCopySuccess(message);
          }
        } else {
          if (onCopySuccess) {
            onCopySuccess(`콘텐츠 생성 실패: ${result.message}`);
          }
        }
      } catch (error) {
        console.error("AI SEO 콘텐츠 생성 오류:", error);
        if (onCopySuccess) {
          onCopySuccess("콘텐츠 생성 중 오류가 발생했습니다.");
        }
      } finally {
        setLoadingItems(
          new Set([...loadingItems].filter((id) => id !== article.news_id))
        );
      }
    },
    [loadingItems, onCopySuccess, updateActivity]
  );

  const handleInstagramCopy = useCallback(
    async (article) => {
      if (!article.ai_content) {
        if (onCopySuccess) {
          onCopySuccess("생성된 콘텐츠가 없습니다.");
        }
        return;
      }

      // 사용자 활동 기록
      if (updateActivity) {
        updateActivity();
      }

      try {
        await navigator.clipboard.writeText(article.ai_content);
        if (onCopySuccess) {
          onCopySuccess("AI SEO 콘텐츠가 클립보드에 복사되었습니다!");
        }
      } catch (error) {
        console.error("클립보드 복사 실패:", error);
        if (onCopySuccess) {
          onCopySuccess("클립보드 복사 중 오류가 발생했습니다.");
        }
      }
    },
    [onCopySuccess, updateActivity]
  );

  // 데이터가 없는 경우
  if (!newsData || newsData.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">
          작업할 기사가 없습니다.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* CSS 애니메이션 스타일 */}
      <style>{pulseAnimation}</style>

      {/* 작업 테이블 */}
      <TableContainer
        component={Paper}
        sx={{
          maxHeight: "75vh",
          border: "1px solid #e2e8f0",
          borderRadius: 2,
          backgroundColor: "white",
        }}
      >
        <Table
          stickyHeader
          size="small"
          sx={{
            "& .MuiTableCell-root": {
              padding: "4px 8px",
              borderBottom: "1px solid #f1f5f9",
              fontSize: "0.75rem",
            },
          }}
        >
          <TableHead>
            <TableRow
              sx={{
                backgroundColor: "#f8fafc",
                "& .MuiTableCell-head": {
                  backgroundColor: "#f8fafc",
                  borderBottom: "2px solid #e2e8f0",
                  fontWeight: 600,
                  color: "#374151",
                },
              }}
            >
              <TableCell sx={{ width: 80 }}>
                <TableSortLabel
                  active={sortBy === "time"}
                  direction={sortBy === "time" ? sortOrder : "desc"}
                  onClick={() => handleSort("time")}
                  size="small"
                >
                  <Typography variant="caption" fontWeight="bold">
                    시간
                  </Typography>
                </TableSortLabel>
              </TableCell>

              <TableCell sx={{ width: "35%" }}>
                <Typography variant="caption" fontWeight="bold">
                  제목
                </Typography>
              </TableCell>

              <TableCell sx={{ width: "25%" }}>
                <Typography variant="caption" fontWeight="bold">
                  본문
                </Typography>
              </TableCell>

              <TableCell sx={{ width: 100 }}>
                <TableSortLabel
                  active={sortBy === "status"}
                  direction={sortBy === "status" ? sortOrder : "asc"}
                  onClick={() => handleSort("status")}
                  size="small"
                >
                  <Typography variant="caption" fontWeight="bold">
                    상태
                  </Typography>
                </TableSortLabel>
              </TableCell>

              <TableCell sx={{ width: 80 }}>
                <Typography variant="caption" fontWeight="bold">
                  언론사
                </Typography>
              </TableCell>

              <TableCell sx={{ width: 100 }}>
                <Typography variant="caption" fontWeight="bold">
                  카테고리
                </Typography>
              </TableCell>

              <TableCell sx={{ width: 90 }}>
                <Typography variant="caption" fontWeight="bold">
                  기자
                </Typography>
              </TableCell>

              <TableCell sx={{ width: 60 }}>
                <Typography variant="caption" fontWeight="bold">
                  액션
                </Typography>
              </TableCell>

              <TableCell sx={{ width: 100 }}>AI SEO</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {workItems.map((item) => (
              <TableRowMemo
                key={item.news_id}
                item={item}
                onTitleCopy={handleTitleCopy}
                onContentCopy={handleContentCopy}
                onStatusClick={handleStatusClick}
                onOpenLink={handleOpenLink}
                onInstagramGenerate={handleInstagramGenerate}
                onInstagramCopy={handleInstagramCopy}
                isLoading={loadingItems.has(item.news_id)}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default WorkStatusTable;
