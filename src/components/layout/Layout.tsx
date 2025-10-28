import { Outlet } from 'react-router';
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
    </div>
  );
}
