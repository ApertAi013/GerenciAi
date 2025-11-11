import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faChartLine, faUserGroup, faMoneyBillWave } from '@fortawesome/free-solid-svg-icons';
import { studentService } from '../../services/studentService';
import { enrollmentService } from '../../services/enrollmentService';

export default function StatsWidget() {
  const [stats, setStats] = useState({
    activeStudents: 0,
    newStudents: 0,
    activeClasses: 0,
    monthRevenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Buscar matrículas ativas para contar alunos ativos
        const enrollmentsResponse = await enrollmentService.getEnrollments({ status: 'ativa' });

        // Extrair IDs únicos de alunos com matrículas ativas
        const uniqueStudentIds = new Set(
          enrollmentsResponse.data.map(enrollment => enrollment.student_id)
        );
        const activeStudentsCount = uniqueStudentIds.size;

        // Buscar todos os alunos para calcular novos alunos
        const allResponse = await studentService.getStudents({});

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const newStudents = allResponse.data.filter((student) => {
          const createdAt = new Date(student.created_at);
          return createdAt >= thirtyDaysAgo;
        }).length;

        setStats({
          activeStudents: activeStudentsCount,
          newStudents,
          activeClasses: 0, // TODO: Implementar
          monthRevenue: 0, // TODO: Implementar
        });
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Carregando...</div>;
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }}>
        <p style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px' }}>ALUNOS ATIVOS</p>
        <h2 style={{ fontSize: '32px', margin: '0 0 8px 0' }}>{stats.activeStudents}</h2>
        <FontAwesomeIcon icon={faUsers} style={{ fontSize: '24px', opacity: 0.5 }} />
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        color: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }}>
        <p style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px' }}>NOVOS (30 DIAS)</p>
        <h2 style={{ fontSize: '32px', margin: '0 0 8px 0' }}>{stats.newStudents}</h2>
        <FontAwesomeIcon icon={faChartLine} style={{ fontSize: '24px', opacity: 0.5 }} />
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        color: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }}>
        <p style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px' }}>TURMAS ATIVAS</p>
        <h2 style={{ fontSize: '32px', margin: '0 0 8px 0' }}>-</h2>
        <FontAwesomeIcon icon={faUserGroup} style={{ fontSize: '24px', opacity: 0.5 }} />
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        color: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }}>
        <p style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px' }}>RECEITA DO MÊS</p>
        <h2 style={{ fontSize: '32px', margin: '0 0 8px 0' }}>-</h2>
        <FontAwesomeIcon icon={faMoneyBillWave} style={{ fontSize: '24px', opacity: 0.5 }} />
      </div>
    </div>
  );
}
