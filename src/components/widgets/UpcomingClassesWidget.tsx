import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVolleyball, faArrowRight, faClock } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router';
import { classService } from '../../services/classService';
import type { Class } from '../../types/classTypes';

interface UpcomingClass {
  class: Class;
  isToday: boolean;
  isTomorrow: boolean;
}

export default function UpcomingClassesWidget() {
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUpcomingClasses = async () => {
      try {
        const response = await classService.getClasses({ status: 'ativa' });

        if ((response as any).status === 'success' || (response as any).success === true) {
          const now = new Date();
          const today = now.getDay(); // 0 = domingo, 1 = segunda, etc.
          const tomorrow = (today + 1) % 7;

          const weekdayMap: Record<number, string> = {
            0: 'dom',
            1: 'seg',
            2: 'ter',
            3: 'qua',
            4: 'qui',
            5: 'sex',
            6: 'sab',
          };

          const todayWeekday = weekdayMap[today];
          const tomorrowWeekday = weekdayMap[tomorrow];

          // Filtrar aulas de hoje e amanhã
          const upcoming = response.data
            .filter((classItem) =>
              classItem.weekday === todayWeekday || classItem.weekday === tomorrowWeekday
            )
            .map((classItem) => ({
              class: classItem,
              isToday: classItem.weekday === todayWeekday,
              isTomorrow: classItem.weekday === tomorrowWeekday,
            }))
            .sort((a, b) => {
              // Ordenar por dia (hoje primeiro) e depois por horário
              if (a.isToday && !b.isToday) return -1;
              if (!a.isToday && b.isToday) return 1;
              return a.class.start_time.localeCompare(b.class.start_time);
            })
            .slice(0, 5);

          setUpcomingClasses(upcoming);
        }
      } catch (error) {
        console.error('Erro ao buscar próximas aulas:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUpcomingClasses();
  }, []);

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
          <FontAwesomeIcon icon={faVolleyball} style={{ color: '#00f2fe', fontSize: '20px' }} />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Próximas Aulas</h3>
        </div>
        <button
          type="button"
          onClick={() => navigate('/agenda')}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#00f2fe',
            cursor: 'pointer',
            fontSize: '14px',
            padding: '4px 8px',
          }}
        >
          Ver tudo <FontAwesomeIcon icon={faArrowRight} />
        </button>
      </div>

      {upcomingClasses.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
          Nenhuma aula para hoje ou amanhã
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {upcomingClasses.map((item, index) => (
            <div
              key={`${item.class.id}-${index}`}
              style={{
                padding: '12px',
                marginBottom: '8px',
                background: item.isToday ? '#f0fcff' : '#f8f9fa',
                borderRadius: '8px',
                borderLeft: `3px solid ${item.isToday ? '#00f2fe' : '#4facfe'}`,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = item.isToday ? '#e0f7ff' : '#e8e9eb';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = item.isToday ? '#f0fcff' : '#f8f9fa';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
              onClick={() => navigate('/agenda')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '4px',
                  }}>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: 'white',
                      background: item.isToday ? '#00f2fe' : '#4facfe',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}>
                      {item.isToday ? 'HOJE' : 'AMANHÃ'}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>
                      {item.class.name || item.class.modality_name}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#666',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}>
                    <FontAwesomeIcon icon={faClock} style={{ fontSize: '11px' }} />
                    {item.class.start_time} {item.class.end_time && `- ${item.class.end_time}`}
                  </div>
                  {item.class.location && (
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                      📍 {item.class.location}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
