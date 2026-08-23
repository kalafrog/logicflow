export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect root directly to flowchart */}
        <Route path="/" element={<Navigate to="/flowchart" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/flowchart" element={<FlowchartTab />} />
      </Routes>
    </BrowserRouter>
  );
}
