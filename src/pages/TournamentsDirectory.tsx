import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import '../styles/TournamentPublic.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://gerenciai-backend-798546007335.us-east1.run.app';

interface ArenaEntry {
  arena_id: number;
  arena_name: string;
  display_name: string;
  arena_logo: string | null;
  tournament_count: number;
  live_count: number;
}

export default function TournamentsDirectory() {
  const [arenas, setArenas] = useState<ArenaEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Torneios ao Vivo | ArenAi';
    fetchArenas();
    const iv = setInterval(fetchArenas, 30000);
    return () => clearInterval(iv);
  }, []);

  async function fetchArenas() {
    try {
      const res = await fetch(`${API_URL}/api/tournaments/public/directory`);
      const json = await res.json();
      if (json.status === 'success') setArenas(json.data || []);
    } catch {} finally { setLoading(false); }
  }

  const hasLive = arenas.some(a => a.live_count > 0);

  if (loading) {
    return (
      <div className="tp-page">
        <div className="tp-loading">
          <div className="tp-loading-spinner" />
          <span className="tp-loading-text">Carregando torneios...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="tp-page">
      <div className="tp-container">
        {/* Branding */}
        <div className="tp-branding">
          <a className="tp-brand-logo" href="https://arenai.com.br" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#F58A25" /><path d="M8 22L16 10L24 22H8Z" fill="white" opacity="0.9" /></svg>
            ArenAi
          </a>
        </div>

        {/* Hero */}
        <header style={{ textAlign: 'center', padding: '40px 0 32px' }}>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#e2e8f0', marginBottom: 8 }}>
            Torneios {hasLive && <span className="tp-live-dot" style={{ display: 'inline-block', marginLeft: 8, width: 10, height: 10 }} />}
          </h1>
          <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: 500, margin: '0 auto' }}>
            Acompanhe torneios ao vivo, veja resultados e rankings das arenas
          </p>
        </header>

        {/* Arena grid */}
        {arenas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 16, opacity: 0.4 }}>{'\uD83C\uDFC6'}</div>
            <p style={{ fontSize: '1rem', fontWeight: 600 }}>Nenhuma arena com torneios publicos</p>
            <p style={{ fontSize: '0.85rem', marginTop: 8 }}>Quando arenas criarem torneios publicos, eles aparecerão aqui.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {arenas.map(arena => (
              <div
                key={arena.arena_id}
                onClick={() => navigate(`/torneios-publicos/${arena.arena_id}`)}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 16,
                  padding: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,138,37,0.3)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
              >
                {/* Live badge */}
                {arena.live_count > 0 && (
                  <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.1)', padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, color: '#f87171' }}>
                    <span className="tp-live-dot" style={{ width: 6, height: 6 }} />
                    {arena.live_count} ao vivo
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {/* Logo */}
                  {arena.arena_logo ? (
                    <img src={arena.arena_logo} alt={arena.display_name || arena.arena_name} style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.08)' }} />
                  ) : (
                    <div style={{ width: 56, height: 56, borderRadius: 12, background: 'rgba(245,138,37,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800, color: '#F58A25' }}>
                      {(arena.display_name || arena.arena_name || 'A').substring(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#e2e8f0' }}>
                      {arena.display_name || arena.arena_name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>
                      {arena.tournament_count} torneio{arena.tournament_count !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="tp-footer">
          <p className="tp-footer-text">
            Gerenciado com{' '}
            <a className="tp-footer-link" href="https://arenai.com.br" target="_blank" rel="noopener noreferrer">ArenAi</a>
            {' '} - Sistema de gestao para arenas esportivas
          </p>
        </div>
      </div>
    </div>
  );
}
