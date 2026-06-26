import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import AdminPanel from './pages/AdminPanel'
import EntrenadorPanel from './pages/EntrenadorPanel'
import ClientePanel from './pages/ClientePanel'
import Quiosco from './pages/Quiosco'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/entrenador" element={<EntrenadorPanel />} />
        <Route path="/cliente" element={<ClientePanel />} />
        <Route path="/quiosco" element={<Quiosco />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App