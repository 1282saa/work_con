/**
 * React 애플리케이션 진입점
 * 앱의 최상위 컴포넌트를 DOM에 렌더링합니다.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/main.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// 성능 측정을 위한 웹 바이탈 측정
reportWebVitals();
