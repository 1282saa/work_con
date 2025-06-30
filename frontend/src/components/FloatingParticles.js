/**
 * 시간대별 아름다운 배경 효과 컴포넌트
 * 현재 시간에 따라 아침, 낮, 석양, 밤 분위기의 배경을 제공합니다.
 * 사용자가 원하는 테마를 직접 선택할 수도 있습니다.
 */

import React, { useEffect, useState } from "react";
import {
  Box,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import { Palette as PaletteIcon } from "@mui/icons-material";

// 모든 테마 정의
const ALL_THEMES = {
  morning: {
    name: "아침",
    emoji: "🌅",
    gradient:
      "linear-gradient(135deg, #74b9ff 0%, #0984e3 30%, #fdcb6e 70%, #ffeaa7 100%)",
    overlayGradient:
      "radial-gradient(circle at 20% 80%, rgba(253, 203, 110, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(116, 185, 255, 0.2) 0%, transparent 50%)",
    particles: ["☀️", "🌤️", "✨"],
    particleCount: 4,
    animationDuration: 20,
  },
  day: {
    name: "낮",
    emoji: "☀️",
    gradient: "linear-gradient(135deg, #74b9ff 0%, #0984e3 50%, #00b894 100%)",
    overlayGradient:
      "radial-gradient(circle at 50% 30%, rgba(116, 185, 255, 0.2) 0%, transparent 70%)",
    particles: ["☁️", "🌤️", "💙"],
    particleCount: 3,
    animationDuration: 25,
  },
  sunset: {
    name: "석양",
    emoji: "🌇",
    gradient:
      "linear-gradient(135deg, #fd79a8 0%, #fdcb6e 30%, #e17055 60%, #d63031 100%)",
    overlayGradient:
      "radial-gradient(circle at 70% 70%, rgba(253, 121, 168, 0.4) 0%, transparent 50%), radial-gradient(circle at 30% 30%, rgba(253, 203, 110, 0.3) 0%, transparent 50%)",
    particles: ["🌅", "🧡", "💛"],
    particleCount: 5,
    animationDuration: 18,
  },
  night: {
    name: "밤",
    emoji: "🌙",
    gradient:
      "linear-gradient(135deg, #2d3436 0%, #636e72 30%, #74b9ff 70%, #a29bfe 100%)",
    overlayGradient:
      "radial-gradient(circle at 80% 20%, rgba(162, 155, 254, 0.3) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(116, 185, 255, 0.2) 0%, transparent 50%)",
    particles: ["🌙", "⭐", "✨"],
    particleCount: 6,
    animationDuration: 15,
  },
};

// 시간대별 자동 테마 설정
const getTimeBasedTheme = () => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 10) {
    return ALL_THEMES.morning;
  } else if (hour >= 10 && hour < 17) {
    return ALL_THEMES.day;
  } else if (hour >= 17 && hour < 20) {
    return ALL_THEMES.sunset;
  } else {
    return ALL_THEMES.night;
  }
};

// 개별 파티클 컴포넌트 (매우 은은하게)
const SoftParticle = ({ emoji, delay, duration, startX, amplitude }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <Box
      sx={{
        position: "fixed",
        fontSize: "20px",
        opacity: isVisible ? 0.3 : 0, // 매우 투명하게
        left: `${startX}%`,
        top: "-30px",
        pointerEvents: "none",
        zIndex: 500, // 더 낮은 z-index
        animation: isVisible
          ? `gentleFloat ${duration}s ease-in-out infinite`
          : "none",
        animationDelay: `${delay}ms`,
        "@keyframes gentleFloat": {
          "0%": {
            transform: `translateY(-30px) translateX(0px) rotate(0deg)`,
            opacity: 0,
          },
          "20%": {
            opacity: 0.3,
          },
          "80%": {
            opacity: 0.3,
          },
          "100%": {
            transform: `translateY(100vh) translateX(${amplitude}px) rotate(180deg)`,
            opacity: 0,
          },
        },
      }}
    >
      {emoji}
    </Box>
  );
};

