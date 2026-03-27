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
  const [liveDrawFireworks, setLiveDrawFireworks] = useState(false);
  const prevLiveDrawRef = useRef(false);

  // ─── Fetch full tournament data ───
  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/tournaments/public/live/${token}`);
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

    // Poll faster during live draw (2s) vs normal (10s)
    const isLiveDraw = data.tournament.live_draw_mode;
    const hasStream = data.tournament.stream_mode === 'apertai';
    const pollMs = isLiveDraw ? 2000 : hasStream ? 5000 : 10000;
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

  const { tournament, teams, matches, live_matches, podium, groups, individual_players, generated_pairs } = data;
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
          <span className="tp-brand-powered">
            {tournament.arena_name || 'Powered by ArenAi'}
          </span>
        </div>

        {/* Header */}
        <header className="tp-header">
          <div className="tp-arena-showcase">
            {(tournament.arena_logo || tournament.image_url) ? (
              <img src={tournament.arena_logo || tournament.image_url} alt={tournament.display_name || tournament.arena_name || tournament.title} className="tp-arena-logo" />
            ) : (
              <div className="tp-arena-initials">
                {(tournament.display_name || tournament.arena_name || 'A').substring(0, 2).toUpperCase()}
              </div>
            )}
            <div className="tp-arena-name">{tournament.display_name || tournament.arena_name}</div>
          </div>

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

        {/* Detect live draw finished → show fireworks overlay */}
        {(() => {
          const isLiveDraw = tournament.live_draw_mode && tournament.live_draw_data;
          if (prevLiveDrawRef.current && !isLiveDraw) {
            // Live draw just ended! Show fireworks
            if (!liveDrawFireworks) {
              setLiveDrawFireworks(true);
              setTimeout(() => setLiveDrawFireworks(false), 7000);
            }
          }
          prevLiveDrawRef.current = !!isLiveDraw;
          return null;
        })()}

        {/* Fireworks overlay when live draw completes */}
        {liveDrawFireworks && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.92)', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', bottom: -10, left: '-10%', right: '-10%', height: '50%', background: 'radial-gradient(ellipse at 50% 100%, rgba(245,138,37,0.5) 0%, rgba(239,68,68,0.2) 40%, transparent 70%)', animation: 'tp-fire-wave 3s ease-in-out infinite, tp-fire-flicker 2s ease-in-out infinite', filter: 'blur(25px)' }} />
            <div style={{ position: 'absolute', bottom: -5, left: '-5%', right: '-5%', height: '35%', background: 'radial-gradient(ellipse at 50% 100%, rgba(239,68,68,0.55) 0%, rgba(245,138,37,0.2) 35%, transparent 65%)', animation: 'tp-fire-wave 2s ease-in-out infinite reverse, tp-fire-flicker 1.5s ease-in-out infinite alternate', filter: 'blur(18px)' }} />
            <div style={{ position: 'absolute', bottom: 0, left: '5%', right: '5%', height: '22%', background: 'radial-gradient(ellipse at 50% 100%, rgba(255,220,80,0.45) 0%, rgba(245,138,37,0.15) 40%, transparent 70%)', animation: 'tp-fire-wave 2.5s ease-in-out infinite, tp-fire-flicker 1s ease-in-out infinite alternate-reverse', filter: 'blur(12px)' }} />
            <div style={{ zIndex: 1, textAlign: 'center' }}>
              <div style={{ marginBottom: 16, animation: 'pointPop 0.8s ease-out', filter: 'drop-shadow(0 0 20px rgba(245,138,37,0.5))' }}>
                <svg width="80" height="80" viewBox="0 0 24 24" fill="#F58A25" stroke="none"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#F58A25', textTransform: 'uppercase', letterSpacing: 4, textShadow: '0 0 40px rgba(245,138,37,0.6)', animation: 'pointPop 1s ease-out' }}>
                Confrontos Definidos!
              </div>
              <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: 16 }}>A chave sera exibida em instantes...</div>
            </div>
          </div>
        )}

        {/* Live Draw Section — below tags, above pairing */}
        {tournament.live_draw_mode && tournament.live_draw_data && (
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
          />
        )}

        {/* Live matches - always at top when they exist */}
        {live_matches && live_matches.length > 0 && (
          <div className="tp-live-section">
            <h2 className="tp-section-title">
              <span className="tp-live-dot" /> Ao Vivo Agora
            </h2>
            {live_matches.map(match => (
              <div key={match.id} className="tp-live-card" style={{ marginBottom: 16 }}>
                <div className="tp-live-card-header">
                  <span className="tp-live-card-badge">
                    <span className="tp-live-dot" />
                    AO VIVO
                  </span>
                  <span className="tp-live-card-info">
                    #{match.match_number}
                    {match.court_name ? ` - ${match.court_name}` : ''}
                    {' - '}
                    {BRACKET_TYPE_LABELS[match.bracket_type] || match.bracket_type}
                    {match.bracket_type !== 'grand_final' && match.bracket_type !== 'third_place' && ` R${match.round_number}`}
                  </span>
                </div>
                <div className="tp-live-match-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', padding: '1.5rem 1rem' }}>
                  <div style={{ flex: 1, textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                      {match.team1_name || 'A definir'}
                    </div>
                    <div style={{ width: 40, height: 3, background: '#3B82F6', borderRadius: 2, marginLeft: 'auto' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                    <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#3B82F6', minWidth: 40, textAlign: 'center' }}>{match.team1_score ?? 0}</span>
                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>x</span>
                    <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#EF4444', minWidth: 40, textAlign: 'center' }}>{match.team2_score ?? 0}</span>
                  </div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                      {match.team2_name || 'A definir'}
                    </div>
                    <div style={{ width: 40, height: 3, background: '#EF4444', borderRadius: 2 }} />
                  </div>
                </div>
                {/* Match details */}
                <div className="tp-live-match-details">
                  <span className="tp-live-detail-item">
                    Jogo #{match.match_number}
                  </span>
                  <span className="tp-live-detail-separator" />
                  <span className="tp-live-detail-item">
                    {BRACKET_TYPE_LABELS[match.bracket_type] || match.bracket_type}
                  </span>
                  {match.bracket_type !== 'grand_final' && match.bracket_type !== 'third_place' && (
                    <>
                      <span className="tp-live-detail-separator" />
                      <span className="tp-live-detail-item">Rodada {match.round_number}</span>
                    </>
                  )}
                  {match.court_name && (
                    <>
                      <span className="tp-live-detail-separator" />
                      <span className="tp-live-detail-item">{match.court_name}</span>
                    </>
                  )}
                </div>
                {/* Stream replaces animation when Apertai is live */}
                {data.stream && data.stream.status === 'live' && data.stream.urls ? (
                  <HlsPlayer urls={data.stream.urls} />
                ) : (
                  <LiveMatchAnimation
                    category={category}
                    team1Name={match.team1_name || 'Time A'}
                    team2Name={match.team2_name || 'Time B'}
                    team1Score={match.team1_score ?? 0}
                    team2Score={match.team2_score ?? 0}
                    isLive={true}
                    teamSize={tournament.team_size}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Podium - show when tournament is finished and podium data exists */}
        {isFinished && podium && podium.length > 0 && (
          <div className="tp-podium-section">
            <h2 className="tp-section-title">
              {'\uD83C\uDFC6'} Podio
            </h2>
            <div className="tp-podium">
              {/* 2nd place (left) */}
              {podium.find(p => p.place === 2) && (
                <div className="tp-podium-place tp-podium-2nd">
                  <div className="tp-podium-avatar">{'\uD83E\uDD48'}</div>
                  <div className="tp-podium-team-name">
                    {podium.find(p => p.place === 2)!.team_name}
                  </div>
                  <div className="tp-podium-record">
                    {podium.find(p => p.place === 2)!.wins}V - {podium.find(p => p.place === 2)!.losses}D
                  </div>
                  <div className="tp-podium-block">2</div>
                </div>
              )}
              {/* 1st place (center) */}
              {podium.find(p => p.place === 1) && (
                <div className="tp-podium-place tp-podium-1st">
                  <div className="tp-podium-avatar">{'\uD83C\uDFC6'}</div>
                  <div className="tp-podium-team-name">
                    {podium.find(p => p.place === 1)!.team_name}
                  </div>
                  <div className="tp-podium-record">
                    {podium.find(p => p.place === 1)!.wins}V - {podium.find(p => p.place === 1)!.losses}D
                  </div>
                  <div className="tp-podium-block">1</div>
                </div>
              )}
              {/* 3rd place (right) */}
              {podium.find(p => p.place === 3) && (
                <div className="tp-podium-place tp-podium-3rd">
                  <div className="tp-podium-avatar">{'\uD83E\uDD49'}</div>
                  <div className="tp-podium-team-name">
                    {podium.find(p => p.place === 3)!.team_name}
                  </div>
                  <div className="tp-podium-record">
                    {podium.find(p => p.place === 3)!.wins}V - {podium.find(p => p.place === 3)!.losses}D
                  </div>
                  <div className="tp-podium-block">3</div>
                </div>
              )}
            </div>
          </div>
        )}

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
                <BracketView bracketGroups={bracketGroups} />
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
                      <MatchCard key={match.id} match={match} />
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
                <BracketView bracketGroups={bracketGroups} />
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
                  <MatchCard key={match.id} match={match} />
                ))}
            </div>
            {nonByeMatches.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                <p style={{ fontSize: '1rem', fontWeight: 600 }}>Nenhum jogo disponivel</p>
              </div>
            )}
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

// ─── Match Card ───
function MatchCard({ match }: { match: TournamentMatch }) {
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
        <span className="tp-match-team-name">{match.team1_name || 'A definir'}</span>
        <span className="tp-match-team-score">
          {match.team1_score !== null && match.team1_score !== undefined ? match.team1_score : '-'}
        </span>
      </div>
      <div className={`tp-match-team-row ${match.winner_id && match.winner_id === match.team2_id ? 'winner' : ''} ${!match.team2_name ? 'tbd' : ''}`}>
        <span className="tp-match-team-name">{match.team2_name || 'A definir'}</span>
        <span className="tp-match-team-score">
          {match.team2_score !== null && match.team2_score !== undefined ? match.team2_score : '-'}
        </span>
      </div>
    </div>
  );
}

// ─── Bracket View ───
function BracketView({ bracketGroups }: { bracketGroups: Record<string, TournamentMatch[][]> }) {
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
                      <MatchCard key={match.id} match={match} />
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
                        <MatchCard key={match.id} match={match} />
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
              <MatchCard match={match} />
            </div>
          ))}
          {thirdPlaceRounds && thirdPlaceRounds[0] && thirdPlaceRounds[0].map(match => (
            <div key={match.id} className="tp-bracket-final-card">
              <div className="tp-bracket-round-label" style={{ color: '#d97706', fontSize: '0.85rem' }}>Disputa 3o Lugar</div>
              <MatchCard match={match} />
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
              <MatchCard match={m} />
            </div>
          ))}
          {thirdPlaceRounds && thirdPlaceRounds[0] && thirdPlaceRounds[0].map(m => (
            <div key={m.id}>
              <div className="tp-bracket-round-label" style={{ color: '#d97706' }}>3o Lugar</div>
              <MatchCard match={m} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Dynamic Pairing Section (animated duo drawing) ───
// ─── HLS Player for Apertai Stream ───
function HlsPlayer({ urls }: { urls: Record<string, string> }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const cams = Object.entries(urls);
  const [activeCam, setActiveCam] = useState(cams[0]?.[0] || 'cam1');

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const url = urls[activeCam];
    if (!url) return;

    // Dynamic import hls.js to avoid SSR issues
    import('hls.js').then(({ default: Hls }) => {
      if (hlsRef.current) { hlsRef.current.destroy(); }

      if (Hls.isSupported()) {
        const hls = new Hls({ liveSyncDurationCount: 3, liveMaxLatencyDurationCount: 6 });
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => { video.play().catch(() => {}); });
        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS
        video.src = url;
        video.play().catch(() => {});
      }
    });

    return () => { if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; } };
  }, [activeCam, urls]);

  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', background: '#000', position: 'relative' }}>
      <video
        ref={videoRef}
        style={{ width: '100%', maxHeight: '70vh', background: '#000', display: 'block' }}
        controls
        muted
        autoPlay
        playsInline
      />
      <div style={{ display: 'flex', gap: 8, padding: '10px 16px', background: 'rgba(0,0,0,0.8)', flexWrap: 'wrap' }}>
        {/* Go Live button */}
        <button
          onClick={() => { if (videoRef.current && hlsRef.current) { hlsRef.current.liveSyncPosition && (videoRef.current.currentTime = hlsRef.current.liveSyncPosition); } }}
          style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} /> AO VIVO
        </button>

        {/* Camera switch */}
        {cams.length > 1 && cams.map(([camId, _url]) => (
          <button
            key={camId}
            onClick={() => setActiveCam(camId)}
            style={{
              padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: activeCam === camId ? '#F58A25' : 'rgba(255,255,255,0.1)',
              color: activeCam === camId ? '#fff' : '#94a3b8',
              fontWeight: 600, fontSize: '0.8rem',
            }}
          >
            {camId.replace('cam', 'Camera ')}
          </button>
        ))}
      </div>
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
}: {
  individualPlayers: { id: number; player_name: string; side: 'left' | 'right' }[];
  generatedPairs: { team_name: string; left_player: string; right_player: string }[];
  bracketGenerated: boolean;
  pairingMode: string;
  teamSize: number;
  lastPairsDrawAt: string | null;
  lastBracketDrawAt: string | null;
  pairsRevealAt: string | null;
}) {
  // State: 'idle' | 'shuffling' | 'revealing' | 'done'
  const [phase, setPhase] = useState<'idle' | 'shuffling' | 'revealing' | 'done'>('idle');
  const [revealCount, setRevealCount] = useState(0);
  const prevPairsCount = useRef(generatedPairs.length);
  const prevBracketRef = useRef(bracketGenerated);
  const timerRef = useRef<any>(null);

  const leftPlayers = individualPlayers.filter(p => p.side === 'left');
  const rightPlayers = individualPlayers.filter(p => p.side === 'right');

  // If scheduled reveal is in the future, hide pairs from view
  const isRevealPending = pairsRevealAt && new Date(pairsRevealAt).getTime() > Date.now();
  const hasPairs = generatedPairs.length > 0 && !isRevealPending;

  // On first render: if pairs already exist and revealed, skip straight to done
  useEffect(() => {
    if (hasPairs) { setPhase('done'); setRevealCount(999); }
  }, []);

  // Scheduled reveal: countdown + force refresh when time arrives
  const [countdown, setCountdown] = useState<number | null>(null);
  useEffect(() => {
    if (!pairsRevealAt || hasPairs) { setCountdown(null); return; }
    const target = new Date(pairsRevealAt).getTime();
    const tick = () => {
      const rem = Math.ceil((target - Date.now()) / 1000);
      if (rem <= 0) {
        setCountdown(null);
        // Time reached — force shuffle animation (pairs will appear on next poll)
        setPhase('shuffling');
        setRevealCount(0);
      } else {
        setCountdown(rem);
      }
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [pairsRevealAt, hasPairs]);

  // Detect NEW pairs appearing (0 → N): start shuffle, then reveal
  useEffect(() => {
    if (generatedPairs.length > 0 && prevPairsCount.current === 0) {
      // If already shuffling (from scheduled countdown), go to reveal after 5s
      // If not shuffling yet, start shuffle 10s then reveal
      const shuffleDuration = phase === 'shuffling' ? 5000 : 10000;
      if (phase !== 'shuffling') {
        setPhase('shuffling');
        setRevealCount(0);
      }
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setPhase('revealing');
        let i = 0;
        const iv = setInterval(() => {
          i++;
          setRevealCount(i);
          if (i >= generatedPairs.length) {
            clearInterval(iv);
            setTimeout(() => setPhase('done'), 500);
          }
        }, 800);
      }, 10000);
    }
    prevPairsCount.current = generatedPairs.length;
  }, [generatedPairs.length]);

  // Detect bracket generated (false → true)
  useEffect(() => {
    if (bracketGenerated && !prevBracketRef.current) {
      // Bracket just appeared — no long animation, just mark done
      setPhase('done');
      setRevealCount(999);
    }
    prevBracketRef.current = bracketGenerated;
  }, [bracketGenerated]);

  // Detect pairs removed (N → 0) = new round
  useEffect(() => {
    if (generatedPairs.length === 0 && prevPairsCount.current > 0) {
      setPhase('idle');
      setRevealCount(0);
    }
  }, [generatedPairs.length]);

  // Cleanup
  useEffect(() => { return () => { if (timerRef.current) clearTimeout(timerRef.current); }; }, []);

  // Nothing to show
  if (individualPlayers.length === 0 && !hasPairs) return null;
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
      </h2>

      {/* Shuffle animation — only when transitioning from 0 pairs to N pairs */}
      {phase === 'shuffling' && (
        <div className="tp-pairing-shuffle-overlay">
          <div className="tp-pairing-shuffle-container">
            <div className="tp-pairing-shuffle-names">
              {individualPlayers.map((p, i) => (
                <span key={p.id} className={`tp-pairing-shuffle-name ${p.side}`}
                  style={{ animationDelay: `${i * 0.2}s`, animationDuration: `${1.5 + Math.random()}s` }}>
                  {p.player_name}
                </span>
              ))}
            </div>
            <div className="tp-pairing-shuffle-spinner" />
            <div className="tp-pairing-shuffle-text">Sorteando duplas...</div>
          </div>
        </div>
      )}

      {/* Idle: show players awaiting draw */}
      {phase === 'idle' && !hasPairs && individualPlayers.length > 0 && (
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

      {/* Revealing pairs one by one */}
      {(phase === 'revealing' || phase === 'done') && hasPairs && (
        <div className="tp-pairing-results">
          <div className="tp-pairing-pairs-grid">
            {generatedPairs.map((pair, idx) => (
              <div key={idx} className={`tp-pairing-pair-card ${revealCount > idx ? 'revealed' : 'hidden'}`}
                style={{ transitionDelay: `${idx * 0.15}s` }}>
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
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.92)' }}>
          <div style={{ position: 'absolute', bottom: -10, left: '-10%', right: '-10%', height: '50%', background: 'radial-gradient(ellipse at 50% 100%, rgba(245,138,37,0.5) 0%, rgba(239,68,68,0.2) 40%, transparent 70%)', animation: 'tp-fire-wave 3s ease-in-out infinite, tp-fire-flicker 2s ease-in-out infinite', pointerEvents: 'none', filter: 'blur(25px)' }} />
          <div style={{ position: 'absolute', bottom: -5, left: '-5%', right: '-5%', height: '35%', background: 'radial-gradient(ellipse at 50% 100%, rgba(239,68,68,0.55) 0%, rgba(245,138,37,0.2) 35%, transparent 65%)', animation: 'tp-fire-wave 2s ease-in-out infinite reverse, tp-fire-flicker 1.5s ease-in-out infinite alternate', pointerEvents: 'none', filter: 'blur(18px)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: '5%', right: '5%', height: '22%', background: 'radial-gradient(ellipse at 50% 100%, rgba(255,220,80,0.45) 0%, rgba(245,138,37,0.15) 40%, transparent 70%)', animation: 'tp-fire-wave 2.5s ease-in-out infinite, tp-fire-flicker 1s ease-in-out infinite alternate-reverse', pointerEvents: 'none', filter: 'blur(12px)' }} />
          <div style={{ fontSize: '4rem', marginBottom: 16, animation: 'pointPop 0.8s ease-out', filter: 'drop-shadow(0 0 20px rgba(245,138,37,0.5))' }}>
            <svg width="80" height="80" viewBox="0 0 24 24" fill="#F58A25" stroke="none"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#F58A25', textTransform: 'uppercase', letterSpacing: 4, textShadow: '0 0 40px rgba(245,138,37,0.6)', animation: 'pointPop 1s ease-out' }}>
            Confrontos Definidos!
          </div>
          <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: 16 }}>A chave sera exibida em instantes...</div>
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
