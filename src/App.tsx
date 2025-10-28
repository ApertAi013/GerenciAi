import { BrowserRouter, Route, Routes } from 'react-router'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import Classes from './pages/Classes'
import Reports from './pages/Reports'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Layout from './components/layout/Layout'

export default function App() {
  console.log('App component mounted!'); // Debug

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/alunos" element={<Students />} />
            <Route path="/turmas" element={<Classes />} />
            <Route path="/matriculas" element={<div>Em breve: Matrículas</div>} />
            <Route path="/financeiro" element={<div>Em breve: Financeiro</div>} />
            <Route path="/relatorios" element={<Reports />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
