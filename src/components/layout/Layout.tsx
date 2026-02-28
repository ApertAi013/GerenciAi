import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import Sidebar from './Sidebar';
import Header from './Header';
import QuickEditStudentModal from '../QuickEditStudentModal';
import PaymentBlockedOverlay from '../PaymentBlockedOverlay';
import LaraChat from '../lara/LaraChat';
import { useAuthStore } from '../../store/authStore';
import '../../styles/Layout.css';

// Routes that should never show the blocked overlay
const EXEMPT_ROUTES = ['/meu-plano', '/admin/monitoring', '/preferencias'];

export default function Layout() {
  const { user } = useAuthStore();
  const location = useLocation();
  const [dismissed, setDismissed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const billingStatus = user?.billing_status;
  const isExempt = EXEMPT_ROUTES.some(r => location.pathname.startsWith(r));
  const showOverlay = !dismissed && !isExempt && user?.role === 'gestor' && billingStatus === 'blocked';

  return (
    <div className="layout">
      {isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)} />
      )}
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <Header onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
      <main className="layout-content">
        <Outlet />
      </main>
      <QuickEditStudentModal />
      {showOverlay && (
        <PaymentBlockedOverlay
          billingStatus={billingStatus!}
          onDismiss={() => setDismissed(true)}
        />
      )}
      <LaraChat />
    </div>
  );
}
