import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./index.css";
import App from "./App.jsx";

// Global debug function
window.DEBUG_CREDENTIALS = () => {
  console.log("=== AVAILABLE TEST CREDENTIALS ===");
  console.log("Admin:");
  console.log("  Email: admin@attendance.com");
  console.log("  Password: admin123");
  console.log("");
  console.log("Faculty:");
  console.log("  Email: faculty@attendance.com");
  console.log("  Password: faculty123");
  console.log("===================================");
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
