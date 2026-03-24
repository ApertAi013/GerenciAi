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

  const animFile = category === 'beach_tennis' ? 'beach_tennis'
    : category === 'futevolei' ? 'futevolei'
    : category === 'futebol' ? 'futebol'
    : category === 'volei' ? 'volei'
    : 'volei';

  const backendUrl = import.meta.env.VITE_API_URL || 'https://gerenciai-backend-798546007335.us-east1.run.app';
  const animUrl = `${backendUrl}/public/animations/${animFile}.html?embed=true&team1=${encodeURIComponent(team1Name)}&team2=${encodeURIComponent(team2Name)}&score1=${team1Score}&score2=${team2Score}`;

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
