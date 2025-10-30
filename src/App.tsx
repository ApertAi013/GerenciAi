import { BrowserRouter, Route, Routes } from 'react-router'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import StudentDetails from './pages/StudentDetails'
import Classes from './pages/Classes'
import Schedule from './pages/Schedule'
import Reports from './pages/Reports'
import Chat from './pages/Chat'
import Enrollments from './pages/Enrollments'
import Financial from './pages/Financial'
import DataMigration from './pages/DataMigration'
import Levels from './pages/Levels'
import Plans from './pages/Plans'
import ProtectedRoute from './components/auth/ProtectedRoute'
import FeatureProtectedRoute from './components/auth/FeatureProtectedRoute'
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
            <Route path="/agenda" element={<Schedule />} />
            <Route path="/alunos" element={<Students />} />
            <Route path="/alunos/:id" element={<StudentDetails />} />
            <Route path="/turmas" element={<Classes />} />
            <Route path="/matriculas" element={<Enrollments />} />
            <Route path="/financeiro" element={<Financial />} />
            <Route path="/relatorios" element={<Reports />} />
            <Route path="/niveis" element={<Levels />} />
            <Route path="/planos" element={<Plans />} />
            <Route path="/chat" element={<Chat />} />
            <Route
              path="/migracao"
              element={
                <FeatureProtectedRoute featureCode="data_migration">
                  <DataMigration />
                </FeatureProtectedRoute>
              }
            />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
