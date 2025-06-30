/**
 * 프롬프트 관리 사이드바 컴포넌트
 * 사용자가 자주 사용하는 프롬프트 템플릿을 저장하고 빠르게 복사할 수 있습니다.
 */

import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Tooltip,
  Stack,
  Divider,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  ContentCopy as CopyIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  AutoAwesome as SparkleIcon,
} from "@mui/icons-material";

// 기본 프롬프트 템플릿들
const DEFAULT_PROMPTS = [
  {
    id: 1,
    title: "뉴스 요약",
    content: `다음 뉴스 기사를 간결하고 명확하게 요약해주세요:

- 핵심 내용 3줄 요약
- 주요 인물이나 기업
- 예상 영향이나 의미

기사 내용:
[여기에 기사 내용 붙여넣기]`,
    category: "요약",
  },
  {
    id: 2,
    title: "경제 분석",
    content: `다음 경제 뉴스를 분석해주세요:

1. 경제적 배경과 원인
2. 시장에 미칠 영향 분석
3. 투자자들이 주목해야 할 포인트
4. 향후 전망

기사 내용:
[여기에 기사 내용 붙여넣기]`,
    category: "분석",
  },
  {
    id: 3,
    title: "기업 분석",
    content: `다음 기업 관련 뉴스를 분석해주세요:

- 기업 현황 및 배경
- 주요 변화사항
- 경쟁사 대비 위치
- 투자 관점에서의 평가

기사 내용:
[여기에 기사 내용 붙여넣기]`,
    category: "기업",
  },
];

