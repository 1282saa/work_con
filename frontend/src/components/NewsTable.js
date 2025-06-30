/**
 * 뉴스 데이터 표시 테이블 컴포넌트
 * 뉴스 목록을 표 형식으로 보여주고 상태 관리 기능을 제공합니다.
 */

import React, { useState } from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Collapse,
  Box,
  Typography,
  Tooltip,
  Link,
  TextField,
  InputAdornment,
} from "@mui/material";
import {
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Launch as LaunchIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import StatusBadge from "./StatusBadge";

// 뉴스 아이템 행 컴포넌트 (확장 가능)
const NewsRow = ({ news, onStatusChange }) => {
  const [expanded, setExpanded] = useState(false);

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return format(date, "yyyy-MM-dd HH:mm");
    } catch (e) {
      return dateString || "-";
    }
  };

  // 내용 길이 제한
  const truncateText = (text, maxLength = 100) => {
    if (!text) return "-";
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  return (
    <>
      <TableRow
        sx={{
          "&:hover": {
            backgroundColor: "#f5f5f5",
          },
          height: "48px",
        }}
      >
        <TableCell>
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell
          sx={{
            maxWidth: 300,
            whiteSpace: "normal",
            wordBreak: "break-word",
            padding: "8px 16px",
            fontSize: "0.875rem",
          }}
        >
          {news.title || "(제목 없음)"}
        </TableCell>
        <TableCell sx={{ padding: "8px 16px" }}>
          {formatDate(news.dateline || news.published_at)}
        </TableCell>
        <TableCell sx={{ padding: "8px 16px" }}>
          <StatusBadge
            status={news.status || "미진행"}
            newsId={news.news_id}
            onStatusChange={onStatusChange}
          />
        </TableCell>
        <TableCell align="right" sx={{ padding: "8px 16px" }}>
          {news.provider_link_page && (
            <Tooltip title="원문 보기">
              <IconButton
                size="small"
                component={Link}
                href={news.provider_link_page}
                target="_blank"
                rel="noopener noreferrer"
              >
                <LaunchIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </TableCell>
      </TableRow>

      {/* 상세 내용 영역 */}
      <TableRow>
        <TableCell colSpan={5} style={{ paddingTop: 0, paddingBottom: 0 }}>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ py: 3, px: 2 }}>
              <Typography variant="h6" gutterBottom>
                {news.title}
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  mb: 1,
                  color: "text.secondary",
                  fontSize: "0.875rem",
                }}
              >
                <Box sx={{ mr: 3 }}>
                  <strong>작성자:</strong> {news.byline || "정보 없음"}
                </Box>
                <Box>
                  <strong>등록일:</strong>{" "}
                  {formatDate(news.dateline || news.published_at)}
                </Box>
              </Box>

              <Typography
                variant="body2"
                paragraph
                sx={{ whiteSpace: "pre-line", my: 2 }}
              >
                {news.content || "내용이 없습니다."}
              </Typography>

              {news.provider_link_page && (
                <Link
                  href={news.provider_link_page}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                >
                  원문 보기 <LaunchIcon fontSize="small" />
                </Link>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

// 메인 뉴스 테이블 컴포넌트
const NewsTable = ({ newsData, onStatusChange }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(30);
  const [searchTerm, setSearchTerm] = useState("");

  // 페이지 변경 핸들러
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // 페이지당 행 수 변경 핸들러
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 검색어 입력 핸들러
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(0); // 검색 시 첫 페이지로 이동
  };

  // 검색 필터링
  const filteredNews = searchTerm
    ? newsData.filter(
        (news) =>
          (news.title &&
            news.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (news.content &&
            news.content.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : newsData;

  // 현재 페이지에 표시할 뉴스 데이터
  const paginatedNews = filteredNews.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Paper
      elevation={0}
      sx={{
        overflow: "hidden",
        borderRadius: 2,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      <Box sx={{ p: 2, borderBottom: "1px solid #e0e0e0" }}>
        <TextField
          placeholder="뉴스 제목 또는 내용 검색..."
          variant="outlined"
          size="small"
          fullWidth
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ height: "48px" }}>
              <TableCell
                sx={{
                  width: "40px",
                  padding: "8px 16px",
                  fontSize: "0.875rem",
                  fontWeight: "bold",
                }}
              ></TableCell>
              <TableCell
                sx={{
                  padding: "8px 16px",
                  fontSize: "0.875rem",
                  fontWeight: "bold",
                }}
              >
                제목
              </TableCell>
              <TableCell
                sx={{
                  width: "180px",
                  padding: "8px 16px",
                  fontSize: "0.875rem",
                  fontWeight: "bold",
                }}
              >
                등록일
              </TableCell>
              <TableCell
                sx={{
                  width: "120px",
                  padding: "8px 16px",
                  fontSize: "0.875rem",
                  fontWeight: "bold",
                }}
              >
                상태
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  width: "60px",
                  padding: "8px 16px",
                  fontSize: "0.875rem",
                  fontWeight: "bold",
                }}
              >
                링크
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedNews.length > 0 ? (
              paginatedNews.map((news) => (
                <NewsRow
                  key={news.news_id}
                  news={news}
                  onStatusChange={onStatusChange}
                />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  {searchTerm
                    ? "검색 결과가 없습니다."
                    : "표시할 뉴스가 없습니다."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[10, 30, 50, 100]}
        component="div"
        count={filteredNews.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="페이지당 행 수:"
        labelDisplayedRows={({ from, to, count }) =>
          `전체 ${count}개 중 ${from}-${to}`
        }
      />
    </Paper>
  );
};

export default NewsTable;
