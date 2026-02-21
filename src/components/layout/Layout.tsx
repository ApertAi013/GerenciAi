import { useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestion } from '@fortawesome/free-solid-svg-icons';
import Sidebar from './Sidebar';
import Header from './Header';
import QuickEditStudentModal from '../QuickEditStudentModal';
import PaymentBlockedOverlay from '../PaymentBlockedOverlay';
import { useAuthStore } from '../../store/authStore';
import '../../styles/Layout.css';

// Routes that should never show the blocked overlay
const EXEMPT_ROUTES = ['/meu-plano', '/admin/monitoring', '/preferencias'];

export default function Layout() {
  const { user } = useAuthStore();
  const location = useLocation();
  const [dismissed, setDismissed] = useState(false);

  const billingStatus = user?.billing_status;
  const isExempt = EXEMPT_ROUTES.some(r => location.pathname.startsWith(r));
  const showOverlay = !dismissed && !isExempt && user?.role === 'gestor' && billingStatus === 'blocked';

  return (
    <div className="layout">
      <Sidebar />
      <Header />
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
      <a
        href="/guia-do-sistema"
        target="_blank"
        rel="noopener noreferrer"
        className="help-fab"
        title="Guia do Sistema"
      >
        <FontAwesomeIcon icon={faQuestion} />
      </a>
    </div>
  );
}
