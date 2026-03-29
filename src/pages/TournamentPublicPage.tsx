import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router';
import LiveMatchAnimation from '../components/LiveMatchAnimation';
import '../styles/TournamentPublic.css';

// ─── API base URL (same pattern as PublicTournamentRegistration) ───
const API_URL = import.meta.env.VITE_API_URL || 'https://gerenciai-backend-798546007335.us-east1.run.app';

// ─── Types ───
interface TournamentTeam {
  id: number;
  name: string;
  seed: number;
  status: string;
  wins: number;
  losses: number;
  total_points_scored: number;
  total_points_conceded: number;
  members?: { name: string; is_captain: boolean }[];
}

interface TournamentMatch {
  id: number;
  tournament_id: number;
  bracket_type: 'winners' | 'losers' | 'grand_final' | 'third_place' | 'group';
  round_number: number;
  position: number;
  match_number: number;
  team1_id?: number;
  team2_id?: number;
  winner_id?: number;
  loser_id?: number;
  team1_score?: number;
  team2_score?: number;
  team1_name?: string;
  team2_name?: string;
  is_bye: boolean;
  status: 'pending' | 'live' | 'completed';
  court_name?: string;
  stream_camera?: string;
  scheduled_time?: string;
  group_id?: number;
  group_name?: string;
}

interface GroupStanding {
  team_id: number;
  team_name: string;
  position: number;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  points_for: number;
  points_against: number;
  point_diff: number;
  advances: boolean;
}

interface TournamentGroup {
  id: number;
  group_name: string;
  group_number: number;
  standings: GroupStanding[];
  matches: TournamentMatch[];
}

interface PodiumEntry {
  place: number;
  team_id: number;
  team_name: string;
  wins: number;
  losses: number;
}

interface TournamentData {
  tournament: {
    id: number;
    title: string;
    description?: string;
    image_url?: string;
    tournament_date: string;
    start_time?: string;
    tournament_end_date?: string;
    location?: string;
    format: 'double_elimination' | 'single_elimination' | 'group_stage';
    team_size: number;
    status: string;
    category?: string;
    arena_name?: string;
    bracket_generated: boolean;
    third_place_match: boolean;
    num_groups?: number;
    group_stage_completed?: boolean;
    pairing_mode?: 'fixed' | 'dynamic_single' | 'dynamic_per_round';
    last_pairs_draw_at?: string | null;
    last_bracket_draw_at?: string | null;
    pairs_reveal_at?: string | null;
    live_draw_mode?: boolean;
    live_draw_data?: {
      matches: { team1_id: number; team1_name: string; team2_id: number; team2_name: string; revealed: boolean }[];
      revealed_count: number;
      bye_team?: { id: number; name: string } | null;
      bye_teams?: { id: number; name: string }[];
      byes_revealed?: boolean;
      finished: boolean;
    } | null;
  };
  teams: TournamentTeam[];
  matches: TournamentMatch[];
  live_matches: TournamentMatch[];
  podium: PodiumEntry[];
  groups?: TournamentGroup[];
  individual_players?: { id: number; player_name: string; side: 'left' | 'right' }[];
  generated_pairs?: { team_name: string; left_player: string; right_player: string }[];
  viewer_count?: number;
}

type SportCategory = 'volei' | 'futevolei' | 'futebol' | 'beach_tennis' | null;

// ─── Sport category detection ───
function detectCategory(title: string, description?: string): SportCategory {
  const text = `${title} ${description || ''}`.toLowerCase();
  if (text.match(/beach\s?t[eê]nis|bt\b/)) return 'beach_tennis';
  if (text.match(/futev[oô]lei|ftv|ftvl/)) return 'futevolei';
  if (text.match(/futebol|societ|soccer|fut\b/)) return 'futebol';
  if (text.match(/v[oô]lei|volleyball/)) return 'volei';
  return null;
}

const CATEGORY_LABELS: Record<string, string> = {
  volei: 'Volei',
  futevolei: 'Futevolei',
  futebol: 'Futebol',
  beach_tennis: 'Beach Tennis',
};

const CATEGORY_ICONS: Record<string, string> = {
  volei: '\uD83C\uDFD0',
  futevolei: '\u26BD',
  futebol: '\u26BD',
  beach_tennis: '\uD83C\uDFBE',
};

const FORMAT_LABELS: Record<string, string> = {
  double_elimination: 'Dupla Eliminatoria',
  single_elimination: 'Eliminatoria Simples',
  group_stage: 'Fase de Grupos',
};

// ─── Helper: group matches by bracket_type then round ───
function groupMatchesByBracket(matches: TournamentMatch[]) {
  const brackets: Record<string, TournamentMatch[][]> = {};

  for (const m of matches) {
    if (m.is_bye) continue;
    const bt = m.bracket_type;
    if (!brackets[bt]) brackets[bt] = [];
    const roundIdx = m.round_number - 1;
    while (brackets[bt].length <= roundIdx) brackets[bt].push([]);
    brackets[bt][roundIdx].push(m);
  }

  // Sort matches within each round by position
  for (const bt of Object.keys(brackets)) {
    for (const round of brackets[bt]) {
      round.sort((a, b) => a.position - b.position);
    }
  }

  return brackets;
}

const BRACKET_TYPE_LABELS: Record<string, string> = {
  winners: 'Vencedores',
  losers: 'Perdedores',
  grand_final: 'Grande Final',
  third_place: 'Disputa 3o Lugar',
  group: 'Fase de Grupos',
};

const BRACKET_TYPE_TAG: Record<string, string> = {
  winners: 'winners',
  losers: 'losers',
  grand_final: 'final',
  third_place: 'final',
  group: 'winners',
};

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

