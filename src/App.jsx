import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Setup from './pages/Setup'
import Home from './pages/Home'
import Tasks from './pages/Tasks'
import Shopping from './pages/Shopping'
import Finance from './pages/Finance'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/setup" element={<Setup />} />
          <Route
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route path="/" element={<Home />} />
            <Route path="/tareas" element={<Tasks />} />
            <Route path="/compras" element={<Shopping />} />
            <Route path="/finanzas" element={<Finance />} />
            <Route path="/deudas" element={<Navigate to="/finanzas?tab=deudas" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
