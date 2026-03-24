import { useRef, useEffect } from 'react';

interface LiveMatchAnimationProps {
  category: 'volei' | 'futevolei' | 'futebol' | 'beach_tennis' | null;
  team1Name: string;
  team2Name: string;
  team1Score: number;
  team2Score: number;
  isLive: boolean;
}

export default function LiveMatchAnimation({
  category,
  team1Name,
  team2Name,
  team1Score,
  team2Score,
  isLive,
}: LiveMatchAnimationProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const prevScoresRef = useRef({ a: team1Score, b: team2Score });

  // Build animation URL
  const animFile = category === 'beach_tennis' ? 'beach_tennis'
    : category === 'futevolei' ? 'futevolei'
    : category === 'futebol' ? 'futebol'
    : category === 'volei' ? 'volei'
    : 'volei'; // default

  const animUrl = `/animations/${animFile}.html?team1=${encodeURIComponent(team1Name)}&team2=${encodeURIComponent(team2Name)}&score1=${team1Score}&score2=${team2Score}`;

  // Send score updates via postMessage
  useEffect(() => {
    if (!iframeRef.current?.contentWindow) return;

    if (team1Score > prevScoresRef.current.a) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ team: 'a', type: category === 'futebol' ? 'goal' : 'point' }),
        '*'
      );
    }
    if (team2Score > prevScoresRef.current.b) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ team: 'b', type: category === 'futebol' ? 'goal' : 'point' }),
        '*'
      );
    }

    prevScoresRef.current = { a: team1Score, b: team2Score };
  }, [team1Score, team2Score, category]);

  if (!isLive || !category) return null;

  return (
    <div style={{
      width: '100%',
      aspectRatio: '16/9',
      maxHeight: '400px',
      borderRadius: '12px',
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.1)',
      background: '#080810',
      position: 'relative',
    }}>
      <iframe
        ref={iframeRef}
        src={animUrl}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
        }}
        title="Match Animation"
        allow="autoplay"
      />
      <div style={{
        position: 'absolute',
        top: 8,
        right: 8,
        background: 'rgba(239,68,68,0.9)',
        color: '#fff',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: '0.7rem',
        fontWeight: 700,
        letterSpacing: '0.05em',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: '#fff',
          animation: 'pulse 1.5s infinite',
        }} />
        AO VIVO
      </div>
    </div>
  );
}
