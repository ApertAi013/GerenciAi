import type { TournamentMatch } from '../services/tournamentService';
import '../styles/Bracket.css';

interface BracketViewerProps {
  winners: TournamentMatch[][];
  losers: TournamentMatch[][];
  grandFinal?: TournamentMatch | null;
  thirdPlace?: TournamentMatch | null;
  onMatchClick?: (match: TournamentMatch) => void;
  interactive?: boolean;
}

function getPlaceholder(match: TournamentMatch, slot: 1 | 2, allMatches?: TournamentMatch[], displayMap?: Map<number, number>): string {
  if (!allMatches) return 'A definir';
  const feeder = allMatches.find(m =>
    (slot === 1 && m.next_winner_match_id === match.id && m.next_winner_slot === 1) ||
    (slot === 1 && m.next_loser_match_id === match.id && m.next_loser_slot === 1) ||
    (slot === 2 && m.next_winner_match_id === match.id && m.next_winner_slot === 2) ||
    (slot === 2 && m.next_loser_match_id === match.id && m.next_loser_slot === 2)
  );
  if (!feeder) return 'A definir';
  const num = displayMap?.get(feeder.id) || feeder.match_number;
  const isWinner = feeder.next_winner_match_id === match.id && feeder.next_winner_slot === slot;
  return isWinner ? `Venc. #${num}` : `Perd. #${num}`;
}

