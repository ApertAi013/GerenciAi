import { Outlet } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestion } from '@fortawesome/free-solid-svg-icons';
import Sidebar from './Sidebar';
import Header from './Header';
import '../../styles/Layout.css';

export default function Layout() {
  return (
    <div className="layout">
      <Sidebar />
      <Header />
      <main className="layout-content">
        <Outlet />
      </main>
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