const PromptSidebar = ({ isOpen, onClose, onCopySuccess }) => {
  const [prompts, setPrompts] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [newPrompt, setNewPrompt] = useState({
    title: "",
    content: "",
    category: "",
  });

  // localStorage에서 프롬프트 로드
  useEffect(() => {
    const savedPrompts = localStorage.getItem("promptTemplates");
    if (savedPrompts) {
      setPrompts(JSON.parse(savedPrompts));
    } else {
      setPrompts(DEFAULT_PROMPTS);
      localStorage.setItem("promptTemplates", JSON.stringify(DEFAULT_PROMPTS));
    }
  }, []);

  // localStorage에 프롬프트 저장
  const savePrompts = (updatedPrompts) => {
    setPrompts(updatedPrompts);
    localStorage.setItem("promptTemplates", JSON.stringify(updatedPrompts));
  };

  // 프롬프트 복사
  const handleCopyPrompt = async (content) => {
    try {
      await navigator.clipboard.writeText(content);
      if (onCopySuccess) {
        onCopySuccess("프롬프트가 클립보드에 복사되었습니다! 🎉");
      }
    } catch (err) {
      console.error("복사 실패:", err);
    }
  };

  // 새 프롬프트 추가
  const handleAddPrompt = () => {
    setEditingPrompt(null);
    setNewPrompt({ title: "", content: "", category: "" });
    setDialogOpen(true);
  };

  // 프롬프트 편집
  const handleEditPrompt = (prompt) => {
    setEditingPrompt(prompt);
    setNewPrompt({ ...prompt });
    setDialogOpen(true);
  };

  // 프롬프트 저장
  const handleSavePrompt = () => {
    if (!newPrompt.title || !newPrompt.content) return;

    let updatedPrompts;
    if (editingPrompt) {
      // 기존 프롬프트 수정
      updatedPrompts = prompts.map((p) =>
        p.id === editingPrompt.id ? { ...newPrompt, id: editingPrompt.id } : p
      );
    } else {
      // 새 프롬프트 추가
      const newId = Math.max(...prompts.map((p) => p.id), 0) + 1;
      updatedPrompts = [...prompts, { ...newPrompt, id: newId }];
    }

    savePrompts(updatedPrompts);
    setDialogOpen(false);
    setNewPrompt({ title: "", content: "", category: "" });
    setEditingPrompt(null);
  };

  // 프롬프트 삭제
  const handleDeletePrompt = (id) => {
    const updatedPrompts = prompts.filter((p) => p.id !== id);
    savePrompts(updatedPrompts);
  };

  // 카테고리별 그룹화
  const groupedPrompts = prompts.reduce((acc, prompt) => {
    const category = prompt.category || "기타";
    if (!acc[category]) acc[category] = [];
    acc[category].push(prompt);
    return acc;
  }, {});

  if (!isOpen) return null;

  return (
    <>
      {/* 사이드바 */}
      <Paper
        sx={{
          position: "fixed",
          right: 0,
          top: 0,
          width: 400,
          height: "100vh",
          zIndex: 1300,
          display: "flex",
          flexDirection: "column",
          borderRadius: "16px 0 0 16px",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          overflow: "hidden",
          boxShadow: "-4px 0 20px rgba(0,0,0,0.15)",
        }}
      >
        {/* 헤더 */}
        <Box sx={{ p: 3, borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <SparkleIcon sx={{ color: "#ffd700" }} />
              <Typography variant="h6" fontWeight="bold">
                프롬프트 메모장
              </Typography>
            </Stack>
            <IconButton onClick={onClose} sx={{ color: "white" }}>
              <CloseIcon />
            </IconButton>
          </Stack>
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
            자주 사용하는 프롬프트를 저장하고 빠르게 복사하세요
          </Typography>
        </Box>

        {/* 프롬프트 목록 */}
        <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
          {Object.entries(groupedPrompts).map(([category, categoryPrompts]) => (
            <Accordion
              key={category}
              defaultExpanded
              sx={{
                mb: 1,
                backgroundColor: "rgba(255,255,255,0.1)",
                "&:before": { display: "none" },
                borderRadius: "8px !important",
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: "white" }} />}
                sx={{ color: "white" }}
              >
                <Typography variant="subtitle1" fontWeight="bold">
                  {category} ({categoryPrompts.length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <Stack spacing={1}>
                  {categoryPrompts.map((prompt) => (
                    <Paper
                      key={prompt.id}
                      sx={{
                        p: 2,
                        backgroundColor: "rgba(255,255,255,0.95)",
                        borderRadius: 2,
                        color: "text.primary",
                      }}
                    >
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="start"
                        mb={1}
                      >
                        <Typography
                          variant="subtitle2"
                          fontWeight="bold"
                          sx={{ flex: 1 }}
                        >
                          {prompt.title}
                        </Typography>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="복사">
                            <IconButton
                              size="small"
                              onClick={() => handleCopyPrompt(prompt.content)}
                              sx={{ color: "primary.main" }}
                            >
                              <CopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="편집">
                            <IconButton
                              size="small"
                              onClick={() => handleEditPrompt(prompt)}
                              sx={{ color: "warning.main" }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="삭제">
                            <IconButton
                              size="small"
                              onClick={() => handleDeletePrompt(prompt.id)}
                              sx={{ color: "error.main" }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Stack>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: "0.75rem",
                          lineHeight: 1.4,
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {prompt.content}
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>

        {/* 새 프롬프트 추가 버튼 */}
        <Fab
          color="primary"
          onClick={handleAddPrompt}
          sx={{
            position: "absolute",
            bottom: 20,
            right: 20,
            background: "linear-gradient(45deg, #ff6b6b, #feca57)",
            "&:hover": {
              background: "linear-gradient(45deg, #ff5252, #ffc107)",
            },
          }}
        >
          <AddIcon />
        </Fab>
      </Paper>

      {/* 프롬프트 추가/편집 다이얼로그 */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, minHeight: "500px" },
        }}
      >
        <DialogTitle
          sx={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <SparkleIcon />
            <Typography variant="h6">
              {editingPrompt ? "프롬프트 편집" : "새 프롬프트 추가"}
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="프롬프트 제목"
              value={newPrompt.title}
              onChange={(e) =>
                setNewPrompt({ ...newPrompt, title: e.target.value })
              }
              fullWidth
              variant="outlined"
            />
            <TextField
              label="카테고리"
              value={newPrompt.category}
              onChange={(e) =>
                setNewPrompt({ ...newPrompt, category: e.target.value })
              }
              fullWidth
              variant="outlined"
              placeholder="예: 요약, 분석, 기업, 투자 등"
            />
            <TextField
              label="프롬프트 내용"
              value={newPrompt.content}
              onChange={(e) =>
                setNewPrompt({ ...newPrompt, content: e.target.value })
              }
              multiline
              rows={12}
              fullWidth
              variant="outlined"
              placeholder="여기에 프롬프트 내용을 입력하세요..."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDialogOpen(false)}>취소</Button>
          <Button
            onClick={handleSavePrompt}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={!newPrompt.title || !newPrompt.content}
            sx={{
              background: "linear-gradient(45deg, #667eea, #764ba2)",
              "&:hover": {
                background: "linear-gradient(45deg, #5a6fd8, #6a4190)",
              },
            }}
          >
            저장
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PromptSidebar;