const TimeBasedBackground = ({ isActive = true }) => {
  const [currentTheme, setCurrentTheme] = useState(getTimeBasedTheme());
  const [particles, setParticles] = useState([]);
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [menuAnchor, setMenuAnchor] = useState(null);

  // 매 분마다 테마 업데이트 (자동 모드일 때만)
  useEffect(() => {
    if (!isAutoMode) return;

    const updateTheme = () => {
      setCurrentTheme(getTimeBasedTheme());
    };

    const interval = setInterval(updateTheme, 60000); // 1분마다
    return () => clearInterval(interval);
  }, [isAutoMode]);

  // 파티클 관리
  useEffect(() => {
    if (!isActive) {
      setParticles([]);
      return;
    }

    const createParticle = () => ({
      id: Date.now() + Math.random(),
      emoji:
        currentTheme.particles[
          Math.floor(Math.random() * currentTheme.particles.length)
        ],
      delay: Math.random() * 5000,
      duration: currentTheme.animationDuration + Math.random() * 10,
      startX: Math.random() * 100,
      amplitude: (Math.random() - 0.5) * 30,
    });

    // 초기 파티클
    const initialParticles = Array.from(
      { length: Math.max(1, currentTheme.particleCount - 2) },
      createParticle
    );
    setParticles(initialParticles);

    // 새 파티클 추가 (매우 드물게)
    const interval = setInterval(() => {
      setParticles((prev) => {
        const now = Date.now();
        const filtered = prev.filter((p) => now - p.id < 30000);

        if (Math.random() > 0.7) {
          // 30% 확률로만 추가
          const newParticle = createParticle();
          return [...filtered, newParticle];
        }
        return filtered;
      });
    }, 8000); // 8초마다 체크

    return () => {
      clearInterval(interval);
      setParticles([]);
    };
  }, [isActive, currentTheme]);

  // 테마 선택 핸들러
  const handleThemeSelect = (themeKey) => {
    setCurrentTheme(ALL_THEMES[themeKey]);
    setIsAutoMode(themeKey === "auto");
    setMenuAnchor(null);
  };

  // 메뉴 열기/닫기
  const handleMenuOpen = (event) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  if (!isActive) return null;

  return (
    <>
      {/* 메인 배경 그라데이션 */}
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: currentTheme.gradient,
          opacity: 0.08, // 3%에서 8%로 증가
          pointerEvents: "none",
          zIndex: -2,
          transition: "all 3s ease-in-out",
        }}
      />

      {/* 추가 오버레이 효과 */}
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: currentTheme.overlayGradient,
          opacity: 1,
          pointerEvents: "none",
          zIndex: -1,
          transition: "all 3s ease-in-out",
        }}
      />

      {/* 시간 정보 표시 (상단 중앙) */}
      <Box
        sx={{
          position: "fixed",
          top: 20,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
          background: "rgba(255, 255, 255, 0.95)",
          borderRadius: "25px",
          padding: "12px 20px",
          backdropFilter: "blur(15px)",
          border: "1px solid rgba(255, 255, 255, 0.4)",
          fontSize: "14px",
          fontWeight: "600",
          color: "#374151",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
          transition: "all 0.3s ease",
          "&:hover": {
            transform: "translateX(-50%) translateY(-2px)",
            boxShadow: "0 12px 40px rgba(0, 0, 0, 0.15)",
          },
        }}
      >
        <span style={{ fontSize: "18px" }}>{currentTheme.emoji}</span>
        <span style={{ fontWeight: "700" }}>{currentTheme.name}</span>
        {!isAutoMode && (
          <Typography
            variant="caption"
            sx={{
              background: "linear-gradient(45deg, #667eea, #764ba2)",
              color: "white",
              px: 1,
              py: 0.5,
              borderRadius: "12px",
              fontSize: "10px",
              fontWeight: "bold",
            }}
          >
            수동
          </Typography>
        )}
        <Box
          sx={{
            width: "1px",
            height: "16px",
            background: "rgba(55, 65, 81, 0.2)",
            mx: "4px",
          }}
        />
        <span style={{ fontSize: "13px", opacity: 0.8, fontWeight: "500" }}>
          {new Date().toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>

        {/* 테마 선택 버튼 */}
        <Tooltip title="배경 테마 선택">
          <IconButton
            size="small"
            onClick={handleMenuOpen}
            sx={{
              ml: 1,
              background: "rgba(102, 126, 234, 0.1)",
              "&:hover": {
                background: "rgba(102, 126, 234, 0.2)",
              },
            }}
          >
            <PaletteIcon fontSize="small" sx={{ color: "#667eea" }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* 테마 선택 메뉴 */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: "12px",
            mt: 1,
            minWidth: "200px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
          },
        }}
      >
        <MenuItem
          onClick={() => handleThemeSelect("auto")}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            py: 1.5,
            background: isAutoMode ? "rgba(102, 126, 234, 0.1)" : "transparent",
          }}
        >
          <span style={{ fontSize: "16px" }}>🕐</span>
          <Typography
            variant="body2"
            fontWeight={isAutoMode ? "bold" : "normal"}
          >
            자동 (시간대별)
          </Typography>
        </MenuItem>
        {Object.entries(ALL_THEMES).map(([key, theme]) => (
          <MenuItem
            key={key}
            onClick={() => handleThemeSelect(key)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              py: 1.5,
              background:
                !isAutoMode && currentTheme.name === theme.name
                  ? "rgba(102, 126, 234, 0.1)"
                  : "transparent",
            }}
          >
            <span style={{ fontSize: "16px" }}>{theme.emoji}</span>
            <Typography
              variant="body2"
              fontWeight={
                !isAutoMode && currentTheme.name === theme.name
                  ? "bold"
                  : "normal"
              }
            >
              {theme.name}
            </Typography>
          </MenuItem>
        ))}
      </Menu>

      {/* 은은한 파티클들 */}
      {particles.map((particle) => (
        <SoftParticle
          key={particle.id}
          emoji={particle.emoji}
          delay={particle.delay}
          duration={particle.duration}
          startX={particle.startX}
          amplitude={particle.amplitude}
        />
      ))}
    </>
  );
};

export default TimeBasedBackground;
