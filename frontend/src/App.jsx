import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import FlowchartTab from "./pages/FlowchartTab";
import LoginPage from "./pages/LoginPage"; // Optional: keep if you still want a standalone /login route

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Render the flowchart directly at the root URL */}
        <Route path="/" element={<FlowchartTab />} />

        {/* Explicit route for the flowchart */}
        <Route path="/flowchart" element={<FlowchartTab />} />

        {/* Login route (optional) */}
        <Route path="/login" element={<LoginPage />} />

        {/* Catch-all route to redirect any unknown URLs back to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