export default function TournamentPublicPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<TournamentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'bracket' | 'teams' | 'matches'>('overview');
  const [scoreOverlay, setScoreOverlay] = useState<{show: boolean, team: string, text: string, color: string} | null>(null);
  const prevScoresRef = useRef<Map<number, {t1: number, t2: number}>>(new Map());
  const prevLiveDrawRef = useRef(false);
  const [activeCam, setActiveCam] = useState('cam1');

  // ─── Fetch full tournament data ───
  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/tournaments/public/live/${token}?_=${Date.now()}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Torneio nao encontrado');
      }
      const json = await res.json();
      if (json.status === 'success') {
        setData(json.data);
      } else {
        throw new Error(json.message || 'Erro ao carregar torneio');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Polling for live match scores ───
  useEffect(() => {
    if (!data || !token) return;
    if (data.tournament.status === 'finished' || data.tournament.status === 'cancelled') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/api/tournaments/public/live/${token}/match`);
        if (!res.ok) return;
        const json = await res.json();
        if (json.status === 'success' && json.data) {
          const newLiveMatches: TournamentMatch[] = json.data.live_matches || [];

          // Check for score changes and trigger overlay
          const currentCategory: SportCategory = data.tournament.category as SportCategory || detectCategory(data.tournament.title, data.tournament.description);
          for (const match of newLiveMatches) {
            const prev = prevScoresRef.current.get(match.id);
            if (prev) {
              if ((match.team1_score ?? 0) > prev.t1) {
                setScoreOverlay({ show: true, team: match.team1_name || 'Time A', text: currentCategory === 'futebol' ? 'GOOOL!' : 'PONTO!', color: '#3B82F6' });
                setTimeout(() => setScoreOverlay(null), 2000);
              } else if ((match.team2_score ?? 0) > prev.t2) {
                setScoreOverlay({ show: true, team: match.team2_name || 'Time B', text: currentCategory === 'futebol' ? 'GOOOL!' : 'PONTO!', color: '#EF4444' });
                setTimeout(() => setScoreOverlay(null), 2000);
              }
            }
            prevScoresRef.current.set(match.id, { t1: match.team1_score ?? 0, t2: match.team2_score ?? 0 });
          }

          setData(prev => {
            if (!prev) return prev;
            const updatedMatches = prev.matches.map(m => {
              const updated = newLiveMatches.find(lm => lm.id === m.id);
              return updated || m;
            });
            // Also check if any matches finished / new ones started
            return {
              ...prev,
              live_matches: newLiveMatches,
              matches: updatedMatches,
              // Update tournament status if returned
              tournament: json.data.tournament_status
                ? { ...prev.tournament, status: json.data.tournament_status }
                : prev.tournament,
            };
          });

          // If a match just finished or tournament status changed, full refresh to update bracket
          const prevLiveCount = data.live_matches?.length || 0;
          const newLiveCount = newLiveMatches.length;
          if (json.data.tournament_status === 'finished' || newLiveCount < prevLiveCount) {
            fetchData();
          }
        }
      } catch {
        // Silently ignore polling errors
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [data, token, fetchData]);

  // ─── Full data polling (detect draws, bracket changes, new teams) ───
  useEffect(() => {
    if (!data || !token) return;
    if (data.tournament.status === 'finished' || data.tournament.status === 'cancelled') return;

    // Poll fast: 2s during live draw, 3s otherwise (public page should always be reactive)
    const isLiveDraw = data.tournament.live_draw_mode;
    const pollMs = isLiveDraw ? 2000 : 3000;
    const fullInterval = setInterval(() => {
      fetchData();
    }, pollMs);

    return () => clearInterval(fullInterval);
  }, [data, token, fetchData]);

  // ─── Loading state ───
  if (loading) {
    return (
      <div className="tp-page">
        <div className="tp-loading">
          <div className="tp-loading-spinner" />
          <span className="tp-loading-text">Carregando torneio...</span>
        </div>
      </div>
    );
  }

  // ─── Error state ───
  if (error || !data) {
    return (
      <div className="tp-page">
        <div className="tp-error">
          <div className="tp-error-icon">{'\uD83C\uDFC6'}</div>
          <div className="tp-error-title">Torneio nao encontrado</div>
          <div className="tp-error-msg">{error || 'O link pode estar incorreto ou o torneio nao esta mais disponivel.'}</div>
        </div>
      </div>
    );
  }

  const { tournament, teams, matches, live_matches, groups, individual_players, generated_pairs } = data;
  // Convert podium from backend format { champion, runner_up, third_place } to array
  const podiumRaw = data.podium as any;
  const podium: PodiumEntry[] = [];
  if (podiumRaw) {
    if (podiumRaw.champion) podium.push({ place: 1, team_id: podiumRaw.champion.id, team_name: podiumRaw.champion.name, wins: podiumRaw.champion.wins || 0, losses: podiumRaw.champion.losses || 0 });
    if (podiumRaw.runner_up) podium.push({ place: 2, team_id: podiumRaw.runner_up.id, team_name: podiumRaw.runner_up.name, wins: podiumRaw.runner_up.wins || 0, losses: podiumRaw.runner_up.losses || 0 });
    if (podiumRaw.third_place) podium.push({ place: 3, team_id: podiumRaw.third_place.id, team_name: podiumRaw.third_place.name, wins: podiumRaw.third_place.wins || 0, losses: podiumRaw.third_place.losses || 0 });
    // Also handle if it's already an array
    if (Array.isArray(podiumRaw)) podiumRaw.forEach((p: any) => { if (p.place) podium.push(p); });
  }
  const category: SportCategory = (tournament.category as SportCategory) || detectCategory(tournament.title, tournament.description);
  const isLive = tournament.status === 'live';
  const isFinished = tournament.status === 'finished';
  const bracketGroups = groupMatchesByBracket(matches.filter(m => m.bracket_type !== 'group'));
  const nonByeMatches = matches.filter(m => !m.is_bye);

  // Format dates
  const startDate = new Date(tournament.tournament_date).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
  const endDate = tournament.tournament_end_date
    ? new Date(tournament.tournament_end_date).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    : null;

  return (
    <div className="tp-page">
      <div className="tp-container">
        {/* Branding */}
        <div className="tp-branding">
          <a className="tp-brand-logo" href="https://arenai.com.br" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#F58A25" />
              <path d="M8 22L16 10L24 22H8Z" fill="white" opacity="0.9" />
            </svg>
            ArenAi
          </a>
          {(tournament as any).arena_id && (
            <a
              href={`/torneios-publicos/${(tournament as any).arena_id}`}
              style={{ textDecoration: 'none', color: '#F58A25', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 8, border: '1px solid rgba(245,138,37,0.2)', background: 'rgba(245,138,37,0.05)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              {tournament.arena_name || tournament.display_name || 'Torneios da Arena'}
            </a>
          )}
        </div>

        {/* Header */}
        <header className="tp-header">
          <a href={(tournament as any).arena_id ? `/torneios-publicos/${(tournament as any).arena_id}` : '#'} className="tp-arena-showcase" style={{ textDecoration: 'none', cursor: (tournament as any).arena_id ? 'pointer' : 'default' }}>
            {(tournament.arena_logo || tournament.image_url) ? (
              <img src={tournament.arena_logo || tournament.image_url} alt={tournament.display_name || tournament.arena_name || tournament.title} className="tp-arena-logo" />
            ) : (
              <div className="tp-arena-initials">
                {(tournament.display_name || tournament.arena_name || 'A').substring(0, 2).toUpperCase()}
              </div>
            )}
            <div className="tp-arena-name">{tournament.display_name || tournament.arena_name}</div>
          </a>

          <h1 className="tp-title">{tournament.title}</h1>

          <div className="tp-meta">
            <span className="tp-meta-item">
              <CalendarIcon />
              {startDate}{endDate && endDate !== startDate ? ` - ${endDate}` : ''}
              {tournament.start_time ? ` as ${tournament.start_time}` : ''}
            </span>
            {tournament.location && (
              <span className="tp-meta-item">
                <MapPinIcon />
                {tournament.location}
              </span>
            )}
            <span className="tp-meta-item">
              <UsersIcon />
              {teams.length} {tournament.team_size === 1 ? 'jogadores' : 'equipes'}
            </span>
          </div>

          <div className="tp-badges">
            {isLive && (
              <span className="tp-badge tp-badge-live">
                <span className="tp-live-dot" />
                AO VIVO
              </span>
            )}
            {isFinished && (
              <span className="tp-badge tp-badge-finished">
                ENCERRADO
              </span>
            )}
            {!isLive && !isFinished && (
              <span className="tp-badge tp-badge-upcoming">
                EM BREVE
              </span>
            )}
            {category && (
              <span className="tp-badge tp-badge-category">
                {CATEGORY_ICONS[category]} {CATEGORY_LABELS[category]}
              </span>
            )}
            <span className="tp-badge tp-badge-format">
              {FORMAT_LABELS[tournament.format] || tournament.format}
              {tournament.team_size > 1 && ` ${tournament.team_size}x${tournament.team_size}`}
            </span>
          </div>

          {tournament.description && (
            <p className="tp-description">{tournament.description}</p>
          )}

        </header>

        {/* Podium - show prominently when tournament is finished */}
        {isFinished && podium && podium.length > 0 && (
          <div style={{ margin: '0 0 24px', position: 'relative', overflow: 'hidden', padding: '40px 0 20px' }}>
            {/* Background glow */}
            <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <h2 className="tp-section-title" style={{ textAlign: 'center', marginBottom: 32 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#F58A25" stroke="none" style={{ verticalAlign: 'middle', marginRight: 8 }}><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
              Podio
            </h2>

            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 16, maxWidth: 700, margin: '0 auto', padding: '0 16px' }}>
              {/* 2nd place */}
              {podium.find(p => p.place === 2) && (() => {
                const p = podium.find(p => p.place === 2)!;
                return (
                  <div style={{ flex: 1, maxWidth: 200, animation: 'fadeInUp 0.8s 0.3s ease-out both' }}>
                    <div style={{
                      background: 'linear-gradient(180deg, rgba(148,163,184,0.15) 0%, rgba(148,163,184,0.03) 100%)',
                      border: '2px solid rgba(148,163,184,0.25)', borderRadius: 20, padding: '24px 16px 20px', textAlign: 'center',
                      position: 'relative', overflow: 'hidden',
                    }}>
                      <div style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%) rotate(45deg)', width: 16, height: 16, background: '#94a3b8', border: '2px solid #cbd5e1' }} />
                      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #94a3b8, #cbd5e1)', margin: '8px auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 900, color: '#1e293b', boxShadow: '0 0 20px rgba(148,163,184,0.3)' }}>2</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#e2e8f0', marginBottom: 4, wordBreak: 'break-word' }}>{p.team_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{p.wins}V - {p.losses}D</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Vice-Campeao</div>
                    </div>
                  </div>
                );
              })()}
              {/* 1st place */}
              {podium.find(p => p.place === 1) && (() => {
                const p = podium.find(p => p.place === 1)!;
                return (
                  <div style={{ flex: 1, maxWidth: 220, animation: 'fadeInUp 0.8s 0.1s ease-out both' }}>
                    <div style={{
                      background: 'linear-gradient(180deg, rgba(245,158,11,0.18) 0%, rgba(59,130,246,0.08) 50%, rgba(59,130,246,0.03) 100%)',
                      border: '2px solid rgba(245,158,11,0.35)', borderRadius: 24, padding: '28px 16px 24px', textAlign: 'center',
                      position: 'relative', overflow: 'hidden',
                      boxShadow: '0 0 40px rgba(245,158,11,0.15), 0 0 80px rgba(59,130,246,0.08)',
                    }}>
                      <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%) rotate(45deg)', width: 20, height: 20, background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', border: '2px solid #fcd34d', boxShadow: '0 0 15px rgba(251,191,36,0.5)' }} />
                      <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', margin: '10px auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(251,191,36,0.4)', border: '3px solid #fcd34d' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="#1e293b" stroke="none"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fbbf24', marginBottom: 4, wordBreak: 'break-word', textShadow: '0 0 20px rgba(251,191,36,0.3)' }}>{p.team_name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#fcd34d' }}>{p.wins}V - {p.losses}D</div>
                      <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: 6, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 800 }}>Campeao</div>
                    </div>
                  </div>
                );
              })()}
              {/* 3rd place */}
              {podium.find(p => p.place === 3) && (() => {
                const p = podium.find(p => p.place === 3)!;
                return (
                  <div style={{ flex: 1, maxWidth: 200, animation: 'fadeInUp 0.8s 0.5s ease-out both' }}>
                    <div style={{
                      background: 'linear-gradient(180deg, rgba(217,119,6,0.12) 0%, rgba(217,119,6,0.03) 100%)',
                      border: '2px solid rgba(217,119,6,0.25)', borderRadius: 20, padding: '24px 16px 20px', textAlign: 'center',
                      position: 'relative', overflow: 'hidden',
                    }}>
                      <div style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%) rotate(45deg)', width: 16, height: 16, background: '#d97706', border: '2px solid #fbbf24' }} />
                      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #d97706, #b45309)', margin: '8px auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 900, color: '#fff', boxShadow: '0 0 20px rgba(217,119,6,0.3)' }}>3</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#e2e8f0', marginBottom: 4, wordBreak: 'break-word' }}>{p.team_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{p.wins}V - {p.losses}D</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>3o Lugar</div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Track live draw state for transition detection */}
        {(() => {
          prevLiveDrawRef.current = !!(tournament.live_draw_mode && tournament.live_draw_data);
          return null;
        })()}

        {/* Live Draw Section — below tags, above pairing (only for confrontos, not pairs) */}
        {tournament.live_draw_mode && tournament.live_draw_data && (tournament.live_draw_data as any).type !== 'pairs' && (
          <LiveDrawSection drawData={tournament.live_draw_data} teams={teams} />
        )}

        {/* Dynamic Duo Drawing Section */}
        {tournament.pairing_mode && tournament.pairing_mode !== 'fixed' && (
          <DynamicPairingSection
            individualPlayers={individual_players || []}
            generatedPairs={generated_pairs || []}
            bracketGenerated={tournament.bracket_generated}
            pairingMode={tournament.pairing_mode}
            teamSize={tournament.team_size}
            lastPairsDrawAt={tournament.last_pairs_draw_at || null}
            lastBracketDrawAt={tournament.last_bracket_draw_at || null}
            pairsRevealAt={tournament.pairs_reveal_at || null}
            livePairsData={tournament.live_draw_data && (tournament.live_draw_data as any).type === 'pairs' ? tournament.live_draw_data as any : null}
          />
        )}

        {/* Live matches - always at top when they exist */}
        {live_matches && live_matches.length > 0 && (() => {
          const hasStream = data.stream && (data.stream.status === 'live' || data.stream.status === 'sponsor') && data.stream.urls;
          // Auto-select camera that has a match
          const effectiveCam = (hasStream && !live_matches.some(m => m.stream_camera === activeCam))
            ? (live_matches.find(m => m.stream_camera)?.stream_camera || activeCam)
            : activeCam;
          const camMatch = hasStream ? live_matches.find(m => m.stream_camera === effectiveCam) || live_matches.find(m => !m.stream_camera) : null;
          return (
            <div className="tp-live-section">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h2 className="tp-section-title" style={{ margin: 0 }}>
                  <span className="tp-live-dot" /> Ao Vivo Agora
                </h2>
                {hasStream && (
                  <a href="https://apertai.com.br" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
                    Transmitido por <span style={{ color: '#F58A25', fontWeight: 700 }}>Apertai</span>
                  </a>
                )}
              </div>
              {hasStream ? (
                <div className="tp-live-card">
                  {/* Match header above player */}
                  {camMatch && (
                    <div className="tp-live-card-header">
                      <span className="tp-live-card-badge"><span className="tp-live-dot" /> AO VIVO</span>
                      <span className="tp-live-card-info">
                        #{camMatch.match_number}
                        {camMatch.court_name ? ` - ${camMatch.court_name}` : ''}
                        {' - '}{BRACKET_TYPE_LABELS[camMatch.bracket_type] || camMatch.bracket_type}
                        {camMatch.bracket_type !== 'grand_final' && camMatch.bracket_type !== 'third_place' && ` R${camMatch.round_number}`}
                      </span>
                    </div>
                  )}
                  <HlsPlayer urls={data.stream.urls} onCameraChange={setActiveCam} initialCam={effectiveCam} />
                  {/* Score below player */}
                  {camMatch && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 16px 0' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#f87171', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span className="tp-live-dot" style={{ width: 5, height: 5 }} /> AO VIVO
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          #{camMatch.match_number}
                          {camMatch.stream_camera ? ` — ${camMatch.stream_camera.replace('cam', 'Quadra ')}` : ''}
                          {camMatch.court_name ? ` — ${camMatch.court_name}` : ''}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', padding: '0.8rem 1rem 1.2rem' }}>
                        <div style={{ flex: 1, textAlign: 'right' }}>
                          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: 4 }}>{camMatch.team1_name || 'A definir'}</div>
                          <div style={{ width: 40, height: 3, background: '#3B82F6', borderRadius: 2, marginLeft: 'auto' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                          <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#3B82F6', minWidth: 40, textAlign: 'center' }}>{camMatch.team1_score ?? 0}</span>
                          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>x</span>
                          <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#EF4444', minWidth: 40, textAlign: 'center' }}>{camMatch.team2_score ?? 0}</span>
                        </div>
                        <div style={{ flex: 1, textAlign: 'left' }}>
                          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: 4 }}>{camMatch.team2_name || 'A definir'}</div>
                          <div style={{ width: 40, height: 3, background: '#EF4444', borderRadius: 2 }} />
                        </div>
                      </div>
                    </>
                  )}
                  {!camMatch && (
                    <div style={{ padding: '16px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
                      Nenhuma partida nesta quadra
                    </div>
                  )}
                  {/* Other live matches not on this camera */}
                  {live_matches.filter(m => m.id !== camMatch?.id).map(match => (
                    <div key={match.id} style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                          Tambem ao vivo
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          #{match.match_number}{match.stream_camera ? ` — ${match.stream_camera.replace('cam', 'Quadra ')}` : ''}{match.court_name ? ` — ${match.court_name}` : ''}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                        <span style={{ flex: 1, textAlign: 'right', fontWeight: 600, color: '#fff', fontSize: '0.95rem' }}>{match.team1_name || 'A definir'}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                          <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#3B82F6' }}>{match.team1_score ?? 0}</span>
                          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)' }}>x</span>
                          <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#EF4444' }}>{match.team2_score ?? 0}</span>
                        </div>
                        <span style={{ flex: 1, textAlign: 'left', fontWeight: 600, color: '#fff', fontSize: '0.95rem' }}>{match.team2_name || 'A definir'}</span>
                      </div>
                    </div>
                  ))}
                  <SponsorBar sponsors={data.sponsors || []} />
                </div>
              ) : (
                /* No stream - show each match with animation */
                live_matches.map(match => (
                  <div key={match.id} className="tp-live-card" style={{ marginBottom: 16 }}>
                    <div className="tp-live-card-header">
                      <span className="tp-live-card-badge"><span className="tp-live-dot" /> AO VIVO</span>
                      <span className="tp-live-card-info">
                        #{match.match_number}{match.court_name ? ` - ${match.court_name}` : ''}{' - '}{BRACKET_TYPE_LABELS[match.bracket_type] || match.bracket_type}
                        {match.bracket_type !== 'grand_final' && match.bracket_type !== 'third_place' && ` R${match.round_number}`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', padding: '1.5rem 1rem' }}>
                      <div style={{ flex: 1, textAlign: 'right' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: 4 }}>{match.team1_name || 'A definir'}</div>
                        <div style={{ width: 40, height: 3, background: '#3B82F6', borderRadius: 2, marginLeft: 'auto' }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                        <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#3B82F6', minWidth: 40, textAlign: 'center' }}>{match.team1_score ?? 0}</span>
                        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>x</span>
                        <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#EF4444', minWidth: 40, textAlign: 'center' }}>{match.team2_score ?? 0}</span>
                      </div>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: 4 }}>{match.team2_name || 'A definir'}</div>
                        <div style={{ width: 40, height: 3, background: '#EF4444', borderRadius: 2 }} />
                      </div>
                    </div>
                    <LiveMatchAnimation category={category} team1Name={match.team1_name || 'Time A'} team2Name={match.team2_name || 'Time B'} team1Score={match.team1_score ?? 0} team2Score={match.team2_score ?? 0} isLive={true} teamSize={tournament.team_size} />
                  </div>
                ))
              )}
            </div>
          );
        })()}

        {/* Tabs */}
        <div className="tp-tabs">
          <button
            className={`tp-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Visao Geral
          </button>
          <button
            className={`tp-tab ${activeTab === 'bracket' ? 'active' : ''}`}
            onClick={() => setActiveTab('bracket')}
          >
            Chave
          </button>
          <button
            className={`tp-tab ${activeTab === 'teams' ? 'active' : ''}`}
            onClick={() => setActiveTab('teams')}
          >
            {tournament.team_size === 1 ? 'Jogadores' : 'Equipes'} ({teams.length})
          </button>
          <button
            className={`tp-tab ${activeTab === 'matches' ? 'active' : ''}`}
            onClick={() => setActiveTab('matches')}
          >
            Jogos ({nonByeMatches.length})
          </button>
        </div>

        {/* ─── Tab: Overview ─── */}
        {activeTab === 'overview' && (
          <div>
            {/* Groups section for group_stage format */}
            {tournament.format === 'group_stage' && groups && groups.length > 0 && (
              <>
                <h2 className="tp-section-title">Grupos</h2>
                <div className="tp-groups-grid">
                  {groups.map(group => (
                    <div key={group.id} className="tp-group-card">
                      <div className="tp-group-name">{group.group_name}</div>
                      <table className="tp-group-table">
                        <thead>
                          <tr>
                            <th style={{ width: 36 }}>#</th>
                            <th>Equipe</th>
                            <th>J</th>
                            <th>V</th>
                            <th>E</th>
                            <th>D</th>
                            <th>Pts</th>
                            <th>Saldo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.standings.map(s => (
                            <tr key={s.team_id} className={s.advances ? 'advances' : ''}>
                              <td><span className="tp-group-pos">{s.position}</span></td>
                              <td>{s.team_name}</td>
                              <td>{s.matches_played}</td>
                              <td>{s.wins}</td>
                              <td>{s.draws}</td>
                              <td>{s.losses}</td>
                              <td className="tp-group-pts">{s.points}</td>
                              <td>
                                <span className={`tp-group-diff ${s.point_diff > 0 ? 'positive' : s.point_diff < 0 ? 'negative' : 'zero'}`}>
                                  {s.point_diff > 0 ? '+' : ''}{s.point_diff}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Quick bracket preview */}
            {Object.keys(bracketGroups).length > 0 && (
              <>
                <h2 className="tp-section-title">
                  Chave {tournament.format === 'group_stage' && tournament.group_stage_completed ? '(Mata-Mata)' : ''}
                </h2>
                <BracketView bracketGroups={bracketGroups} allMatches={matches} />
              </>
            )}

            {/* Recent/upcoming matches */}
            {nonByeMatches.length > 0 && (
              <>
                <h2 className="tp-section-title">Jogos Recentes</h2>
                <div className="tp-matches-list">
                  {nonByeMatches
                    .filter(m => m.status === 'live' || m.status === 'completed')
                    .sort((a, b) => {
                      const order = { live: 0, completed: 1, pending: 2 };
                      return (order[a.status] ?? 1) - (order[b.status] ?? 1) || b.match_number - a.match_number;
                    })
                    .slice(0, 12)
                    .map(match => (
                      <MatchCard key={match.id} match={match} allMatches={matches} />
                    ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── Tab: Bracket ─── */}
        {activeTab === 'bracket' && (
          <div>
            {tournament.format === 'group_stage' && groups && groups.length > 0 && (
              <>
                <h2 className="tp-section-title">Fase de Grupos</h2>
                <div className="tp-groups-grid" style={{ marginBottom: 32 }}>
                  {groups.map(group => (
                    <div key={group.id} className="tp-group-card">
                      <div className="tp-group-name">{group.group_name}</div>
                      <table className="tp-group-table">
                        <thead>
                          <tr>
                            <th style={{ width: 36 }}>#</th>
                            <th>Equipe</th>
                            <th>J</th>
                            <th>V</th>
                            <th>E</th>
                            <th>D</th>
                            <th>Pts</th>
                            <th>Saldo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.standings.map(s => (
                            <tr key={s.team_id} className={s.advances ? 'advances' : ''}>
                              <td><span className="tp-group-pos">{s.position}</span></td>
                              <td>{s.team_name}</td>
                              <td>{s.matches_played}</td>
                              <td>{s.wins}</td>
                              <td>{s.draws}</td>
                              <td>{s.losses}</td>
                              <td className="tp-group-pts">{s.points}</td>
                              <td>
                                <span className={`tp-group-diff ${s.point_diff > 0 ? 'positive' : s.point_diff < 0 ? 'negative' : 'zero'}`}>
                                  {s.point_diff > 0 ? '+' : ''}{s.point_diff}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              </>
            )}

            {Object.keys(bracketGroups).length > 0 ? (
              <>
                {tournament.format === 'group_stage' && (
                  <h2 className="tp-section-title">Fase Eliminatoria</h2>
                )}
                <BracketView bracketGroups={bracketGroups} allMatches={matches} />
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 16, opacity: 0.4 }}>{'\uD83C\uDFC6'}</div>
                <p style={{ fontSize: '1rem', fontWeight: 600 }}>Chave ainda nao gerada</p>
                <p style={{ fontSize: '0.85rem', marginTop: 8 }}>A chave sera gerada quando o torneio comecar.</p>
              </div>
            )}
          </div>
        )}

        {/* ─── Tab: Teams ─── */}
        {activeTab === 'teams' && (
          <div>
            <div className="tp-teams-grid">
              {[...teams]
                .sort((a, b) => {
                  // Champion first, then runner_up, then third_place, then by seed
                  const statusOrder: Record<string, number> = {
                    champion: 0, runner_up: 1, third_place: 2,
                  };
                  const aOrder = statusOrder[a.status] ?? 10;
                  const bOrder = statusOrder[b.status] ?? 10;
                  if (aOrder !== bOrder) return aOrder - bOrder;
                  return a.seed - b.seed;
                })
                .map(team => {
                  const isChampion = team.status === 'champion';
                  const isRunnerUp = team.status === 'runner_up';
                  const isThird = team.status === 'third_place';
                  return (
                    <div
                      key={team.id}
                      className={`tp-team-card ${isChampion ? 'champion' : isRunnerUp ? 'runner-up' : isThird ? 'third' : ''}`}
                    >
                      <div className="tp-team-seed">{team.seed}</div>
                      <div className="tp-team-info">
                        <div className="tp-team-name">{team.name}</div>
                        <div className="tp-team-stats">
                          {team.wins}V - {team.losses}D
                          {team.total_points_scored > 0 && ` | ${team.total_points_scored} pts`}
                        </div>
                      </div>
                      {isChampion && <span className="tp-team-medal">{'\uD83E\uDD47'}</span>}
                      {isRunnerUp && <span className="tp-team-medal">{'\uD83E\uDD48'}</span>}
                      {isThird && <span className="tp-team-medal">{'\uD83E\uDD49'}</span>}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ─── Tab: Matches ─── */}
        {activeTab === 'matches' && (
          <div>
            <div className="tp-matches-list">
              {nonByeMatches
                .sort((a, b) => {
                  const order = { live: 0, pending: 1, completed: 2 };
                  return (order[a.status] ?? 1) - (order[b.status] ?? 1) || a.match_number - b.match_number;
                })
                .map(match => (
                  <MatchCard key={match.id} match={match} allMatches={matches} />
                ))}
            </div>
            {nonByeMatches.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                <p style={{ fontSize: '1rem', fontWeight: 600 }}>Nenhum jogo disponivel</p>
              </div>
            )}
          </div>
        )}

        {/* Sponsors section (always visible when sponsors exist) */}
        {data.sponsors && data.sponsors.length > 0 && (
          <div style={{ margin: '40px 0 20px' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 2 }}>Patrocinado por</span>
            </div>
            {/* Master sponsors */}
            {data.sponsors.filter((s: any) => s.is_master).map((s: any) => (
              <div key={s.id} style={{
                display: 'flex', alignItems: 'center', gap: 20, padding: '24px', marginBottom: 12,
                background: 'linear-gradient(135deg, rgba(245,138,37,0.08), rgba(245,138,37,0.02))',
                border: '1px solid rgba(245,138,37,0.15)', borderRadius: 16,
              }}>
                <img src={s.logo_url} alt={s.name} style={{ height: 80, maxWidth: 180, objectFit: 'contain', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.6rem', color: '#F58A25', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Patrocinador Master</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>{s.name}</div>
                  {s.description && <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{s.description}</div>}
                </div>
              </div>
            ))}
            {/* Regular sponsors grid */}
            {data.sponsors.filter((s: any) => !s.is_master).length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                {data.sponsors.filter((s: any) => !s.is_master).map((s: any) => (
                  <div key={s.id} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    padding: '16px 12px', background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, textAlign: 'center',
                  }}>
                    <img src={s.logo_url} alt={s.name} style={{ height: 50, maxWidth: 120, objectFit: 'contain' }} />
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', lineHeight: 1.2 }}>{s.name}</div>
                    {s.description && <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>{s.description}</div>}
                  </div>
                ))}
              </div>
            )}
            {/* Apertai branding */}
            <a href="https://apertai.com.br" target="_blank" rel="noopener noreferrer" style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', marginTop: 10,
              background: 'linear-gradient(135deg, rgba(240,79,40,0.06), rgba(255,107,53,0.02))',
              border: '1px solid rgba(240,79,40,0.12)', borderRadius: 12, textDecoration: 'none',
            }}>
              <img src="/apertai-logo.svg" alt="Apertai" style={{ height: 36, objectFit: 'contain', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>Transmitido por <span style={{ color: '#f04f28' }}>Apertai</span></div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>Cameras inteligentes com streaming automatico</div>
              </div>
            </a>
          </div>
        )}

        {/* Footer */}
        <div className="tp-footer">
          <p className="tp-footer-text">
            Gerenciado com{' '}
            <a className="tp-footer-link" href="https://arenai.com.br" target="_blank" rel="noopener noreferrer">
              ArenAi
            </a>
            {' '} - Sistema de gestao para arenas esportivas
          </p>
        </div>

        {/* Score overlay */}
        {scoreOverlay && (
          <div className="tp-score-overlay">
            <div className="tp-score-overlay-text" style={{ color: scoreOverlay.color }}>
              {scoreOverlay.text}
            </div>
            <div className="tp-score-overlay-team">{scoreOverlay.team}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════

// Helper: get placeholder text for empty team slots
function getTeamPlaceholder(match: TournamentMatch, slot: 1 | 2, allMatches: TournamentMatch[]): string {
  // Find which match feeds into this slot
  const feeder = allMatches.find(m =>
    (slot === 1 && m.next_winner_match_id === match.id && m.next_winner_slot === 1) ||
    (slot === 1 && m.next_loser_match_id === match.id && m.next_loser_slot === 1) ||
    (slot === 2 && m.next_winner_match_id === match.id && m.next_winner_slot === 2) ||
    (slot === 2 && m.next_loser_match_id === match.id && m.next_loser_slot === 2)
  );
  if (!feeder) return 'A definir';
  const isWinner = feeder.next_winner_match_id === match.id && feeder.next_winner_slot === slot;
  return isWinner ? `Venc. Jogo #${feeder.match_number}` : `Perd. Jogo #${feeder.match_number}`;
}

// ─── Match Card ───
function MatchCard({ match, allMatches }: { match: TournamentMatch; allMatches?: TournamentMatch[] }) {
  const isLive = match.status === 'live';
  const isCompleted = match.status === 'completed';
  const bracketLabel = BRACKET_TYPE_LABELS[match.bracket_type] || match.bracket_type;

  return (
    <div className={`tp-match-card ${isLive ? 'live' : isCompleted ? 'completed' : ''}`}>
      <div className="tp-match-header">
        <span className="tp-match-number">#{match.match_number}</span>
        {isLive && (
          <span className="tp-match-status live">
            <span className="tp-live-dot" style={{ width: 6, height: 6 }} />
            AO VIVO
          </span>
        )}
        {isCompleted && <span className="tp-match-status completed">FINALIZADA</span>}
        {!isLive && !isCompleted && <span className="tp-match-status pending">PENDENTE</span>}
      </div>
      <div className={`tp-match-team-row ${match.winner_id && match.winner_id === match.team1_id ? 'winner' : ''} ${!match.team1_name ? 'tbd' : ''}`}>
        <span className="tp-match-team-name">{match.team1_name || (allMatches ? getTeamPlaceholder(match, 1, allMatches) : 'A definir')}</span>
        <span className="tp-match-team-score">
          {match.team1_score !== null && match.team1_score !== undefined ? match.team1_score : '-'}
        </span>
      </div>
      <div className={`tp-match-team-row ${match.winner_id && match.winner_id === match.team2_id ? 'winner' : ''} ${!match.team2_name ? 'tbd' : ''}`}>
        <span className="tp-match-team-name">{match.team2_name || (allMatches ? getTeamPlaceholder(match, 2, allMatches) : 'A definir')}</span>
        <span className="tp-match-team-score">
          {match.team2_score !== null && match.team2_score !== undefined ? match.team2_score : '-'}
        </span>
      </div>
    </div>
  );
}

// ─── Bracket View ───
function BracketView({ bracketGroups, allMatches }: { bracketGroups: Record<string, TournamentMatch[][]>; allMatches?: TournamentMatch[] }) {
  const winnersRounds = bracketGroups['winners'];
  const losersRounds = bracketGroups['losers'];
  const grandFinalRounds = bracketGroups['grand_final'];
  const thirdPlaceRounds = bracketGroups['third_place'];

  const getWinnersLabel = (idx: number, total: number) => {
    if (idx === total - 1) return 'Semifinal';
    if (idx === total - 2) return 'Quartas';
    if (total >= 4 && idx === total - 3) return 'Oitavas';
    if (total >= 5 && idx === total - 4) return '16 avos';
    return `Rodada ${idx + 1}`;
  };

  const getLosersLabel = (idx: number, total: number) => {
    if (idx === total - 1) return 'Quartas';
    if (idx === total - 2) return 'Quartas Repescagem';
    return `Rodada ${idx + 1}`;
  };

  return (
    <div className="tp-bracket-section">
      {/* Layout: Winners → Center (Finals) ← Losers (mirrored) */}
      <div className="tp-bracket-layout">
        {/* Winners bracket (left, normal direction) */}
        {winnersRounds && (
          <div className="tp-bracket-half">
            <div className="tp-bracket-type-label">
              {BRACKET_TYPE_LABELS['winners']}
              <span className="tp-bracket-type-tag winners">W</span>
            </div>
            <div className="tp-bracket-rounds">
              {winnersRounds.map((roundMatches, idx) => (
                <div key={idx} className="tp-bracket-round">
                  <div className="tp-bracket-round-label">
                    {getWinnersLabel(idx, winnersRounds.length)}
                  </div>
                  <div className="tp-bracket-round-matches">
                    {roundMatches.map(match => (
                      <MatchCard key={match.id} match={match} allMatches={allMatches} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Losers bracket (right, MIRRORED = reversed order) */}
        {losersRounds && (
          <div className="tp-bracket-half tp-bracket-half-mirrored">
            <div className="tp-bracket-type-label" style={{ textAlign: 'right' }}>
              {BRACKET_TYPE_LABELS['losers']}
              <span className="tp-bracket-type-tag losers">L</span>
            </div>
            <div className="tp-bracket-rounds tp-bracket-rounds-mirrored">
              {[...losersRounds].reverse().map((roundMatches, revIdx) => {
                const actualIdx = losersRounds.length - 1 - revIdx;
                return (
                  <div key={actualIdx} className="tp-bracket-round">
                    <div className="tp-bracket-round-label">
                      {getLosersLabel(actualIdx, losersRounds.length)}
                    </div>
                    <div className="tp-bracket-round-matches">
                      {roundMatches.map(match => (
                        <MatchCard key={match.id} match={match} allMatches={allMatches} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Grand Final & 3rd Place - below brackets, centered */}
      {(grandFinalRounds || thirdPlaceRounds) && (
        <div className="tp-bracket-finals">
          {grandFinalRounds && grandFinalRounds[0] && grandFinalRounds[0].map(match => (
            <div key={match.id} className="tp-bracket-final-card">
              <div className="tp-bracket-round-label" style={{ color: '#EAB308', fontWeight: 700, fontSize: '0.85rem' }}>Grande Final</div>
              <MatchCard match={match} allMatches={allMatches} />
            </div>
          ))}
          {thirdPlaceRounds && thirdPlaceRounds[0] && thirdPlaceRounds[0].map(match => (
            <div key={match.id} className="tp-bracket-final-card">
              <div className="tp-bracket-round-label" style={{ color: '#d97706', fontSize: '0.85rem' }}>Disputa 3o Lugar</div>
              <MatchCard match={match} allMatches={allMatches} />
            </div>
          ))}
        </div>
      )}

      {/* Fallback for formats without losers (single elimination) */}
      {!losersRounds && !grandFinalRounds && !thirdPlaceRounds && (grandFinalRounds || thirdPlaceRounds) && (
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: 16 }}>
          {grandFinalRounds && grandFinalRounds[0] && grandFinalRounds[0].map(m => (
            <div key={m.id}>
              <div className="tp-bracket-round-label" style={{ color: '#EAB308', fontWeight: 700 }}>Final</div>
              <MatchCard match={m} allMatches={allMatches} />
            </div>
          ))}
          {thirdPlaceRounds && thirdPlaceRounds[0] && thirdPlaceRounds[0].map(m => (
            <div key={m.id}>
              <div className="tp-bracket-round-label" style={{ color: '#d97706' }}>3o Lugar</div>
              <MatchCard match={m} allMatches={allMatches} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Dynamic Pairing Section (animated duo drawing) ───
// ─── HLS Player for Apertai Stream ───
function HlsPlayer({ urls, onCameraChange, initialCam }: { urls: Record<string, string>; onCameraChange?: (cam: string) => void; initialCam?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const cams = Object.entries(urls);
  const [activeCam, setActiveCam] = useState(initialCam || cams[0]?.[0] || 'cam1');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reconnectKey, setReconnectKey] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const baseUrl = urls[activeCam];
    if (!baseUrl) return;
    // Cache-busting: force fresh playlist on every reconnect
    const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}_=${Date.now()}`;

    let retryTimeout: any;
    import('hls.js').then(({ default: Hls }) => {
      if (hlsRef.current) { hlsRef.current.destroy(); }
      if (Hls.isSupported()) {
        const hls = new Hls({
          liveSyncDurationCount: 15,         // fica ~30s atras do ao vivo
          liveMaxLatencyDurationCount: 180,  // NUNCA pula pra frente (ate 6 min de atraso OK)
          manifestLoadingMaxRetry: 20,
          levelLoadingMaxRetry: 20,
          fragLoadingMaxRetry: 20,
          liveBackBufferLength: 120,         // manter 2 min de buffer passado
          enableWorker: true,
          lowLatencyMode: false,             // estabilidade > latencia
          startPosition: -1,                 // sempre comeca do live edge
        });
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => { video.play().catch(() => {}); });
        hls.on(Hls.Events.ERROR, (_e: any, data: any) => {
          if (data.fatal) {
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              console.log('[HLS] Network error, retrying...');
              hls.startLoad();
            } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              hls.recoverMediaError();
            }
          }
        });
        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.play().catch(() => {});
      }
    });
    return () => {
      clearTimeout(retryTimeout);
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    };
  }, [activeCam, urls[activeCam], reconnectKey]);

  useEffect(() => {
    const onFs = () => {
      if (!document.fullscreenElement && isFullscreen) {
        // Native fullscreen exited but our state is still true — sync it
        // (only if it was native fullscreen, not CSS fullscreen)
      }
    };
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, [isFullscreen]);

  const toggleFullscreen = () => {
    if (isFullscreen) {
      // Exit: try native first, then CSS fallback
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    } else {
      // Enter: try native, fallback to CSS fullscreen for mobile
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {
          // Native fullscreen failed (iOS/mobile) — use CSS fullscreen
          setIsFullscreen(true);
        });
      } else {
        // No native API — CSS fullscreen
        setIsFullscreen(true);
      }
    }
  };

  const btnStyle = (bg: string): React.CSSProperties => ({
    padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
    background: bg, color: '#fff', fontWeight: 600, fontSize: '0.8rem',
  });

  return (
    <div ref={containerRef} style={{ borderRadius: isFullscreen ? 0 : 16, overflow: 'hidden', background: '#000', position: isFullscreen ? 'fixed' : 'relative', inset: isFullscreen ? 0 : undefined, zIndex: isFullscreen ? 9999 : undefined }}>
      <div
        style={{
          aspectRatio: isFullscreen ? undefined : (window.innerWidth <= 768 ? '3/4' : '4/3'),
          width: isFullscreen ? '100vw' : undefined,
          height: isFullscreen ? '100vh' : undefined,
          overflow: 'hidden', background: '#000', position: 'relative', cursor: 'pointer',
        }}
        onClick={() => { if (videoRef.current) { videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause(); } }}
      >
        <video
          ref={videoRef}
          style={isFullscreen ? { position: 'absolute', top: '50%', left: '50%', width: '100vh', height: '100vw', objectFit: 'contain', display: 'block', transform: 'rotate(270deg) translate(-50%, -50%)', transformOrigin: '0 0' } : { width: '100%', height: '100%', objectFit: 'cover', display: 'block', transform: 'rotate(270deg)' }}
          muted
          autoPlay
          playsInline
        />
        {/* Controls overlay - inside video container in fullscreen */}
        {isFullscreen && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', gap: 8, padding: '12px 16px', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={(e) => { e.stopPropagation(); setReconnectKey(k => k + 1); }} style={{ ...btnStyle('#ef4444'), fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'tpPulse 1.5s infinite' }} /> AO VIVO
            </button>
            <button onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }} style={{ ...btnStyle('rgba(255,255,255,0.25)'), display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 10px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
            {cams.length > 1 && cams.map(([camId]) => (
              <button key={camId} onClick={(e) => { e.stopPropagation(); setActiveCam(camId); onCameraChange?.(camId); }} style={btnStyle(activeCam === camId ? '#F58A25' : 'rgba(255,255,255,0.25)')}>
                {camId.replace('cam', 'Cam ')}
              </button>
            ))}
          </div>
        )}
      </div>
      {/* Controls bar - below video when not fullscreen */}
      {!isFullscreen && (
        <div style={{ display: 'flex', gap: 8, padding: '8px 12px', background: 'rgba(0,0,0,0.85)', flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={(e) => { e.stopPropagation(); setReconnectKey(k => k + 1); }} style={{ ...btnStyle('#ef4444'), fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'tpPulse 1.5s infinite' }} /> AO VIVO
          </button>
          <button onClick={(e) => { e.stopPropagation(); if (videoRef.current) { videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause(); } }} style={{ ...btnStyle('rgba(255,255,255,0.1)'), display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 10px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </button>
          <button onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }} style={{ ...btnStyle('rgba(255,255,255,0.1)'), display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 10px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>
          </button>
          {cams.length > 1 && cams.map(([camId]) => (
            <button key={camId} onClick={(e) => { e.stopPropagation(); setActiveCam(camId); onCameraChange?.(camId); }} style={btnStyle(activeCam === camId ? '#F58A25' : 'rgba(255,255,255,0.1)')}>
              {camId.replace('cam', 'Cam ')}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sponsor Bar (master fixed on top, others rotating below) ───
function SponsorBar({ sponsors }: { sponsors: { id: number; name: string; description?: string; logo_url: string; is_master: boolean }[] }) {
  const sorted = [...sponsors].sort((a, b) => (b.is_master ? 1 : 0) - (a.is_master ? 1 : 0));
  // Apertai is always the last slide
  const all = [...sorted, { id: -1, name: 'Apertai', description: '', logo_url: '', is_master: false, _isApertai: true }] as any[];
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    if (all.length <= 1) return;
    const item = all[currentIdx];
    const dur = item?.is_master ? 12000 : item?._isApertai ? 3000 : 6000;
    const timer = setTimeout(() => setCurrentIdx(i => (i + 1) % all.length), dur);
    return () => clearTimeout(timer);
  }, [currentIdx, all.length]);

  return (
    <div style={{ overflow: 'hidden', borderRadius: 14, marginTop: 8, background: 'rgba(15,23,42,0.85)', position: 'relative' }}>
      <div style={{
        display: 'flex', transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: `translateX(-${currentIdx * 100}%)`,
      }}>
        {all.map((s: any) => (
          s._isApertai ? (
            /* Apertai branded slide */
            <a key="apertai" href="https://apertai.com.br" target="_blank" rel="noopener noreferrer" style={{
              minWidth: '100%', display: 'flex', alignItems: 'center', gap: 16,
              padding: '18px 20px', boxSizing: 'border-box', textDecoration: 'none',
              background: 'linear-gradient(135deg, rgba(240,79,40,0.12), rgba(255,107,53,0.06))',
              borderBottom: '2px solid rgba(240,79,40,0.3)',
            }}>
              <img src="/apertai-logo.svg" alt="Apertai" style={{ height: 70, maxWidth: 140, objectFit: 'contain', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
                  Transmita seus jogos ao vivo
                </div>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                  Cameras inteligentes com streaming automatico
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '5px 14px', borderRadius: 8, background: 'linear-gradient(135deg, #f04f28, #ff6b35)', color: '#fff', fontSize: '0.78rem', fontWeight: 700 }}>
                  Conheca o Apertai
                </div>
              </div>
            </a>
          ) : (
            <div key={s.id} style={{
              minWidth: '100%', display: 'flex', alignItems: 'center', gap: 14,
              padding: s.is_master ? '20px 20px' : '16px 20px',
              background: s.is_master ? 'rgba(245,138,37,0.08)' : 'transparent',
              borderBottom: s.is_master ? '2px solid rgba(245,138,37,0.3)' : 'none',
              boxSizing: 'border-box',
            }}>
              <img src={s.logo_url} alt={s.name} style={{ height: s.is_master ? 100 : 70, maxWidth: s.is_master ? 200 : 160, objectFit: 'contain', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {s.is_master ? 'Patrocinador Master' : 'Patrocinador'}
                </div>
                <div style={{ fontSize: s.is_master ? '1.15rem' : '1rem', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                  {s.name}
                </div>
                {s.description && (
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)', marginTop: 2, lineHeight: 1.3 }}>
                    {s.description}
                  </div>
                )}
              </div>
            </div>
          )
        ))}
      </div>
      {all.length > 1 && (
        <div style={{ position: 'absolute', bottom: 6, right: 12, display: 'flex', gap: 4 }}>
          {all.map((s: any, i: number) => (
            <div key={s.id} style={{ width: i === currentIdx ? 16 : 5, height: 5, borderRadius: 3, background: i === currentIdx ? (s._isApertai ? '#f04f28' : '#F58A25') : 'rgba(255,255,255,0.2)', transition: 'all 0.3s' }} />
          ))}
        </div>
      )}
    </div>
  );
}

function DynamicPairingSection({
  individualPlayers,
  generatedPairs,
  bracketGenerated,
  pairingMode,
  teamSize,
  lastPairsDrawAt,
  lastBracketDrawAt,
  pairsRevealAt,
  livePairsData,
}: {
  individualPlayers: { id: number; player_name: string; side: 'left' | 'right' }[];
  generatedPairs: { team_name: string; left_player: string; right_player: string }[];
  bracketGenerated: boolean;
  pairingMode: string;
  teamSize: number;
  lastPairsDrawAt: string | null;
  lastBracketDrawAt: string | null;
  pairsRevealAt: string | null;
  livePairsData?: { type: string; pairs: { left_player: string; right_player: string; team_name: string; revealed: boolean }[]; revealed_count: number; finished: boolean } | null;
}) {
  // State: 'idle' | 'spin-pair' | 'reveal-pair' | 'fireworks' | 'done'
  const [phase, setPhase] = useState<'idle' | 'spin-pair' | 'reveal-pair' | 'fireworks' | 'done'>('idle');
  const [revealCount, setRevealCount] = useState(0);
  const [currentPairIdx, setCurrentPairIdx] = useState(-1);
  const [spinNames, setSpinNames] = useState<[string, string]>(['???', '???']);
  const prevPairsCount = useRef(generatedPairs.length);
  const prevLiveRevealCount = useRef(livePairsData?.revealed_count || 0);
  const prevBracketRef = useRef(bracketGenerated);
  const timerRef = useRef<any>(null);
  const spinRef = useRef<any>(null);
  const [showLiveFireworks, setShowLiveFireworks] = useState(false);

  const leftPlayers = individualPlayers.filter(p => p.side === 'left');
  const rightPlayers = individualPlayers.filter(p => p.side === 'right');
  const allNames = individualPlayers.map(p => p.player_name);

  // If scheduled reveal is in the future, hide pairs from view
  const isRevealPending = pairsRevealAt && new Date(pairsRevealAt).getTime() > Date.now();
  const hasPairs = generatedPairs.length > 0 && !isRevealPending;
  const isLivePairsDraw = !!livePairsData && !livePairsData.finished;

  // On first render: if pairs already exist and NOT in live draw, skip straight to done
  useEffect(() => {
    if (hasPairs && !livePairsData) { setPhase('done'); setRevealCount(999); }
  }, []);

  // Scheduled reveal: countdown + force refresh when time arrives
  const [countdown, setCountdown] = useState<number | null>(null);
  useEffect(() => {
    if (!pairsRevealAt || hasPairs) { setCountdown(null); return; }
    const target = new Date(pairsRevealAt).getTime();
    const tick = () => {
      const rem = Math.ceil((target - Date.now()) / 1000);
      if (rem <= 0) { setCountdown(null); } else { setCountdown(rem); }
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [pairsRevealAt, hasPairs]);

  // ─── LIVE PAIRS DRAW: detect new reveal from admin (like LiveDrawSection for confrontos) ───
  useEffect(() => {
    if (!livePairsData) return;
    const prev = prevLiveRevealCount.current;
    const current = livePairsData.revealed_count;

    if (current > prev) {
      const newIdx = current - 1;
      setCurrentPairIdx(newIdx);
      setRevealCount(current);

      // Phase 1: Spinning names (3s)
      setPhase('spin-pair');
      let spinCount = 0;
      if (spinRef.current) clearInterval(spinRef.current);
      spinRef.current = setInterval(() => {
        spinCount++;
        const shuffledL = [...allNames].sort(() => Math.random() - 0.5);
        const shuffledR = [...allNames].sort(() => Math.random() - 0.5);
        setSpinNames([shuffledL[0] || '???', shuffledR[1] || '???']);
        if (spinCount > 12) {
          clearInterval(spinRef.current);
          // Phase 2: Reveal with fire
          setPhase('reveal-pair');
          setTimeout(() => {
            setPhase('idle');
            // If all done, show fireworks
            if (livePairsData.finished) {
              setShowLiveFireworks(true);
              setTimeout(() => { setShowLiveFireworks(false); setPhase('done'); }, 8000);
            }
          }, 4000);
        }
      }, 250);
    }
    prevLiveRevealCount.current = current;
    return () => { if (spinRef.current) clearInterval(spinRef.current); };
  }, [livePairsData?.revealed_count, livePairsData?.finished, allNames.length]);

  // ─── NON-LIVE: Detect NEW pairs appearing (0 → N) for instant/scheduled draws ───
  useEffect(() => {
    if (livePairsData) return; // Skip for live draw
    if (generatedPairs.length > 0 && prevPairsCount.current === 0) {
      // Instant reveal: just mark done immediately
      setPhase('done');
      setRevealCount(999);
    }
    prevPairsCount.current = generatedPairs.length;
  }, [generatedPairs.length, livePairsData]);

  // Detect bracket generated (false → true)
  useEffect(() => {
    if (bracketGenerated && !prevBracketRef.current) {
      setPhase('done');
      setRevealCount(999);
    }
    prevBracketRef.current = bracketGenerated;
  }, [bracketGenerated]);

  // Detect pairs removed (N → 0) = new round
  useEffect(() => {
    if (generatedPairs.length === 0 && prevPairsCount.current > 0 && !livePairsData) {
      setPhase('idle');
      setRevealCount(0);
      setCurrentPairIdx(-1);
    }
  }, [generatedPairs.length, livePairsData]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (spinRef.current) clearInterval(spinRef.current);
    };
  }, []);

  // Nothing to show
  if (individualPlayers.length === 0 && !hasPairs && !livePairsData) return null;

  const currentPair = livePairsData && currentPairIdx >= 0
    ? livePairsData.pairs[currentPairIdx]
    : currentPairIdx >= 0 ? generatedPairs[currentPairIdx] : null;

  // If bracket is generated and phase is done, show minimal
  if (bracketGenerated && phase === 'done' && hasPairs) {
    return (
      <div className="tp-pairing-section">
        <h2 className="tp-section-title">
          <ShuffleIcon /> Duplas
          <span className="tp-pairing-mode-badge">{pairingMode === 'dynamic_single' ? 'Unico' : 'Por Rodada'}</span>
        </h2>
        <div className="tp-pairing-pairs-grid">
          {generatedPairs.map((pair, idx) => (
            <div key={idx} className="tp-pairing-pair-card revealed">
              <div className="tp-pairing-pair-number">Dupla {idx + 1}</div>
              <div className="tp-pairing-pair-players">
                <span className="tp-pairing-pair-player left">{pair.left_player}</span>
                <span className="tp-pairing-pair-ampersand">&</span>
                <span className="tp-pairing-pair-player right">{pair.right_player}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="tp-pairing-section">
      <h2 className="tp-section-title">
        <ShuffleIcon /> Sorteio de Duplas
        <span className="tp-pairing-mode-badge">{pairingMode === 'dynamic_single' ? 'Unico' : 'Por Rodada'}</span>
        {(phase === 'shuffling' || phase === 'spin-pair' || phase === 'reveal-pair') && (
          <span style={{ marginLeft: 10, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.1)', padding: '2px 10px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 700, color: '#f87171' }}>
            <span className="tp-live-dot" style={{ width: 6, height: 6 }} /> AO VIVO
          </span>
        )}
      </h2>

      {/* ── FULLSCREEN SHUFFLE — names flying around ── */}
      {phase === 'shuffling' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.92)' }}>
          <div style={{ fontSize: '0.8rem', color: '#F58A25', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 4, marginBottom: 24 }}>
            Sorteio de Duplas
          </div>
          <div style={{ position: 'relative', width: 300, height: 200, overflow: 'hidden' }}>
            {individualPlayers.map((p, i) => (
              <span key={p.id} style={{
                position: 'absolute',
                fontSize: '1.1rem', fontWeight: 700,
                color: p.side === 'left' ? '#60A5FA' : '#F87171',
                animation: `tp-name-fly-${(i % 3) + 1} ${1.5 + Math.random()}s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`,
                left: `${10 + Math.random() * 60}%`,
                top: `${10 + Math.random() * 70}%`,
                textShadow: p.side === 'left' ? '0 0 10px rgba(96,165,250,0.5)' : '0 0 10px rgba(248,113,113,0.5)',
              }}>
                {p.player_name}
              </span>
            ))}
          </div>
          <div className="tp-pairing-shuffle-spinner" style={{ marginTop: 16, width: 40, height: 40 }} />
          <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: 12 }}>Sorteando duplas...</div>
        </div>
      )}

      {/* ── FULLSCREEN SPIN PAIR — slot-machine for current pair ── */}
      {phase === 'spin-pair' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.92)' }}>
          <div style={{ fontSize: '0.8rem', color: '#F58A25', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 4, marginBottom: 24 }}>
            Dupla {currentPairIdx + 1}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
            <div style={{ width: 200, height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 14, overflow: 'hidden' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#60A5FA', animation: 'tp-spin-text 0.15s linear infinite alternate' }}>
                {spinNames[0]}
              </span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#F58A25' }}>&</div>
            <div style={{ width: 200, height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, overflow: 'hidden' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#F87171', animation: 'tp-spin-text 0.15s linear infinite alternate' }}>
                {spinNames[1]}
              </span>
            </div>
          </div>
          <div className="tp-pairing-shuffle-spinner" style={{ marginTop: 24, width: 50, height: 50 }} />
        </div>
      )}

      {/* ── FULLSCREEN REVEAL PAIR — with fire ── */}
      {phase === 'reveal-pair' && currentPair && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.92)' }}>
          {/* Fire layers */}
          <div style={{ position: 'absolute', bottom: -10, left: '-10%', right: '-10%', height: '40%', background: 'radial-gradient(ellipse at 50% 100%, rgba(245,138,37,0.4) 0%, rgba(239,68,68,0.15) 40%, transparent 70%)', animation: 'tp-fire-wave 3s ease-in-out infinite, tp-fire-flicker 2s ease-in-out infinite', pointerEvents: 'none', filter: 'blur(20px)' }} />
          <div style={{ position: 'absolute', bottom: -5, left: '-5%', right: '-5%', height: '30%', background: 'radial-gradient(ellipse at 50% 100%, rgba(239,68,68,0.5) 0%, rgba(245,138,37,0.2) 35%, transparent 65%)', animation: 'tp-fire-wave 2s ease-in-out infinite reverse, tp-fire-flicker 1.5s ease-in-out infinite alternate', pointerEvents: 'none', filter: 'blur(15px)' }} />

          <div style={{ fontSize: '0.8rem', color: '#F58A25', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 4, marginBottom: 20, animation: 'pointPop 0.6s ease-out', zIndex: 1 }}>
            Dupla {currentPairIdx + 1}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 30, animation: 'pointPop 0.8s ease-out', zIndex: 1 }}>
            <div style={{ padding: '16px 28px', background: 'rgba(59,130,246,0.12)', border: '2px solid rgba(59,130,246,0.4)', borderRadius: 16, boxShadow: '0 0 30px rgba(59,130,246,0.2)' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#3B82F6', textShadow: '0 0 20px rgba(59,130,246,0.5)' }}>
                {currentPair.left_player}
              </span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#F58A25', textShadow: '0 0 20px rgba(245,138,37,0.5)' }}>&</div>
            <div style={{ padding: '16px 28px', background: 'rgba(239,68,68,0.12)', border: '2px solid rgba(239,68,68,0.4)', borderRadius: 16, boxShadow: '0 0 30px rgba(239,68,68,0.2)' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#EF4444', textShadow: '0 0 20px rgba(239,68,68,0.5)' }}>
                {currentPair.right_player}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── FULLSCREEN FIREWORKS — all pairs defined ── */}
      {showLiveFireworks && livePairsData && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.92)', overflow: 'auto' }}>
          <div style={{ position: 'absolute', bottom: -10, left: '-10%', right: '-10%', height: '50%', background: 'radial-gradient(ellipse at 50% 100%, rgba(245,138,37,0.5) 0%, rgba(239,68,68,0.2) 40%, transparent 70%)', animation: 'tp-fire-wave 3s ease-in-out infinite, tp-fire-flicker 2s ease-in-out infinite', pointerEvents: 'none', filter: 'blur(25px)' }} />
          <div style={{ position: 'absolute', bottom: -5, left: '-5%', right: '-5%', height: '35%', background: 'radial-gradient(ellipse at 50% 100%, rgba(239,68,68,0.55) 0%, rgba(245,138,37,0.2) 35%, transparent 65%)', animation: 'tp-fire-wave 2s ease-in-out infinite reverse, tp-fire-flicker 1.5s ease-in-out infinite alternate', pointerEvents: 'none', filter: 'blur(18px)' }} />
          <div style={{ zIndex: 1, textAlign: 'center', maxWidth: 600, width: '90%' }}>
            <div style={{ marginBottom: 12, animation: 'pointPop 0.8s ease-out', filter: 'drop-shadow(0 0 20px rgba(245,138,37,0.5))' }}>
              <svg width="60" height="60" viewBox="0 0 24 24" fill="#F58A25" stroke="none"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#F58A25', textTransform: 'uppercase', letterSpacing: 4, textShadow: '0 0 40px rgba(245,138,37,0.6)', animation: 'pointPop 1s ease-out', marginBottom: 20 }}>
              Duplas Definidas!
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, animation: 'pointPop 1.2s ease-out' }}>
              {livePairsData.pairs.map((pair, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '10px 16px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12 }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#10b981', minWidth: 24 }}>{idx + 1}</span>
                  <span style={{ fontWeight: 700, color: '#60A5FA', fontSize: '0.95rem', flex: 1, textAlign: 'right' }}>{pair.left_player}</span>
                  <span style={{ color: '#F58A25', fontWeight: 700, fontSize: '0.85rem' }}>&</span>
                  <span style={{ fontWeight: 700, color: '#F87171', fontSize: '0.95rem', flex: 1, textAlign: 'left' }}>{pair.right_player}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── LIVE PAIRS DRAW: cards showing revealed/pending ── */}
      {livePairsData && !showLiveFireworks && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10, marginTop: 12 }}>
          {livePairsData.pairs.map((p, idx) => (
            <div key={idx} style={{
              padding: '12px 16px', borderRadius: 12,
              background: p.revealed ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${p.revealed ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)'}`,
              transition: 'all 0.5s ease',
            }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: p.revealed ? '#10b981' : '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                Dupla {idx + 1} {!p.revealed && '— Aguardando...'}
              </div>
              {p.revealed ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, color: '#60A5FA', fontSize: '0.85rem' }}>{p.left_player}</span>
                  <span style={{ color: '#F58A25', fontWeight: 600, fontSize: '0.75rem' }}>&</span>
                  <span style={{ fontWeight: 700, color: '#F87171', fontSize: '0.85rem' }}>{p.right_player}</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#334155', fontSize: '0.85rem' }}>???</span>
                  <span style={{ color: 'rgba(255,255,255,0.1)', fontWeight: 600, fontSize: '0.75rem' }}>&</span>
                  <span style={{ color: '#334155', fontSize: '0.85rem' }}>???</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Idle: show players awaiting draw */}
      {phase === 'idle' && !hasPairs && !livePairsData && individualPlayers.length > 0 && (
        <div className="tp-pairing-players">
          <div className="tp-pairing-side tp-pairing-left">
            <div className="tp-pairing-side-label"><span className="tp-pairing-side-dot left" /> Esquerdo ({leftPlayers.length})</div>
            <div className="tp-pairing-player-list">
              {leftPlayers.map((p, i) => (
                <div key={p.id} className="tp-pairing-player-card left" style={{ animationDelay: `${i * 0.1}s` }}>
                  <span className="tp-pairing-player-number">{i + 1}</span>
                  <span className="tp-pairing-player-name">{p.player_name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="tp-pairing-vs">
            <div className="tp-pairing-vs-icon"><ShuffleIcon size={32} /></div>
            {countdown !== null && countdown > 0 ? (
              <div className="tp-pairing-countdown">
                <div className="tp-pairing-countdown-label">Sorteio em</div>
                <div className="tp-pairing-countdown-time">
                  {Math.floor(countdown / 3600).toString().padStart(2, '0')}:
                  {Math.floor((countdown % 3600) / 60).toString().padStart(2, '0')}:
                  {(countdown % 60).toString().padStart(2, '0')}
                </div>
              </div>
            ) : (
              <div className="tp-pairing-vs-text">Aguardando sorteio...</div>
            )}
          </div>
          <div className="tp-pairing-side tp-pairing-right">
            <div className="tp-pairing-side-label"><span className="tp-pairing-side-dot right" /> Direito ({rightPlayers.length})</div>
            <div className="tp-pairing-player-list">
              {rightPlayers.map((p, i) => (
                <div key={p.id} className="tp-pairing-player-card right" style={{ animationDelay: `${i * 0.1}s` }}>
                  <span className="tp-pairing-player-number">{i + 1}</span>
                  <span className="tp-pairing-player-name">{p.player_name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Done: show pairs list */}
      {phase === 'done' && hasPairs && (
        <div className="tp-pairing-results">
          <div className="tp-pairing-pairs-grid">
            {generatedPairs.map((pair, idx) => (
              <div key={idx} className="tp-pairing-pair-card revealed">
                <div className="tp-pairing-pair-number">Dupla {idx + 1}</div>
                <div className="tp-pairing-pair-players">
                  <span className="tp-pairing-pair-player left">{pair.left_player}</span>
                  <span className="tp-pairing-pair-ampersand">&</span>
                  <span className="tp-pairing-pair-player right">{pair.right_player}</span>
                </div>
                <div className="tp-pairing-pair-team-name">{pair.team_name}</div>
              </div>
            ))}
          </div>
          {bracketGenerated && (
            <div className="tp-pairing-bracket-ready">
              <span className="tp-pairing-bracket-ready-icon">&#9989;</span>
              Confrontos sorteados! Veja a chave na aba "Chave".
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Live Draw Section (animated match reveals) ───
function LiveDrawSection({ drawData, teams }: {
  drawData: {
    matches: { team1_id: number; team1_name: string; team2_id: number; team2_name: string; revealed: boolean }[];
    revealed_count: number;
    bye_team?: { id: number; name: string } | null;
    finished: boolean;
  };
  teams: { id: number; name: string }[];
}) {
  const prevRevealedRef = useRef(drawData.revealed_count);
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'reveal' | 'fire'>('idle');
  const [revealIdx, setRevealIdx] = useState(-1);
  const [spinNames, setSpinNames] = useState<string[]>([]);
  const [showFireworks, setShowFireworks] = useState(false);
  const spinRef = useRef<any>(null);

  // All team names for spinning effect
  const allNames = teams.map(t => t.name);

  useEffect(() => {
    const prev = prevRevealedRef.current;
    if (drawData.revealed_count > prev) {
      const newIdx = drawData.revealed_count - 1;
      setRevealIdx(newIdx);

      // Phase 1: Spinning names (3.5s)
      setPhase('spinning');
      let spinCount = 0;
      spinRef.current = setInterval(() => {
        spinCount++;
        const shuffled = [...allNames].sort(() => Math.random() - 0.5);
        setSpinNames([shuffled[0] || '???', shuffled[1] || '???']);
        if (spinCount > 14) { // ~3.5s at 250ms intervals
          clearInterval(spinRef.current);
          // Phase 2: Reveal with fire
          setPhase('reveal');
          setTimeout(() => {
            setPhase('idle');
            // If all done, show big fireworks
            if (drawData.finished) {
              setTimeout(() => { setShowFireworks(true); setTimeout(() => setShowFireworks(false), 6000); }, 500);
            }
          }, 4000);
        }
      }, 250);
    }
    prevRevealedRef.current = drawData.revealed_count;
    return () => { if (spinRef.current) clearInterval(spinRef.current); };
  }, [drawData.revealed_count, drawData.finished, allNames.length]);

  const revealedMatch = revealIdx >= 0 ? drawData.matches[revealIdx] : null;

  return (
    <div style={{ margin: '24px 0', padding: '24px', background: 'linear-gradient(135deg, rgba(245,138,37,0.06), rgba(239,68,68,0.04))', border: '1px solid rgba(245,138,37,0.15)', borderRadius: 20, position: 'relative', overflow: 'hidden' }}>
      <h2 className="tp-section-title" style={{ marginBottom: 16 }}>
        <ShuffleIcon /> Sorteio de Confrontos
        <span style={{ marginLeft: 10, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.1)', padding: '2px 10px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 700, color: '#f87171' }}>
          <span className="tp-live-dot" style={{ width: 6, height: 6 }} /> AO VIVO
        </span>
      </h2>

      {/* ── SPINNING OVERLAY ── */}
      {phase === 'spinning' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.92)' }}>
          <div style={{ fontSize: '0.8rem', color: '#F58A25', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 4, marginBottom: 24 }}>
            Confronto {revealIdx + 1}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
            <div style={{ width: 220, height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 14, overflow: 'hidden' }}>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#60A5FA', animation: 'tp-spin-text 0.15s linear infinite alternate' }}>
                {spinNames[0] || '???'}
              </span>
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'rgba(255,255,255,0.15)' }}>VS</div>
            <div style={{ width: 220, height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, overflow: 'hidden' }}>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#F87171', animation: 'tp-spin-text 0.15s linear infinite alternate' }}>
                {spinNames[1] || '???'}
              </span>
            </div>
          </div>
          <div className="tp-pairing-shuffle-spinner" style={{ marginTop: 24, width: 50, height: 50 }} />
        </div>
      )}

      {/* ── REVEAL WITH FIRE ── */}
      {phase === 'reveal' && revealedMatch && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.92)' }}>
          {/* Fire — smooth blurred layers */}
          <div style={{ position: 'absolute', bottom: -10, left: '-10%', right: '-10%', height: '40%', background: 'radial-gradient(ellipse at 50% 100%, rgba(245,138,37,0.4) 0%, rgba(239,68,68,0.15) 40%, transparent 70%)', animation: 'tp-fire-wave 3s ease-in-out infinite, tp-fire-flicker 2s ease-in-out infinite', pointerEvents: 'none', filter: 'blur(20px)' }} />
          <div style={{ position: 'absolute', bottom: -5, left: '-5%', right: '-5%', height: '30%', background: 'radial-gradient(ellipse at 50% 100%, rgba(239,68,68,0.5) 0%, rgba(245,138,37,0.2) 35%, transparent 65%)', animation: 'tp-fire-wave 2s ease-in-out infinite reverse, tp-fire-flicker 1.5s ease-in-out infinite alternate', pointerEvents: 'none', filter: 'blur(15px)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: '5%', right: '5%', height: '20%', background: 'radial-gradient(ellipse at 50% 100%, rgba(255,220,80,0.4) 0%, rgba(245,138,37,0.15) 40%, transparent 70%)', animation: 'tp-fire-wave 2.5s ease-in-out infinite, tp-fire-flicker 1s ease-in-out infinite alternate-reverse', pointerEvents: 'none', filter: 'blur(10px)' }} />

          <div style={{ fontSize: '0.8rem', color: '#F58A25', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 4, marginBottom: 20, animation: 'pointPop 0.6s ease-out' }}>
            Confronto {revealIdx + 1}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 30, animation: 'pointPop 0.8s ease-out' }}>
            <div style={{ padding: '16px 28px', background: 'rgba(59,130,246,0.12)', border: '2px solid rgba(59,130,246,0.4)', borderRadius: 16, boxShadow: '0 0 30px rgba(59,130,246,0.2)' }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#3B82F6', textShadow: '0 0 20px rgba(59,130,246,0.5)' }}>
                {revealedMatch.team1_name}
              </span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#F58A25', textShadow: '0 0 20px rgba(245,138,37,0.5)' }}>VS</div>
            <div style={{ padding: '16px 28px', background: 'rgba(239,68,68,0.12)', border: '2px solid rgba(239,68,68,0.4)', borderRadius: 16, boxShadow: '0 0 30px rgba(239,68,68,0.2)' }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#EF4444', textShadow: '0 0 20px rgba(239,68,68,0.5)' }}>
                {revealedMatch.team2_name}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── ALL DONE FIREWORKS ── */}
      {showFireworks && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.92)', overflow: 'auto' }}>
          <div style={{ position: 'absolute', bottom: -10, left: '-10%', right: '-10%', height: '50%', background: 'radial-gradient(ellipse at 50% 100%, rgba(245,138,37,0.5) 0%, rgba(239,68,68,0.2) 40%, transparent 70%)', animation: 'tp-fire-wave 3s ease-in-out infinite, tp-fire-flicker 2s ease-in-out infinite', pointerEvents: 'none', filter: 'blur(25px)' }} />
          <div style={{ position: 'absolute', bottom: -5, left: '-5%', right: '-5%', height: '35%', background: 'radial-gradient(ellipse at 50% 100%, rgba(239,68,68,0.55) 0%, rgba(245,138,37,0.2) 35%, transparent 65%)', animation: 'tp-fire-wave 2s ease-in-out infinite reverse, tp-fire-flicker 1.5s ease-in-out infinite alternate', pointerEvents: 'none', filter: 'blur(18px)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: '5%', right: '5%', height: '22%', background: 'radial-gradient(ellipse at 50% 100%, rgba(255,220,80,0.45) 0%, rgba(245,138,37,0.15) 40%, transparent 70%)', animation: 'tp-fire-wave 2.5s ease-in-out infinite, tp-fire-flicker 1s ease-in-out infinite alternate-reverse', pointerEvents: 'none', filter: 'blur(12px)' }} />
          <div style={{ zIndex: 1, textAlign: 'center', maxWidth: 600, width: '90%' }}>
            <div style={{ marginBottom: 12, animation: 'pointPop 0.8s ease-out', filter: 'drop-shadow(0 0 20px rgba(245,138,37,0.5))' }}>
              <svg width="60" height="60" viewBox="0 0 24 24" fill="#F58A25" stroke="none"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#F58A25', textTransform: 'uppercase', letterSpacing: 4, textShadow: '0 0 40px rgba(245,138,37,0.6)', animation: 'pointPop 1s ease-out', marginBottom: 20 }}>
              Confrontos Definidos!
            </div>
            {/* Matches table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, animation: 'pointPop 1.2s ease-out' }}>
              {drawData.matches.map((m, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '10px 16px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12 }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', minWidth: 24 }}>{idx + 1}</span>
                  <span style={{ fontWeight: 700, color: '#60A5FA', fontSize: '0.95rem', flex: 1, textAlign: 'right' }}>{m.team1_name}</span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 700, fontSize: '0.75rem' }}>VS</span>
                  <span style={{ fontWeight: 700, color: '#F87171', fontSize: '0.95rem', flex: 1, textAlign: 'left' }}>{m.team2_name}</span>
                </div>
              ))}
              {((drawData as any).bye_teams?.length > 0 || drawData.bye_team) && (
                <div style={{ padding: '8px 16px', background: 'rgba(245,138,37,0.08)', border: '1px solid rgba(245,138,37,0.15)', borderRadius: 12, marginTop: 4 }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#F58A25' }}>BYE: </span>
                  <span style={{ fontSize: '0.85rem', color: '#F58A25' }}>
                    {((drawData as any).bye_teams || (drawData.bye_team ? [drawData.bye_team] : [])).map((t: any) => t.name).join(', ')}
                  </span>
                </div>
              )}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: 16 }}>A chave sera exibida em instantes...</div>
          </div>
        </div>
      )}

      {/* ── Match cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
        {drawData.matches.map((m, idx) => (
          <div key={idx} style={{
            padding: '12px 16px', borderRadius: 12,
            background: m.revealed ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${m.revealed ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)'}`,
            transition: 'all 0.5s ease',
          }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: m.revealed ? '#10b981' : '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
              Confronto {idx + 1} {!m.revealed && '— Aguardando...'}
            </div>
            {m.revealed ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 700, color: '#60A5FA', fontSize: '0.85rem' }}>{m.team1_name}</span>
                <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 600, fontSize: '0.7rem' }}>VS</span>
                <span style={{ fontWeight: 700, color: '#F87171', fontSize: '0.85rem' }}>{m.team2_name}</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#334155', fontSize: '0.85rem' }}>???</span>
                <span style={{ color: 'rgba(255,255,255,0.1)', fontWeight: 600, fontSize: '0.7rem' }}>VS</span>
                <span style={{ color: '#334155', fontSize: '0.85rem' }}>???</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* BYE teams */}
      {((drawData as any).bye_teams?.length > 0 || drawData.bye_team) && (drawData as any).byes_revealed && (
        <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(245,138,37,0.06)', border: '1px solid rgba(245,138,37,0.15)' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#F58A25', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
            Passam Direto (BYE)
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {((drawData as any).bye_teams || (drawData.bye_team ? [drawData.bye_team] : [])).map((t: any) => (
              <span key={t.id} style={{ fontSize: '0.8rem', fontWeight: 600, color: '#F58A25' }}>{t.name}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ShuffleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 3 21 3 21 8" />
      <line x1="4" y1="20" x2="21" y2="3" />
      <polyline points="21 16 21 21 16 21" />
      <line x1="15" y1="15" x2="21" y2="21" />
      <line x1="4" y1="4" x2="9" y2="9" />
    </svg>
  );
}

// ─── Inline SVG Icons (no external dependency) ───
function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
