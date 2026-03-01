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

function MatchCard({ match, onClick, interactive }: { match: TournamentMatch; onClick?: (m: TournamentMatch) => void; interactive?: boolean }) {
  const isClickable = interactive && match.status !== 'completed' && !match.is_bye && match.team1_id && match.team2_id;

  return (
    <div className="bracket-match-wrapper">
      <div
        className={`bracket-match ${match.status} ${match.is_bye ? 'bye' : ''} ${isClickable ? 'clickable' : ''}`}
        onClick={() => isClickable && onClick?.(match)}
      >
        <span className="bracket-match-number">#{match.match_number}</span>
        {match.status === 'live' && <span className="bracket-live-badge">AO VIVO</span>}

        <div className={`bracket-match-team ${match.winner_id && match.winner_id === match.team1_id ? 'winner' : ''}`}>
          <span className={`bracket-match-team-name ${!match.team1_name ? 'empty' : ''}`}>
            {match.team1_name || 'A definir'}
          </span>
          {match.team1_score !== null && match.team1_score !== undefined && (
            <span className="bracket-match-team-score">{match.team1_score}</span>
          )}
        </div>
        <div className={`bracket-match-team ${match.winner_id && match.winner_id === match.team2_id ? 'winner' : ''}`}>
          <span className={`bracket-match-team-name ${!match.team2_name ? 'empty' : ''}`}>
            {match.team2_name || 'A definir'}
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
  const getRoundLabel = (bracketType: string, roundIndex: number, totalRounds: number) => {
    if (bracketType === 'winners') {
      if (roundIndex === totalRounds - 1) return 'Final WB';
      if (roundIndex === totalRounds - 2) return 'Semi WB';
      return `Round ${roundIndex + 1}`;
    }
    return `LB Round ${roundIndex + 1}`;
  };

  return (
    <div className="bracket-container">
      {/* Winners Bracket */}
      {winners && winners.length > 0 && (
        <div className="bracket-section">
          <div className="bracket-section-title">Chave dos Vencedores</div>
          <div className="bracket-rounds">
            {winners.map((round, roundIdx) => (
              <div key={`wb-${roundIdx}`} className="bracket-round">
                <div className="bracket-round-label">
                  {getRoundLabel('winners', roundIdx, winners.length)}
                </div>
                {round && round.map(match => (
                  <MatchCard key={match.id} match={match} onClick={onMatchClick} interactive={interactive} />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grand Final */}
      {grandFinal && (
        <div className="bracket-section">
          <div className="bracket-grand-final">
            <div>
              <div className="bracket-gf-label">Grande Final</div>
              <MatchCard match={grandFinal} onClick={onMatchClick} interactive={interactive} />
            </div>
          </div>
        </div>
      )}

      {/* Losers Bracket */}
      {losers && losers.length > 0 && losers.some(r => r && r.length > 0) && (
        <div className="bracket-section">
          <div className="bracket-section-title">Chave dos Perdedores</div>
          <div className="bracket-rounds">
            {losers.map((round, roundIdx) => (
              round && round.length > 0 ? (
                <div key={`lb-${roundIdx}`} className="bracket-round">
                  <div className="bracket-round-label">
                    {getRoundLabel('losers', roundIdx, losers.length)}
                  </div>
                  {round.map(match => (
                    <MatchCard key={match.id} match={match} onClick={onMatchClick} interactive={interactive} />
                  ))}
                </div>
              ) : null
            ))}
          </div>
        </div>
      )}

      {/* Third Place */}
      {thirdPlace && (
        <div className="bracket-section">
          <div className="bracket-grand-final">
            <div>
              <div className="bracket-gf-label" style={{ color: '#d97706' }}>Disputa de 3o Lugar</div>
              <MatchCard match={thirdPlace} onClick={onMatchClick} interactive={interactive} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
