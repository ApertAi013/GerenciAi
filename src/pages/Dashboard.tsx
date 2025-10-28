import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { studentService } from '../services/studentService';
import '../styles/Dashboard.css';

interface DashboardStats {
  activeStudents: number;
  newStudents: number;
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({ activeStudents: 0, newStudents: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      // Não buscar dados se não estiver autenticado
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Buscar alunos ativos
        const activeResponse = await studentService.getStudents({ status: 'ativo' });

        // Buscar todos os alunos para calcular novos (últimos 30 dias)
        const allResponse = await studentService.getStudents({});
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Backend retorna {success, message, data: Student[]}
        const newStudents = allResponse.data.filter((student) => {
          const createdAt = new Date(student.created_at);
          return createdAt >= thirtyDaysAgo;
        }).length;

        setStats({
          activeStudents: activeResponse.data.length,
          newStudents: newStudents,
        });
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Saudação */}
      <div className="dashboard-header">
        <h1>{getGreeting()}, {user?.full_name?.split(' ')[0]}.</h1>
        <p>Aqui está um resumo do seu sistema hoje.</p>
      </div>

      {/* Cards de Métricas */}
      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">ALUNOS ATIVOS</p>
          <h2 className="stat-value">{stats.activeStudents}</h2>
          <div className="stat-icon">👥</div>
        </div>

        <div className="stat-card">
          <p className="stat-label">NOVOS ALUNOS (30 DIAS)</p>
          <h2 className="stat-value">{stats.newStudents}</h2>
          <div className="stat-icon">📈</div>
        </div>

        <div className="stat-card">
          <p className="stat-label">TURMAS ATIVAS</p>
          <h2 className="stat-value">-</h2>
          <div className="stat-icon">🏐</div>
        </div>

        <div className="stat-card">
          <p className="stat-label">RECEITA DO MÊS</p>
          <h2 className="stat-value">-</h2>
          <div className="stat-icon">💰</div>
        </div>
      </div>

      {/* Notificações */}
      <div className="notifications-card">
        <h3>NOTIFICAÇÕES</h3>
        <div className="empty-state">
          <div className="empty-icon">🔕</div>
          <p className="empty-title">Não há notificações agora</p>
          <p className="empty-subtitle">Fique atento! Suas notificações aparecerão aqui.</p>
        </div>
      </div>
    </div>
  );
}
