import { BrowserRouter, Route, Routes } from 'react-router'
import { Toaster } from 'react-hot-toast'
import Login from './pages/Login'
import LandingPage from './pages/LandingPage'
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
import Courts from './pages/Courts'
import Rentals from './pages/Rentals'
import RentalsSchedule from './pages/RentalsSchedule'
import AI from './pages/AI'
import AISettings from './pages/AISettings'
import AISuggestions from './pages/AISuggestions'
import WhatsApp from './pages/WhatsApp'
import WhatsAppConfig from './pages/WhatsAppConfig'
import WhatsAppTemplates from './pages/WhatsAppTemplates'
import WhatsAppAutomation from './pages/WhatsAppAutomation'
import WhatsAppLogs from './pages/WhatsAppLogs'
import AdminMonitoring from './pages/AdminMonitoring'
import Instructors from './pages/Instructors'
import TrialStudents from './pages/TrialStudents'
import Preferences from './pages/Preferences'
import Announcements from './pages/Announcements'
import AppPayments from './pages/AppPayments'
import MyPlan from './pages/MyPlan'
import MonthlyRenters from './pages/MonthlyRenters'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Forms from './pages/Forms'
import PublicBooking from './pages/PublicBooking'
import PublicRentalStatus from './pages/PublicRentalStatus'
import PublicRenterDashboard from './pages/PublicRenterDashboard'
import PublicTrialBooking from './pages/PublicTrialBooking'
import PublicTrialBookingStatus from './pages/PublicTrialBookingStatus'
import PublicTrialStudentDashboard from './pages/PublicTrialStudentDashboard'
import Signup from './pages/Signup'
import ApertaiPromo from './pages/ApertaiPromo'
import BillingBlocked from './pages/BillingBlocked'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Arenas from './pages/Arenas'
import Shop from './pages/Shop'
import SystemGuide from './pages/SystemGuide'
import PrivacyPolicy from './pages/PrivacyPolicy'
import Onboarding from './pages/Onboarding'
import ProtectedRoute from './components/auth/ProtectedRoute'
import FeatureProtectedRoute from './components/auth/FeatureProtectedRoute'
import Layout from './components/layout/Layout'

export default function App() {
  console.log('App component mounted!'); // Debug

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '10px',
            padding: '16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            fontFamily: 'Inter, system-ui, sans-serif',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
            style: {
              background: '#10b981',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
            style: {
              background: '#ef4444',
            },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/esqueci-senha" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/guia-do-sistema" element={<SystemGuide />} />
        <Route path="/privacidade" element={<PrivacyPolicy />} />
        <Route path="/reservar/:bookingToken" element={<PublicBooking />} />
        <Route path="/reserva/:rentalToken" element={<PublicRentalStatus />} />
        <Route path="/minhas-reservas/:accessToken" element={<PublicRenterDashboard />} />
        <Route path="/aula-experimental/:bookingToken" element={<PublicTrialBooking />} />
        <Route path="/aula-experimental/status/:bookingToken" element={<PublicTrialBookingStatus />} />
        <Route path="/aula-experimental/meus-agendamentos/:accessToken" element={<PublicTrialStudentDashboard />} />
        <Route path="/contratar" element={<Signup />} />
        <Route path="/apertai" element={<ApertaiPromo />} />
        <Route path="/billing-blocked" element={<BillingBlocked />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/agenda" element={<Schedule />} />
            <Route path="/alunos" element={<Students />} />
            <Route path="/alunos/:id" element={<StudentDetails />} />
            <Route path="/turmas" element={<Classes />} />
            <Route path="/matriculas" element={<Enrollments />} />
            <Route path="/financeiro" element={<Financial />} />
            <Route path="/relatorios" element={<Reports />} />
            <Route path="/niveis" element={<Levels />} />
            <Route path="/planos" element={<Plans />} />
            <Route path="/quadras" element={<Courts />} />
            <Route path="/locacoes" element={<Rentals />} />
            <Route path="/locacoes/agenda" element={<RentalsSchedule />} />
            <Route path="/mensalistas" element={<MonthlyRenters />} />
            <Route path="/avisos" element={<Announcements />} />
            <Route path="/formularios" element={<Forms />} />
            <Route path="/pagamentos-app" element={<AppPayments />} />
            <Route path="/lojinha" element={<Shop />} />
            <Route path="/arenas" element={<Arenas />} />
            <Route path="/meu-plano" element={<MyPlan />} />
            <Route path="/ia" element={<AI />} />
            <Route path="/ia/configuracoes" element={<AISettings />} />
            <Route path="/ia/sugestoes" element={<AISuggestions />} />
            <Route path="/whatsapp" element={<WhatsApp />} />
            <Route path="/whatsapp/config" element={<WhatsAppConfig />} />
            <Route path="/whatsapp/templates" element={<WhatsAppTemplates />} />
            <Route path="/whatsapp/automation" element={<WhatsAppAutomation />} />
            <Route path="/whatsapp/logs" element={<WhatsAppLogs />} />
            <Route path="/admin/monitoring" element={<AdminMonitoring />} />
            <Route path="/instrutores" element={<Instructors />} />
            <Route path="/alunos-experimentais" element={<TrialStudents />} />
            <Route path="/preferencias" element={<Preferences />} />
            <Route path="/perfil" element={<Profile />} />
            <Route path="/configuracoes" element={<Settings />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/migracao" element={<DataMigration />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
