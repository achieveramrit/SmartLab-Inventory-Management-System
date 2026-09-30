import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./context/ThemeContext";
import "./index.css";

// Immediate theme initialization to prevent flash
const initialTheme = localStorage.getItem("smartlab_theme") || "dark";
document.documentElement.setAttribute("data-theme", initialTheme);
document.documentElement.classList.toggle("dark", initialTheme === "dark");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);