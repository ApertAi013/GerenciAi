import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router';
import { studentService } from '../../services/studentService';
import type { Student } from '../../types/studentTypes';

export default function RecentStudentsWidget() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecentStudents = async () => {
      try {
        const response = await studentService.getStudents({});

        if (response.status === 'success') {
          const recentStudents = response.data
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5);
          setStudents(recentStudents);
        }
      } catch (error) {
        console.error('Erro ao buscar alunos recentes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentStudents();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Hoje';
    if (diffInDays === 1) return 'Ontem';
    if (diffInDays < 7) return `${diffInDays} dias atrás`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
        Carregando...
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '2px solid #f0f0f0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FontAwesomeIcon icon={faUserPlus} style={{ color: '#f5576c', fontSize: '20px' }} />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Alunos Recentes</h3>
        </div>
        <button
          type="button"
          onClick={() => navigate('/alunos')}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#f5576c',
            cursor: 'pointer',
            fontSize: '14px',
            padding: '4px 8px',
          }}
        >
          Ver tudo <FontAwesomeIcon icon={faArrowRight} />
        </button>
      </div>

      {students.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
          Nenhum aluno cadastrado
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {students.map((student) => (
            <div
              key={student.id}
              style={{
                padding: '12px',
                marginBottom: '8px',
                background: '#fff5f7',
                borderRadius: '8px',
                borderLeft: '3px solid #f5576c',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#ffe8ec';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#fff5f7';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
              onClick={() => navigate('/alunos')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                    {student.full_name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {student.email || student.phone || 'Sem contato'}
                  </div>
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#f5576c',
                  fontWeight: 600,
                  textAlign: 'right',
                }}>
                  {formatDate(student.created_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
