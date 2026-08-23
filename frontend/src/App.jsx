import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import FlowchartTab from "./pages/FlowchartTab";
import LoginPage from "./pages/LoginPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Directly loads the flowchart at root / */}
        <Route path="/" element={<FlowchartTab />} />
        <Route path="/flowchart" element={<FlowchartTab />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
