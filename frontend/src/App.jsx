import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import FlowchartTab from './pages/FlowchartTab'
import SwimlaneTab from './pages/SwimlaneTab'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/flowchart" element={<FlowchartTab />} />
        <Route path="/swimlane" element={<SwimlaneTab />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App