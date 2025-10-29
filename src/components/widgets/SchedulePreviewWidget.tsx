import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router';
import { classService } from '../../services/classService';
import type { Class } from '../../types/classTypes';

export default function SchedulePreviewWidget() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUpcomingClasses = async () => {
      try {
        const response = await classService.getClasses({ status: 'ativa' });

        if (response.success) {
          // Sort by weekday and time
          const sortedClasses = response.data
            .sort((a, b) => a.start_time.localeCompare(b.start_time))
            .slice(0, 5);
          setClasses(sortedClasses);
        }
      } catch (error) {
        console.error('Erro ao buscar turmas:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUpcomingClasses();
  }, []);

  const getWeekdayLabel = (weekday: string) => {
    const weekdays: Record<string, string> = {
      'seg': 'Segunda',
      'ter': 'Terça',
      'qua': 'Quarta',
      'qui': 'Quinta',
      'sex': 'Sexta',
      'sab': 'Sábado',
      'dom': 'Domingo',
    };
    return weekdays[weekday] || weekday;
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
          <FontAwesomeIcon icon={faCalendarDays} style={{ color: '#667eea', fontSize: '20px' }} />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Turmas Ativas</h3>
        </div>
        <button
          type="button"
          onClick={() => navigate('/agenda')}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#667eea',
            cursor: 'pointer',
            fontSize: '14px',
            padding: '4px 8px',
          }}
        >
          Ver tudo <FontAwesomeIcon icon={faArrowRight} />
        </button>
      </div>

      {classes.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
          Nenhuma turma ativa
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {classes.map((classItem) => (
            <div
              key={classItem.id}
              style={{
                padding: '12px',
                marginBottom: '8px',
                background: '#f8f9ff',
                borderRadius: '8px',
                borderLeft: '3px solid #667eea',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f0f2ff';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f8f9ff';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
              onClick={() => navigate('/agenda')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                    {classItem.name || classItem.modality_name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {classItem.start_time} {classItem.end_time && `- ${classItem.end_time}`}
                  </div>
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#667eea',
                  fontWeight: 600,
                  textAlign: 'right',
                }}>
                  {getWeekdayLabel(classItem.weekday)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
