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
  const [showMobileBanner, setShowMobileBanner] = useState(() => {
    if (window.innerWidth > 768) return false;
    return !localStorage.getItem('mobile_banner_dismissed');
  });

  // Close mobile menu on navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const dismissMobileBanner = () => {
    setShowMobileBanner(false);
    localStorage.setItem('mobile_banner_dismissed', '1');
  };

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
      {showMobileBanner && (
        <div className="mobile-app-banner">
          <div className="mobile-app-banner-content">
            <div className="mobile-app-banner-icon">📱</div>
            <div className="mobile-app-banner-text">
              <strong>Este site foi feito para uso no computador.</strong>
              <p>Para uma melhor experiência no celular, recomendamos o uso do nosso aplicativo.</p>
            </div>
            <button className="mobile-app-banner-close" onClick={dismissMobileBanner} type="button">✕</button>
          </div>
          <div className="mobile-app-banner-actions">
            <button className="mobile-app-banner-btn" onClick={dismissMobileBanner} type="button">
              Continuar no site
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
