/**
 * 외부 웹사이트를 임베딩하여 표시하는 컴포넌트
 */

import React from "react";
import { Paper, Typography, Box } from "@mui/material";

const EmbeddedPage = ({ src, title }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        height: "calc(100vh - 200px)", // 헤더와 탭 높이를 제외한 전체 높이
        display: "flex",
        flexDirection: "column",
        borderRadius: 2,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        overflow: "hidden", // iframe 스크롤을 내부에서 처리하도록
      }}
    >
      <Box
        sx={{
          p: 2,
          borderBottom: "1px solid #e0e0e0",
          backgroundColor: "#fafafa",
        }}
      >
        <Typography variant="h6" component="h2" sx={{ fontWeight: "bold" }}>
          {title}
        </Typography>
      </Box>
      <iframe
        src={src}
        title={title}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
        }}
      />
    </Paper>
  );
};

export default EmbeddedPage;
