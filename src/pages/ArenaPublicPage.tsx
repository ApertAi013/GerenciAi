import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import '../styles/TournamentPublic.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://gerenciai-backend-798546007335.us-east1.run.app';

interface Arena { id: number; name: string; display_name: string; arena_logo: string | null; }
interface Tournament {
  id: number; title: string; description?: string; image_url?: string;
  tournament_date: string; start_time?: string; tournament_end_date?: string;
  location?: string; format: string; team_size: number; status: string;
  category?: string; public_token?: string; team_count: number; pairing_mode?: string;
}
interface Ranking {
  id: number; player_name: string; tournaments_played: number; tournaments_won: number;
  matches_won: number; matches_lost: number; ranking_points: number;
}

const STATUS_LABELS: Record<string, string> = { live: 'Ao Vivo', registration: 'Inscricoes', ready: 'Em Breve', finished: 'Encerrado' };
const FORMAT_LABELS: Record<string, string> = { double_elimination: 'Dupla Eliminatoria', single_elimination: 'Eliminatoria', group_stage: 'Fase de Grupos' };

export default function ArenaPublicPage() {
  const { arenaId } = useParams<{ arenaId: string }>();
  const navigate = useNavigate();
  const [arena, setArena] = useState<Arena | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [rankingCategories, setRankingCategories] = useState<number[]>([]);
  const [rankingTeamSize, setRankingTeamSize] = useState<number>(2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'torneios' | 'ranking'>('torneios');
  const [rankingLimit, setRankingLimit] = useState(15);

  useEffect(() => {
    if (!arenaId) return;
    fetch(`${API_URL}/api/tournaments/public/arena/${arenaId}`)
      .then(r => r.json())
      .then(json => {
        if (json.status === 'success') {
          setArena(json.data.arena);
          setTournaments(json.data.tournaments || []);
          setRankings(json.data.rankings || []);
          setRankingCategories(json.data.ranking_categories || []);
          if (json.data.ranking_team_size) setRankingTeamSize(json.data.ranking_team_size);
          document.title = `${json.data.arena?.display_name || json.data.arena?.name || 'Arena'} | Torneios | ArenAi`;
        } else {
          setError(json.message || 'Arena nao encontrada');
        }
      })
      .catch(() => setError('Erro ao carregar'))
      .finally(() => setLoading(false));
  }, [arenaId]);

  // Polling for live updates
  useEffect(() => {
    if (!arenaId) return;
    const iv = setInterval(() => {
      fetch(`${API_URL}/api/tournaments/public/arena/${arenaId}?team_size=${rankingTeamSize}`)
        .then(r => r.json())
        .then(json => {
          if (json.status === 'success') {
            setTournaments(json.data.tournaments || []);
            setRankings(json.data.rankings || []);
            if (json.data.ranking_categories) setRankingCategories(json.data.ranking_categories);
          }
        }).catch(() => {});
    }, 30000);
    return () => clearInterval(iv);
  }, [arenaId, rankingTeamSize]);

  // Fetch ranking when category changes
  const handleCategoryChange = (size: number) => {
    setRankingTeamSize(size);
    setRankingLimit(15);
    fetch(`${API_URL}/api/tournaments/public/arena/${arenaId}?team_size=${size}`)
      .then(r => r.json())
      .then(json => {
        if (json.status === 'success') {
          setRankings(json.data.rankings || []);
        }
      }).catch(() => {});
  };

  if (loading) {
    return <div className="tp-page"><div className="tp-loading"><div className="tp-loading-spinner" /><span className="tp-loading-text">Carregando arena...</span></div></div>;
  }

  if (error || !arena) {
    return (
      <div className="tp-page"><div className="tp-container" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 16, opacity: 0.4 }}>{'\uD83C\uDFC6'}</div>
        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#e2e8f0' }}>Arena nao encontrada</div>
        <p style={{ color: '#64748b', marginTop: 8 }}>{error}</p>
        <button onClick={() => navigate('/torneios-publicos')} style={{ marginTop: 20, padding: '8px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#F58A25', cursor: 'pointer', fontWeight: 600 }}>
          Voltar ao diretorio
        </button>
      </div></div>
    );
  }

  const liveTournaments = tournaments.filter(t => t.status === 'live');
  const hasLive = liveTournaments.length > 0;

  return (
    <div className="tp-page">
      <div className="tp-container">
        {/* Branding */}
        <div className="tp-branding">
          <a className="tp-brand-logo" href="https://arenai.com.br" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#F58A25" /><path d="M8 22L16 10L24 22H8Z" fill="white" opacity="0.9" /></svg>
            ArenAi
          </a>
          <button onClick={() => navigate('/torneios-publicos')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '4px 12px', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem' }}>
            Todas as arenas
          </button>
        </div>

        {/* Arena header */}
        <header style={{ textAlign: 'center', padding: '32px 0 24px' }}>
          <div className="tp-arena-showcase">
            {arena.arena_logo ? (
              <img src={arena.arena_logo} alt={arena.display_name || arena.name} className="tp-arena-logo" />
            ) : (
              <div className="tp-arena-initials">
                {(arena.display_name || arena.name || 'A').substring(0, 2).toUpperCase()}
              </div>
            )}
            <div className="tp-arena-name">{arena.display_name || arena.name}</div>
          </div>

          {hasLive && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12, background: 'rgba(239,68,68,0.1)', padding: '4px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700, color: '#f87171' }}>
              <span className="tp-live-dot" style={{ width: 7, height: 7 }} />
              {liveTournaments.length} torneio{liveTournaments.length > 1 ? 's' : ''} ao vivo
            </div>
          )}
        </header>

        {/* Tabs */}
        <div className="tp-tabs">
          <button className={`tp-tab ${tab === 'torneios' ? 'active' : ''}`} onClick={() => setTab('torneios')}>
            Torneios ({tournaments.length})
          </button>
          <button className={`tp-tab ${tab === 'ranking' ? 'active' : ''}`} onClick={() => setTab('ranking')}>
            Ranking ({rankings.length})
          </button>
        </div>

        {/* Tournaments tab */}
        {tab === 'torneios' && (
          <div>
            {tournaments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                <p style={{ fontWeight: 600 }}>Nenhum torneio publico nesta arena</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
                {tournaments.map(t => (
                  <div
                    key={t.id}
                    onClick={() => t.public_token ? navigate(`/torneio/live/${t.public_token}`) : undefined}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: `1px solid ${t.status === 'live' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: 14,
                      overflow: 'hidden',
                      cursor: t.public_token ? 'pointer' : 'default',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { if (t.public_token) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,138,37,0.3)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = t.status === 'live' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'; }}
                  >
                    {/* Image */}
                    {t.image_url ? (
                      <img src={t.image_url} alt={t.title} style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: 60, background: 'linear-gradient(135deg, rgba(245,138,37,0.08), rgba(59,130,246,0.08))' }} />
                    )}

                    <div style={{ padding: '14px 16px' }}>
                      {/* Status + badges */}
                      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                        <span className={`tp-badge tp-badge-${t.status === 'live' ? 'live' : t.status === 'finished' ? 'finished' : 'upcoming'}`}>
                          {t.status === 'live' && <span className="tp-live-dot" style={{ width: 5, height: 5 }} />}
                          {STATUS_LABELS[t.status] || t.status}
                        </span>
                        <span className="tp-badge tp-badge-format" style={{ fontSize: '0.65rem' }}>
                          {FORMAT_LABELS[t.format] || t.format}
                          {t.team_size > 1 && ` ${t.team_size}x${t.team_size}`}
                        </span>
                      </div>

                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>{t.title}</div>

                      <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span>{new Date(t.tournament_date).toLocaleDateString('pt-BR')}{t.start_time ? ` as ${t.start_time}` : ''}</span>
                        {t.location && <span>{t.location}</span>}
                        <span>{t.team_count} equipes</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Ranking tab */}
        {tab === 'ranking' && (
          <div>
            {/* Category selector */}
            {rankingCategories.length > 0 && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {rankingCategories.map(size => (
                  <button
                    key={size}
                    onClick={() => handleCategoryChange(size)}
                    style={{
                      padding: '6px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                      fontWeight: 700, fontSize: '0.82rem',
                      background: rankingTeamSize === size ? '#F58A25' : 'rgba(255,255,255,0.06)',
                      color: rankingTeamSize === size ? '#fff' : '#94a3b8',
                      transition: 'all 0.2s',
                    }}
                  >
                    {size === 1 ? 'Individual' : size === 2 ? 'Duplas' : size === 3 ? 'Trios' : `${size}x${size}`}
                  </button>
                ))}
              </div>
            )}

            {rankings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                <p style={{ fontWeight: 600 }}>Nenhum ranking disponivel</p>
                <p style={{ fontSize: '0.85rem', marginTop: 8 }}>Rankings sao atualizados ao final de cada torneio</p>
              </div>
            ) : (
              <>
                {/* Top 3 Podium */}
                {rankings.length >= 3 && (
                  <div style={{ position: 'relative', overflow: 'hidden', padding: '20px 0 28px', marginBottom: 20 }}>
                    <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 12, maxWidth: 600, margin: '0 auto', padding: '0 12px' }}>
                      {/* 2nd */}
                      <div style={{ flex: 1, maxWidth: 170, animation: 'fadeInUp 0.8s 0.3s ease-out both' }}>
                        <div style={{
                          background: 'linear-gradient(180deg, rgba(148,163,184,0.15) 0%, rgba(148,163,184,0.03) 100%)',
                          border: '2px solid rgba(148,163,184,0.25)', borderRadius: 18, padding: '20px 12px 16px', textAlign: 'center',
                          position: 'relative', overflow: 'hidden',
                        }}>
                          <div style={{ position: 'absolute', top: -7, left: '50%', transform: 'translateX(-50%) rotate(45deg)', width: 14, height: 14, background: '#94a3b8', border: '2px solid #cbd5e1' }} />
                          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #94a3b8, #cbd5e1)', margin: '6px auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 900, color: '#1e293b', boxShadow: '0 0 15px rgba(148,163,184,0.3)' }}>2</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#e2e8f0', marginBottom: 2, wordBreak: 'break-word', lineHeight: 1.2 }}>{rankings[1].player_name}</div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{rankings[1].ranking_points} pts</div>
                          <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: 2 }}>{rankings[1].matches_won}V - {rankings[1].matches_lost}D</div>
                        </div>
                      </div>
                      {/* 1st */}
                      <div style={{ flex: 1, maxWidth: 190, animation: 'fadeInUp 0.8s 0.1s ease-out both' }}>
                        <div style={{
                          background: 'linear-gradient(180deg, rgba(245,158,11,0.18) 0%, rgba(59,130,246,0.08) 50%, rgba(59,130,246,0.03) 100%)',
                          border: '2px solid rgba(245,158,11,0.35)', borderRadius: 22, padding: '24px 12px 20px', textAlign: 'center',
                          position: 'relative', overflow: 'hidden',
                          boxShadow: '0 0 40px rgba(245,158,11,0.12), 0 0 60px rgba(59,130,246,0.06)',
                        }}>
                          <div style={{ position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%) rotate(45deg)', width: 18, height: 18, background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', border: '2px solid #fcd34d', boxShadow: '0 0 12px rgba(251,191,36,0.5)' }} />
                          <div style={{ position: 'absolute', bottom: -16, left: '50%', transform: 'translateX(-50%)', width: 140, height: 50, borderRadius: '50%', border: '2px solid rgba(59,130,246,0.15)', boxShadow: '0 0 20px rgba(59,130,246,0.1)', pointerEvents: 'none' }} />
                          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', margin: '8px auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 25px rgba(251,191,36,0.4)', border: '3px solid #fcd34d' }}>
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="#1e293b" stroke="none"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
                          </div>
                          <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fbbf24', marginBottom: 2, wordBreak: 'break-word', textShadow: '0 0 15px rgba(251,191,36,0.3)', lineHeight: 1.2 }}>{rankings[0].player_name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#fcd34d' }}>{rankings[0].ranking_points} pts</div>
                          <div style={{ fontSize: '0.65rem', color: '#f59e0b', marginTop: 2 }}>{rankings[0].matches_won}V - {rankings[0].matches_lost}D</div>
                        </div>
                      </div>
                      {/* 3rd */}
                      <div style={{ flex: 1, maxWidth: 170, animation: 'fadeInUp 0.8s 0.5s ease-out both' }}>
                        <div style={{
                          background: 'linear-gradient(180deg, rgba(217,119,6,0.12) 0%, rgba(217,119,6,0.03) 100%)',
                          border: '2px solid rgba(217,119,6,0.25)', borderRadius: 18, padding: '20px 12px 16px', textAlign: 'center',
                          position: 'relative', overflow: 'hidden',
                        }}>
                          <div style={{ position: 'absolute', top: -7, left: '50%', transform: 'translateX(-50%) rotate(45deg)', width: 14, height: 14, background: '#d97706', border: '2px solid #fbbf24' }} />
                          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #d97706, #b45309)', margin: '6px auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 900, color: '#fff', boxShadow: '0 0 15px rgba(217,119,6,0.3)' }}>3</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#e2e8f0', marginBottom: 2, wordBreak: 'break-word', lineHeight: 1.2 }}>{rankings[2].player_name}</div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{rankings[2].ranking_points} pts</div>
                          <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: 2 }}>{rankings[2].matches_won}V - {rankings[2].matches_lost}D</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Full ranking table (starting from 4th if podium shown) */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <th style={{ padding: '10px 8px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>#</th>
                        <th style={{ padding: '10px 8px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Nome</th>
                        <th style={{ padding: '10px 8px', textAlign: 'center', color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>T</th>
                        <th style={{ padding: '10px 8px', textAlign: 'center', color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>V</th>
                        <th style={{ padding: '10px 8px', textAlign: 'center', color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>D</th>
                        <th style={{ padding: '10px 8px', textAlign: 'right', color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankings.slice(0, rankingLimit).map((r, i) => (
                        <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '8px', fontWeight: 700, color: i < 3 ? '#F58A25' : '#94a3b8' }}>{i + 1}o</td>
                          <td style={{ padding: '8px', fontWeight: 600, color: '#e2e8f0' }}>{r.player_name || '-'}</td>
                          <td style={{ padding: '8px', textAlign: 'center', color: '#94a3b8' }}>{r.tournaments_played}</td>
                          <td style={{ padding: '8px', textAlign: 'center', color: '#10b981' }}>{r.matches_won}</td>
                          <td style={{ padding: '8px', textAlign: 'center', color: '#ef4444' }}>{r.matches_lost}</td>
                          <td style={{ padding: '8px', textAlign: 'right', fontWeight: 800, color: '#e2e8f0' }}>{r.ranking_points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {rankingLimit < rankings.length && (
                  <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <button onClick={() => setRankingLimit(l => l + 15)} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '0.82rem' }}>
                      Ver mais ({rankings.length - rankingLimit} restantes)
                    </button>
                  </div>
                )}
              </>
            )}
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
