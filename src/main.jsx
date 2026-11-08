import React from "react";
import { createRoot } from "react-dom/client";
import App from "./Portfolio.jsx";
import "./portfolio.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
