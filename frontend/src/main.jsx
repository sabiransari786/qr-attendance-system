import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./index.css";
import App from "./App.jsx";

const showFatalError = (message, stack) => {
  const existing = document.getElementById("app-fatal-error");
  if (existing) {
    existing.querySelector("pre").textContent = `${message}\n\n${stack || ""}`;
    return;
  }

  const overlay = document.createElement("div");
  overlay.id = "app-fatal-error";
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.zIndex = "99999";
  overlay.style.background = "#0b0f14";
  overlay.style.color = "#f8fafc";
  overlay.style.padding = "24px";
  overlay.style.fontFamily = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";
  overlay.style.fontSize = "14px";
  overlay.style.overflow = "auto";

  const title = document.createElement("div");
  title.textContent = "Frontend Error (fatal)";
  title.style.fontSize = "18px";
  title.style.fontWeight = "700";
  title.style.marginBottom = "12px";

  const hint = document.createElement("div");
  hint.textContent = "Copy this error and share it to fix the white screen.";
  hint.style.opacity = "0.8";
  hint.style.marginBottom = "12px";

  const pre = document.createElement("pre");
  pre.textContent = `${message}\n\n${stack || ""}`;
  pre.style.whiteSpace = "pre-wrap";

  overlay.appendChild(title);
  overlay.appendChild(hint);
  overlay.appendChild(pre);
  document.body.appendChild(overlay);
};

window.addEventListener("error", (event) => {
  const message = event?.message || "Unknown error";
  const stack = event?.error?.stack || "";
  showFatalError(message, stack);
});

window.addEventListener("unhandledrejection", (event) => {
  const reason = event?.reason;
  const message = reason?.message || String(reason || "Unhandled promise rejection");
  const stack = reason?.stack || "";
  showFatalError(message, stack);
});


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