function MatchCard({ match, onClick, interactive, allMatches, displayMap }: { match: TournamentMatch; onClick?: (m: TournamentMatch) => void; interactive?: boolean; allMatches?: TournamentMatch[]; displayMap?: Map<number, number> }) {
  const hasBothTeams = !!match.team1_id && !!match.team2_id;
  const isClickable = interactive && match.status !== 'completed' && !match.is_bye && hasBothTeams;
  const isReadyToPlay = hasBothTeams && match.status === 'pending' && !match.is_bye;

  return (
    <div className="bracket-match-wrapper">
      <div
        className={`bracket-match ${match.status} ${match.is_bye ? 'bye' : ''} ${isClickable ? 'clickable' : ''} ${isReadyToPlay ? 'ready-to-play' : ''}`}
        onClick={() => isClickable && onClick?.(match)}
      >
        <span className="bracket-match-number">#{displayMap?.get(match.id) || match.match_number}</span>
        {match.status === 'live' && <span className="bracket-live-badge">AO VIVO</span>}

        <div className={`bracket-match-team ${match.winner_id && match.winner_id === match.team1_id ? 'winner' : ''}`}>
          <span className={`bracket-match-team-name ${!match.team1_name ? 'empty' : ''}`}>
            {match.team1_name || getPlaceholder(match, 1, allMatches, displayMap)}
          </span>
          {match.team1_score !== null && match.team1_score !== undefined && (
            <span className="bracket-match-team-score">{match.team1_score}</span>
          )}
        </div>
        <div className={`bracket-match-team ${match.winner_id && match.winner_id === match.team2_id ? 'winner' : ''}`}>
          <span className={`bracket-match-team-name ${!match.team2_name ? 'empty' : ''}`}>
            {match.team2_name || getPlaceholder(match, 2, allMatches, displayMap)}
          </span>
          {match.team2_score !== null && match.team2_score !== undefined && (
            <span className="bracket-match-team-score">{match.team2_score}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BracketViewer({ winners, losers, grandFinal, thirdPlace, onMatchClick, interactive }: BracketViewerProps) {
  const getWinnersLabel = (roundIndex: number, totalRounds: number) => {
    if (roundIndex === totalRounds - 1) return 'Semifinal';
    if (roundIndex === totalRounds - 2) return 'Quartas';
    if (totalRounds >= 4 && roundIndex === totalRounds - 3) return 'Oitavas';
    if (totalRounds >= 5 && roundIndex === totalRounds - 4) return '16 avos';
    return `Rodada ${roundIndex + 1}`;
  };

  const getLosersLabel = (roundIndex: number, totalRounds: number) => {
    if (roundIndex === totalRounds - 1) return 'Quartas';
    if (roundIndex === totalRounds - 2) return 'Quartas Repescagem';
    return `Rodada ${roundIndex + 1}`;
  };

  const hasLosers = losers && losers.length > 0 && losers.some(r => r && r.length > 0);

  // Collect all matches for placeholder resolution
  const allMatches: TournamentMatch[] = [
    ...(winners?.flat() || []),
    ...(losers?.flat() || []),
    ...(grandFinal ? [grandFinal] : []),
    ...(thirdPlace ? [thirdPlace] : []),
  ];

  // Build display number map: only count non-BYE matches, sequential
  const displayNumberMap = new Map<number, number>();
  const sorted = [...allMatches].filter(m => !m.is_bye).sort((a, b) => a.match_number - b.match_number);
  sorted.forEach((m, i) => displayNumberMap.set(m.id, i + 1));

  return (
    <div className="bracket-container">
      {/* Main layout: Winners → Center (Finals) ← Losers (mirrored) */}
      <div className="bracket-main-layout">
        {/* Winners Bracket (left, flows left→right) */}
        {winners && winners.length > 0 && (
          <div className="bracket-half bracket-winners-half">
            <div className="bracket-section">
              <div className="bracket-section-title">CHAVE PRINCIPAL</div>
              <div className="bracket-rounds">
                {winners.map((round, roundIdx) => (
                  <div key={`wb-${roundIdx}`} className="bracket-round">
                    <div className="bracket-round-label">
                      {getWinnersLabel(roundIdx, winners.length)}
                    </div>
                    {round && round.map(match => (
                      <MatchCard key={match.id} match={match} onClick={onMatchClick} interactive={interactive} allMatches={allMatches} displayMap={displayNumberMap} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Center: Grand Final & 3rd Place */}
        {(grandFinal || thirdPlace) && (
          <div className="bracket-center">
            {grandFinal && (
              <div className="bracket-section">
                <div className="bracket-grand-final">
                  <div>
                    <div className="bracket-gf-label">Grande Final</div>
                    <MatchCard match={grandFinal} onClick={onMatchClick} interactive={interactive} allMatches={allMatches} displayMap={displayNumberMap} />
                  </div>
                </div>
              </div>
            )}
            {thirdPlace && (
              <div className="bracket-section">
                <div className="bracket-grand-final">
                  <div>
                    <div className="bracket-gf-label" style={{ color: '#d97706' }}>Disputa de 3º Lugar</div>
                    <MatchCard match={thirdPlace} onClick={onMatchClick} interactive={interactive} allMatches={allMatches} displayMap={displayNumberMap} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Losers Bracket (right, flows right→left = MIRRORED) */}
        {hasLosers && (
          <div className="bracket-half bracket-losers-half">
            <div className="bracket-section">
              <div className="bracket-section-title">CHAVE DOS PERDEDORES</div>
              <div className="bracket-rounds bracket-rounds-mirrored">
                {[...losers].reverse().map((round, revIdx) => {
                  const actualIdx = losers.length - 1 - revIdx;
                  return round && round.length > 0 ? (
                    <div key={`lb-${actualIdx}`} className="bracket-round">
                      <div className="bracket-round-label">
                        {getLosersLabel(actualIdx, losers.length)}
                      </div>
                      {round.map(match => (
                        <MatchCard key={match.id} match={match} onClick={onMatchClick} interactive={interactive} allMatches={allMatches} displayMap={displayNumberMap} />
                      ))}
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fallback: Grand Final & 3rd Place below if no losers bracket */}
      {!hasLosers && (grandFinal || thirdPlace) && (
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {grandFinal && (
            <div className="bracket-section">
              <div className="bracket-grand-final">
                <div>
                  <div className="bracket-gf-label">Grande Final</div>
                  <MatchCard match={grandFinal} onClick={onMatchClick} interactive={interactive} allMatches={allMatches} displayMap={displayNumberMap} />
                </div>
              </div>
            </div>
          )}
          {thirdPlace && (
            <div className="bracket-section">
              <div className="bracket-grand-final">
                <div>
                  <div className="bracket-gf-label" style={{ color: '#d97706' }}>Disputa de 3º Lugar</div>
                  <MatchCard match={thirdPlace} onClick={onMatchClick} interactive={interactive} allMatches={allMatches} displayMap={displayNumberMap} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
