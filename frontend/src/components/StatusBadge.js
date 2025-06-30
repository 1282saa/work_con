/**
 * 상태 표시 배지 컴포넌트
 * 작업 상태(미진행, 작업중, 작업완료)를 시각적으로 표현합니다.
 */

import React from "react";
import { Chip } from "@mui/material";

const StatusBadge = ({ status, onStatusChange, newsId }) => {
  // 상태별 색상 및 스타일 설정
  const getStatusProps = () => {
    switch (status) {
      case "미진행":
        return {
          color: "default",
          variant: "outlined",
          sx: { borderColor: "#b0bec5", color: "#455a64" },
        };
      case "작업중":
        return {
          color: "primary",
          variant: "outlined",
          sx: { borderColor: "#2196f3", color: "#1976d2" },
        };
      case "작업완료":
        return {
          color: "success",
          variant: "filled",
          sx: { backgroundColor: "#4caf50", color: "white" },
        };
      default:
        return { color: "default", variant: "outlined" };
    }
  };

  // 상태 변경 처리
  const handleStatusClick = () => {
    let nextStatus = "미진행";
    if (status === "미진행") nextStatus = "작업중";
    else if (status === "작업중") nextStatus = "작업완료";
    else if (status === "작업완료") nextStatus = "미진행";

    if (onStatusChange) {
      onStatusChange(newsId, nextStatus);
    }
  };

  const statusProps = getStatusProps();

  return (
    <Chip
      label={status}
      size="small"
      onClick={handleStatusClick}
      {...statusProps}
      sx={{
        ...statusProps.sx,
        cursor: "pointer",
        fontWeight: 500,
        minWidth: "70px",
        "&:hover": {
          opacity: 0.9,
        },
      }}
    />
  );
};

export default StatusBadge;
