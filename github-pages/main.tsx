import React from "react";
import { createRoot } from "react-dom/client";
import MenuPage from "../app/page";
import "../app/globals.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MenuPage />
  </React.StrictMode>,
);
