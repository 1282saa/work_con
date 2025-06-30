/**
 * 통계 정보 표시 컴포넌트
 * 작업 상태별 통계 정보를 시각적으로 표현합니다.
 */

import React from "react";
import { Box, Paper, Typography } from "@mui/material";
import {
  Assignment as AssignmentIcon,
  Sync as SyncIcon,
  CheckCircle as CheckCircleIcon,
  FormatListBulleted as ListIcon,
} from "@mui/icons-material";

const StatsBar = ({ stats }) => {
  // 기본 통계 데이터
  const defaultStats = {
    미진행: 0,
    작업중: 0,
    작업완료: 0,
    전체: 0,
  };

  // 통계 데이터 병합
  const currentStats = { ...defaultStats, ...stats };

  // 상태별 아이콘 및 색상 설정
  const statCards = [
    {
      label: "전체",
      value: currentStats.전체,
      icon: <ListIcon sx={{ fontSize: 28, color: "#607d8b" }} />,
      color: "#607d8b",
    },
    {
      label: "미진행",
      value: currentStats.미진행,
      icon: <AssignmentIcon sx={{ fontSize: 28, color: "#78909c" }} />,
      color: "#78909c",
    },
    {
      label: "작업중",
      value: currentStats.작업중,
      icon: <SyncIcon sx={{ fontSize: 28, color: "#2196f3" }} />,
      color: "#2196f3",
    },
    {
      label: "작업완료",
      value: currentStats.작업완료,
      icon: <CheckCircleIcon sx={{ fontSize: 28, color: "#4caf50" }} />,
      color: "#4caf50",
    },
  ];

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 2,
        mb: 3,
      }}
    >
      {statCards.map((stat) => (
        <Paper
          key={stat.label}
          elevation={0}
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            gap: 2,
            flex: "1 0 200px",
            borderRadius: 2,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          {stat.icon}
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: "bold",
                color: stat.color,
                mb: 0.5,
              }}
            >
              {stat.value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {stat.label}
            </Typography>
          </Box>
        </Paper>
      ))}
    </Box>
  );
};

export default StatsBar;
