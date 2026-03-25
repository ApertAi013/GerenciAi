import { useRef, useEffect } from 'react';

interface LiveMatchAnimationProps {
  category: 'volei' | 'futevolei' | 'futebol' | 'beach_tennis' | null;
  team1Name: string;
  team2Name: string;
  team1Score: number;
  team2Score: number;
  isLive: boolean;
  teamSize?: number;
}

export default function LiveMatchAnimation({
  category,
  team1Name,
  team2Name,
  team1Score,
  team2Score,
  isLive,
  teamSize = 2,
}: LiveMatchAnimationProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const prevScoresRef = useRef({ a: team1Score, b: team2Score });

  // Futebol keeps the old animation, everything else uses neon-arena
  const isFutebol = category === 'futebol';

  const animUrl = isFutebol
    ? `${import.meta.env.VITE_API_URL || 'https://gerenciai-backend-798546007335.us-east1.run.app'}/public/animations/futebol.html?embed=true&team1=${encodeURIComponent(team1Name)}&team2=${encodeURIComponent(team2Name)}&score1=${team1Score}&score2=${team2Score}`
    : `/animations/neon-arena.html?embed=true&team_size=${teamSize}&team1=${encodeURIComponent(team1Name)}&team2=${encodeURIComponent(team2Name)}&score1=${team1Score}&score2=${team2Score}`;

  useEffect(() => {
    if (!iframeRef.current?.contentWindow) return;

    if (team1Score > prevScoresRef.current.a) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ team: 'a', type: isFutebol ? 'goal' : 'point' }),
        '*'
      );
    }
    if (team2Score > prevScoresRef.current.b) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ team: 'b', type: isFutebol ? 'goal' : 'point' }),
        '*'
      );
    }

    prevScoresRef.current = { a: team1Score, b: team2Score };
  }, [team1Score, team2Score, isFutebol]);

  if (!isLive || !category) return null;

  return (
    <iframe
      ref={iframeRef}
      src={animUrl}
      style={{
        width: '100%',
        height: '400px',
        border: 'none',
        background: 'transparent',
        display: 'block',
        marginTop: '-10px',
      }}
      title="Match Animation"
      allow="autoplay"
      // @ts-ignore
      allowtransparency="true"
    />
  );
}
