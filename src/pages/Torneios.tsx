import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faTrophy, faSpinner, faCalendar, faMapMarkerAlt,
  faUsers, faPlay, faStop, faCheck, faTimes, faCopy, faLink,
  faCamera, faMedal, faChevronRight, faCircle,
} from '@fortawesome/free-solid-svg-icons';
import { tournamentService } from '../services/tournamentService';
import type { Tournament, TournamentTeam, BracketData, TournamentMatch, TournamentRanking } from '../services/tournamentService';
import BracketViewer from '../components/BracketViewer';
import toast from 'react-hot-toast';
import '../styles/Torneios.css';
import '../styles/Bracket.css';
import '../styles/ModernModal.css';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho', registration: 'Inscrições', ready: 'Pronto',
  live: 'Ao Vivo', finished: 'Finalizado', cancelled: 'Cancelado',
};
const STATUS_FILTERS = [
  { key: 'all', label: 'Todos' }, { key: 'draft', label: 'Rascunho' },
  { key: 'registration', label: 'Inscrições' }, { key: 'live', label: 'Ao Vivo' },
  { key: 'finished', label: 'Finalizados' },
];

export default function Torneios() {
  const [tab, setTab] = useState<'tournaments' | 'live' | 'ranking'>('tournaments');
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [rankings, setRankings] = useState<TournamentRanking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Create/Edit modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);

  // Detail modal
  const [selectedTournament, setSelectedTournament] = useState<(Tournament & { teams?: TournamentTeam[] }) | null>(null);
  const [detailTab, setDetailTab] = useState<'info' | 'teams' | 'bracket' | 'matches'>('info');
  const [bracketData, setBracketData] = useState<BracketData | null>(null);
  const [bracketLoading, setBracketLoading] = useState(false);

  // Match management
  const [selectedMatch, setSelectedMatch] = useState<TournamentMatch | null>(null);
  const [matchWinner, setMatchWinner] = useState<number | null>(null);
  const [matchScores, setMatchScores] = useState<{ team1: number; team2: number }>({ team1: 0, team2: 0 });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [tourRes, rankRes] = await Promise.all([
        tournamentService.getTournaments(),
        tournamentService.getRankings(),
      ]);
      setTournaments(tourRes.data || []);
      setRankings(rankRes.data || []);
    } catch (err) {
      console.error('Tournament fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const openDetail = async (t: Tournament) => {
    try {
      const res = await tournamentService.getTournament(t.id);
      setSelectedTournament(res.data);
      setDetailTab('info');
      setBracketData(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao carregar torneio');
    }
  };

  const loadBracket = async (tournamentId: number) => {
    setBracketLoading(true);
    try {
      const res = await tournamentService.getBracket(tournamentId);
      setBracketData(res.data);
    } catch (err) {
      console.error('Bracket error:', err);
    } finally {
      setBracketLoading(false);
    }
  };

  const handleGenerateBracket = async () => {
    if (!selectedTournament) return;
    if (!confirm('Gerar chave do torneio? Isso irá recriar toda a chave.')) return;
    try {
      const res = await tournamentService.generateBracket(selectedTournament.id);
      setBracketData(res.data);
      toast.success('Chave gerada com sucesso!');
      // Refresh tournament
      const tRes = await tournamentService.getTournament(selectedTournament.id);
      setSelectedTournament(tRes.data);
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao gerar chave');
    }
  };

  const handleStartTournament = async () => {
    if (!selectedTournament) return;
    if (!confirm('Iniciar torneio? Ele ficará com status "Ao Vivo".')) return;
    try {
      await tournamentService.startTournament(selectedTournament.id);
      toast.success('Torneio iniciado!');
      const tRes = await tournamentService.getTournament(selectedTournament.id);
      setSelectedTournament(tRes.data);
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao iniciar');
    }
  };

  const handleFinishTournament = async () => {
    if (!selectedTournament) return;
    if (!confirm('Finalizar torneio?')) return;
    try {
      await tournamentService.finishTournament(selectedTournament.id);
      toast.success('Torneio finalizado!');
      setSelectedTournament(null);
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro');
    }
  };

  const handleDeleteTournament = async () => {
    if (!selectedTournament) return;
    if (!confirm('Cancelar este torneio?')) return;
    try {
      await tournamentService.deleteTournament(selectedTournament.id);
      toast.success('Torneio cancelado');
      setSelectedTournament(null);
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro');
    }
  };

  // ─── Match actions ───
  const handleStartMatch = async (match: TournamentMatch) => {
    if (!selectedTournament) return;
    try {
      await tournamentService.startMatch(selectedTournament.id, match.id);
      toast.success('Partida iniciada!');
      loadBracket(selectedTournament.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro');
    }
  };

  const handleScoreUpdate = async (match: TournamentMatch, teamId: number, action: 'score' | 'undo_score') => {
    if (!selectedTournament) return;
    try {
      await tournamentService.updateMatchScore(selectedTournament.id, match.id, { team_id: teamId, action });
      loadBracket(selectedTournament.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro');
    }
  };

  const handleDeclareWinner = async (match: TournamentMatch, winnerId: number) => {
    if (!selectedTournament) return;
    if (!confirm('Declarar vencedor desta partida?')) return;
    try {
      const res = await tournamentService.reportMatchResult(selectedTournament.id, match.id, {
        winner_id: winnerId,
        team1_score: match.team1_score || 0,
        team2_score: match.team2_score || 0,
      });
      setBracketData(res.data);
      toast.success('Resultado registrado!');
      // Refresh tournament status
      const tRes = await tournamentService.getTournament(selectedTournament.id);
      setSelectedTournament(tRes.data);
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro');
    }
  };

  // ─── Team management ───
  const [newTeamName, setNewTeamName] = useState('');

  const handleAddTeam = async () => {
    if (!selectedTournament || !newTeamName.trim()) return;
    try {
      await tournamentService.addTeam(selectedTournament.id, {
        name: newTeamName.trim(),
        members: [{ external_name: newTeamName.trim() }],
      });
      setNewTeamName('');
      toast.success('Equipe adicionada!');
      const tRes = await tournamentService.getTournament(selectedTournament.id);
      setSelectedTournament(tRes.data);
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro');
    }
  };

  const handleRemoveTeam = async (teamId: number) => {
    if (!selectedTournament) return;
    if (!confirm('Remover esta equipe?')) return;
    try {
      await tournamentService.removeTeam(selectedTournament.id, teamId);
      toast.success('Equipe removida');
      const tRes = await tournamentService.getTournament(selectedTournament.id);
      setSelectedTournament(tRes.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro');
    }
  };

  const handleApproveTeam = async (teamId: number) => {
    if (!selectedTournament) return;
    try {
      await tournamentService.approveTeam(selectedTournament.id, teamId);
      toast.success('Equipe aprovada!');
      const tRes = await tournamentService.getTournament(selectedTournament.id);
      setSelectedTournament(tRes.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro');
    }
  };

  const copyRegistrationLink = () => {
    if (!selectedTournament?.registration_token) return;
    const url = `${window.location.origin}/torneio/${selectedTournament.registration_token}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado!');
  };

  // ─── Filtered tournaments ───
  const filtered = statusFilter === 'all'
    ? tournaments.filter(t => t.status !== 'cancelled')
    : tournaments.filter(t => t.status === statusFilter);

  const liveTournaments = tournaments.filter(t => t.status === 'live');

  // ─── Create/Edit Modal ───
  const CreateModal = () => {
    const [title, setTitle] = useState(editingTournament?.title || '');
    const [description, setDescription] = useState(editingTournament?.description || '');
    const [tournamentDate, setTournamentDate] = useState(editingTournament?.tournament_date?.split('T')[0] || '');
    const [endDate, setEndDate] = useState(editingTournament?.tournament_end_date?.split('T')[0] || '');
    const [location, setLocation] = useState(editingTournament?.location || '');
    const [format, setFormat] = useState(editingTournament?.format || 'double_elimination');
    const [teamSize, setTeamSize] = useState(String(editingTournament?.team_size || 1));
    const [maxParticipants, setMaxParticipants] = useState(editingTournament?.max_participants ? String(editingTournament.max_participants) : '');
    const [registrationMode, setRegistrationMode] = useState(editingTournament?.registration_mode || 'manual');
    const [requireApproval, setRequireApproval] = useState(editingTournament?.require_approval || false);
    const [showScores, setShowScores] = useState(editingTournament?.show_scores_to_students !== false);
    const [thirdPlaceMatch, setThirdPlaceMatch] = useState(editingTournament?.third_place_match || false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async () => {
      if (!title.trim() || !tournamentDate) {
        toast.error('Título e data são obrigatórios');
        return;
      }
      setSaving(true);
      try {
        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('description', description);
        formData.append('tournament_date', tournamentDate);
        if (endDate) formData.append('tournament_end_date', endDate);
        formData.append('location', location);
        formData.append('format', format);
        formData.append('team_size', teamSize);
        if (maxParticipants) formData.append('max_participants', maxParticipants);
        formData.append('registration_mode', registrationMode);
        formData.append('require_approval', String(requireApproval));
        formData.append('show_scores_to_students', String(showScores));
        formData.append('third_place_match', String(thirdPlaceMatch));
        if (imageFile) formData.append('image', imageFile);

        if (editingTournament) {
          await tournamentService.updateTournament(editingTournament.id, formData);
          toast.success('Torneio atualizado!');
        } else {
          await tournamentService.createTournament(formData);
          toast.success('Torneio criado!');
        }
        setShowCreateModal(false);
        setEditingTournament(null);
        fetchAll();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Erro ao salvar');
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="mm-overlay" onClick={() => { setShowCreateModal(false); setEditingTournament(null); }}>
        <div className="mm-modal mm-modal-md" onClick={e => e.stopPropagation()}>
          <div className="mm-header">
            <h3>{editingTournament ? 'Editar Torneio' : 'Novo Torneio'}</h3>
            <button className="mm-close" onClick={() => { setShowCreateModal(false); setEditingTournament(null); }}>&times;</button>
          </div>
          <div className="mm-content">
            <div className="mm-field">
              <label>Título *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Copa Arena Beach Tennis" />
            </div>
            <div className="mm-field">
              <label>Descrição</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Descrição do torneio..." />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="mm-field">
                <label>Data Início *</label>
                <input type="date" value={tournamentDate} onChange={e => setTournamentDate(e.target.value)} />
              </div>
              <div className="mm-field">
                <label>Data Fim</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>
            <div className="mm-field">
              <label>Localização</label>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Ex: Arena Beach Sports" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="mm-field">
                <label>Formato</label>
                <select value={format} onChange={e => setFormat(e.target.value as any)}>
                  <option value="double_elimination">Dupla Eliminatória</option>
                  <option value="single_elimination">Eliminatória Simples</option>
                </select>
              </div>
              <div className="mm-field">
                <label>Tamanho da Equipe</label>
                <select value={teamSize} onChange={e => setTeamSize(e.target.value)}>
                  <option value="1">Individual (1x1)</option>
                  <option value="2">Dupla (2x2)</option>
                  <option value="3">Trio (3x3)</option>
                  <option value="4">Quarteto (4x4)</option>
                  <option value="5">Quinteto (5x5)</option>
                </select>
              </div>
            </div>
            <div className="mm-field">
              <label>Máximo de participantes (opcional)</label>
              <input type="number" value={maxParticipants} onChange={e => setMaxParticipants(e.target.value)} placeholder="Ex: 16" />
            </div>
            <div className="mm-field">
              <label>Modo de Inscrição</label>
              <select value={registrationMode} onChange={e => setRegistrationMode(e.target.value as any)}>
                <option value="manual">Manual — Você adiciona as equipes</option>
                <option value="link">Link Público — Envie um link para inscrição</option>
                <option value="open">Aberto — Alunos se inscrevem pelo app</option>
              </select>
              <small style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: 4 }}>
                {registrationMode === 'manual' && 'Você adiciona as equipes manualmente no sistema.'}
                {registrationMode === 'link' && 'Um link será gerado para compartilhar. Qualquer pessoa pode se inscrever por ele.'}
                {registrationMode === 'open' && 'O torneio aparece como aberto para seus alunos no app.'}
              </small>
            </div>
            <div className="mm-field">
              <label>Imagem (opcional)</label>
              <input type="file" ref={fileRef} accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
              <button type="button" className="torneio-btn-outline" onClick={() => fileRef.current?.click()} style={{ width: '100%', textAlign: 'center', padding: '10px', borderRadius: '8px' }}>
                <FontAwesomeIcon icon={faCamera} /> {imageFile ? imageFile.name : 'Selecionar imagem'}
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input type="checkbox" checked={requireApproval} onChange={e => setRequireApproval(e.target.checked)} />
                Exigir aprovação de inscrições
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input type="checkbox" checked={showScores} onChange={e => setShowScores(e.target.checked)} />
                Mostrar placares para alunos
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input type="checkbox" checked={thirdPlaceMatch} onChange={e => setThirdPlaceMatch(e.target.checked)} />
                Disputa de 3º lugar
              </label>
            </div>
          </div>
          <div className="mm-footer">
            <button className="mm-btn-cancel" onClick={() => { setShowCreateModal(false); setEditingTournament(null); }}>Cancelar</button>
            <button className="mm-btn-save" onClick={handleSubmit} disabled={saving}>
              {saving ? <FontAwesomeIcon icon={faSpinner} spin /> : editingTournament ? 'Salvar' : 'Criar Torneio'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── Match Detail Modal ───
  const MatchDetailModal = ({ match, onClose }: { match: TournamentMatch; onClose: () => void }) => {
    return (
      <div className="mm-overlay" onClick={onClose}>
        <div className="mm-modal mm-modal-sm" onClick={e => e.stopPropagation()}>
          <div className="mm-header">
            <h3>Partida #{match.match_number}</h3>
            <button className="mm-close" onClick={onClose}>&times;</button>
          </div>
          <div className="mm-content">
            <div className={`torneio-match-card ${match.status === 'live' ? 'live' : ''}`}>
              <div className="torneio-match-header">
                <span>{match.bracket_type === 'winners' ? 'Chave Vencedores' : match.bracket_type === 'losers' ? 'Chave Perdedores' : 'Grande Final'} — R{match.round_number}</span>
                {match.status === 'live' && (
                  <span className="torneio-live-indicator"><span className="torneio-live-dot" /> AO VIVO</span>
                )}
              </div>
              <div className="torneio-match-teams">
                <div className="torneio-match-team" style={{ flexDirection: 'column', alignItems: 'center' }}>
                  <span className="torneio-match-team-name">{match.team1_name || 'A definir'}</span>
                  {match.status === 'live' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                      <button className="torneio-score-btn minus" onClick={() => handleScoreUpdate(match, match.team1_id!, 'undo_score')}>−</button>
                      <span className="torneio-match-score">{match.team1_score || 0}</span>
                      <button className="torneio-score-btn plus" onClick={() => handleScoreUpdate(match, match.team1_id!, 'score')}>+</button>
                    </div>
                  )}
                  {match.status !== 'live' && match.team1_score !== null && (
                    <span className="torneio-match-score">{match.team1_score}</span>
                  )}
                </div>
                <span className="torneio-match-vs">VS</span>
                <div className="torneio-match-team" style={{ flexDirection: 'column', alignItems: 'center' }}>
                  <span className="torneio-match-team-name">{match.team2_name || 'A definir'}</span>
                  {match.status === 'live' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                      <button className="torneio-score-btn minus" onClick={() => handleScoreUpdate(match, match.team2_id!, 'undo_score')}>−</button>
                      <span className="torneio-match-score">{match.team2_score || 0}</span>
                      <button className="torneio-score-btn plus" onClick={() => handleScoreUpdate(match, match.team2_id!, 'score')}>+</button>
                    </div>
                  )}
                  {match.status !== 'live' && match.team2_score !== null && (
                    <span className="torneio-match-score">{match.team2_score}</span>
                  )}
                </div>
              </div>
              <div className="torneio-match-actions">
                {match.status === 'pending' && match.team1_id && match.team2_id && (
                  <button className="torneio-btn-success" onClick={() => handleStartMatch(match)}>
                    <FontAwesomeIcon icon={faPlay} /> Iniciar Partida
                  </button>
                )}
                {match.status === 'live' && match.team1_id && match.team2_id && (
                  <>
                    <button className="torneio-btn-primary" onClick={() => handleDeclareWinner(match, match.team1_id!)}>
                      {match.team1_name} Venceu
                    </button>
                    <button className="torneio-btn-primary" onClick={() => handleDeclareWinner(match, match.team2_id!)}>
                      {match.team2_name} Venceu
                    </button>
                  </>
                )}
                {match.status === 'pending' && match.team1_id && match.team2_id && (
                  <div style={{ width: '100%', marginTop: '8px' }}>
                    <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '8px' }}>Ou declare o vencedor direto:</p>
                    <div className="torneio-winner-selector">
                      <button className="torneio-winner-btn" onClick={() => handleDeclareWinner(match, match.team1_id!)}>
                        <FontAwesomeIcon icon={faTrophy} /> {match.team1_name}
                      </button>
                      <button className="torneio-winner-btn" onClick={() => handleDeclareWinner(match, match.team2_id!)}>
                        <FontAwesomeIcon icon={faTrophy} /> {match.team2_name}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── Render ───
  if (isLoading) {
    return (
      <div className="torneio-page">
        <div className="torneio-loading"><FontAwesomeIcon icon={faSpinner} spin /> Carregando torneios...</div>
      </div>
    );
  }

  return (
    <div className="torneio-page">
      <div className="torneio-page-header">
        <h1 className="torneio-page-title"><FontAwesomeIcon icon={faTrophy} /> Torneios</h1>
        <button className="torneio-create-btn" onClick={() => { setEditingTournament(null); setShowCreateModal(true); }}>
          <FontAwesomeIcon icon={faPlus} /> Novo Torneio
        </button>
      </div>

      {/* Tabs */}
      <div className="torneio-tabs">
        <button className={`torneio-tab ${tab === 'tournaments' ? 'active' : ''}`} onClick={() => setTab('tournaments')}>
          Torneios
        </button>
        <button className={`torneio-tab ${tab === 'live' ? 'active' : ''}`} onClick={() => setTab('live')}>
          Ao Vivo {liveTournaments.length > 0 && <span style={{ background: '#ef4444', color: '#fff', borderRadius: '50%', padding: '0 6px', marginLeft: 6, fontSize: '0.75rem' }}>{liveTournaments.length}</span>}
        </button>
        <button className={`torneio-tab ${tab === 'ranking' ? 'active' : ''}`} onClick={() => setTab('ranking')}>
          Ranking
        </button>
      </div>

      {/* ─── Tab: Tournaments ─── */}
      {tab === 'tournaments' && (
        <>
          <div className="torneio-filters">
            {STATUS_FILTERS.map(f => (
              <button key={f.key} className={`torneio-filter-chip ${statusFilter === f.key ? 'active' : ''}`} onClick={() => setStatusFilter(f.key)}>
                {f.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="torneio-empty">
              <FontAwesomeIcon icon={faTrophy} />
              <p>Nenhum torneio encontrado</p>
              <small>Crie seu primeiro torneio clicando em "Novo Torneio"</small>
            </div>
          ) : (
            <div className="torneio-grid">
              {filtered.map(t => (
                <div key={t.id} className="torneio-card" onClick={() => openDetail(t)}>
                  {t.image_url ? (
                    <img src={t.image_url} alt={t.title} className="torneio-card-img" />
                  ) : (
                    <div className="torneio-card-img-placeholder">
                      <FontAwesomeIcon icon={faTrophy} />
                    </div>
                  )}
                  <div className="torneio-card-body">
                    <div className="torneio-card-title">{t.title}</div>
                    <div className="torneio-card-meta">
                      <span><FontAwesomeIcon icon={faCalendar} /> {new Date(t.tournament_date).toLocaleDateString('pt-BR')}</span>
                      {t.location && <span><FontAwesomeIcon icon={faMapMarkerAlt} /> {t.location}</span>}
                      <span><FontAwesomeIcon icon={faUsers} /> {t.team_count || 0} equipes</span>
                    </div>
                    <div className="torneio-card-badges">
                      <span className={`torneio-badge torneio-badge-${t.status}`}>
                        {t.status === 'live' && <FontAwesomeIcon icon={faCircle} style={{ fontSize: '0.5rem' }} />}
                        {STATUS_LABELS[t.status]}
                      </span>
                      <span className="torneio-badge torneio-badge-format">
                        {t.format === 'double_elimination' ? 'Dupla Elim.' : 'Elim. Simples'}
                      </span>
                      {t.team_size > 1 && (
                        <span className="torneio-badge torneio-badge-teams">{t.team_size}x{t.team_size}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ─── Tab: Live ─── */}
      {tab === 'live' && (
        <>
          {liveTournaments.length === 0 ? (
            <div className="torneio-empty">
              <FontAwesomeIcon icon={faPlay} />
              <p>Nenhum torneio ao vivo</p>
            </div>
          ) : (
            liveTournaments.map(t => (
              <div key={t.id} style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <span className="torneio-live-indicator"><span className="torneio-live-dot" /> AO VIVO</span>
                  <h3 style={{ margin: 0, cursor: 'pointer' }} onClick={() => openDetail(t)}>{t.title}</h3>
                </div>
                <LiveBracketView tournamentId={t.id} onMatchClick={(m) => setSelectedMatch(m)} />
              </div>
            ))
          )}
        </>
      )}

      {/* ─── Tab: Ranking ─── */}
      {tab === 'ranking' && (
        <>
          {rankings.length === 0 ? (
            <div className="torneio-empty">
              <FontAwesomeIcon icon={faMedal} />
              <p>Nenhum ranking disponível</p>
              <small>Rankings são atualizados ao final de cada torneio</small>
            </div>
          ) : (
            <table className="torneio-ranking-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nome</th>
                  <th>Torneios</th>
                  <th>Vitórias</th>
                  <th>Derrotas</th>
                  <th>Pontos</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((r, i) => (
                  <tr key={r.id}>
                    <td><span className="torneio-ranking-pos">{i + 1}º</span></td>
                    <td>{r.student_name || r.external_name || '-'}</td>
                    <td>{r.tournaments_played}</td>
                    <td>{r.matches_won}</td>
                    <td>{r.matches_lost}</td>
                    <td><strong>{r.ranking_points}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {/* ─── Create/Edit Modal ─── */}
      {showCreateModal && <CreateModal />}

      {/* ─── Detail Modal ─── */}
      {selectedTournament && (
        <div className="mm-overlay" onClick={() => setSelectedTournament(null)}>
          <div className="mm-modal mm-modal-xl" onClick={e => e.stopPropagation()}>
            <div className="mm-header">
              <h3>
                {selectedTournament.status === 'live' && <span className="torneio-live-indicator" style={{ marginRight: 8 }}><span className="torneio-live-dot" /> AO VIVO</span>}
                {selectedTournament.title}
              </h3>
              <button className="mm-close" onClick={() => setSelectedTournament(null)}>&times;</button>
            </div>
            <div className="mm-content">
              {/* Sub-tabs */}
              <div className="torneio-sub-tabs">
                <button className={`torneio-sub-tab ${detailTab === 'info' ? 'active' : ''}`} onClick={() => setDetailTab('info')}>Detalhes</button>
                <button className={`torneio-sub-tab ${detailTab === 'teams' ? 'active' : ''}`} onClick={() => setDetailTab('teams')}>
                  Participantes ({selectedTournament.teams?.length || 0})
                </button>
                <button className={`torneio-sub-tab ${detailTab === 'bracket' ? 'active' : ''}`} onClick={() => { setDetailTab('bracket'); if (!bracketData && selectedTournament.bracket_generated) loadBracket(selectedTournament.id); }}>
                  Chave
                </button>
                <button className={`torneio-sub-tab ${detailTab === 'matches' ? 'active' : ''}`} onClick={() => { setDetailTab('matches'); if (!bracketData && selectedTournament.bracket_generated) loadBracket(selectedTournament.id); }}>
                  Jogos
                </button>
              </div>

              {/* Info tab */}
              {detailTab === 'info' && (
                <div>
                  <div className="torneio-detail-header">
                    {selectedTournament.image_url && (
                      <img src={selectedTournament.image_url} alt="" className="torneio-detail-img" />
                    )}
                    <div className="torneio-detail-info">
                      <h2>{selectedTournament.title}</h2>
                      {selectedTournament.description && <p>{selectedTournament.description}</p>}
                      <p><FontAwesomeIcon icon={faCalendar} /> {new Date(selectedTournament.tournament_date).toLocaleDateString('pt-BR')}{selectedTournament.tournament_end_date ? ` — ${new Date(selectedTournament.tournament_end_date).toLocaleDateString('pt-BR')}` : ''}</p>
                      {selectedTournament.location && <p><FontAwesomeIcon icon={faMapMarkerAlt} /> {selectedTournament.location}</p>}
                      <p><FontAwesomeIcon icon={faUsers} /> {selectedTournament.teams?.length || 0} equipes — {selectedTournament.format === 'double_elimination' ? 'Dupla Eliminatória' : 'Eliminatória Simples'} — {selectedTournament.team_size === 1 ? 'Individual' : `${selectedTournament.team_size}x${selectedTournament.team_size}`}</p>

                      <div className="torneio-detail-actions">
                        <button className="torneio-btn-outline" onClick={() => { setEditingTournament(selectedTournament); setShowCreateModal(true); }}>Editar</button>
                        {selectedTournament.status === 'ready' && (
                          <button className="torneio-btn-success" onClick={handleStartTournament}><FontAwesomeIcon icon={faPlay} /> Iniciar Torneio</button>
                        )}
                        {selectedTournament.status === 'live' && (
                          <button className="torneio-btn-danger" onClick={handleFinishTournament}><FontAwesomeIcon icon={faStop} /> Finalizar</button>
                        )}
                        {selectedTournament.status !== 'live' && selectedTournament.status !== 'finished' && (
                          <button className="torneio-btn-danger" onClick={handleDeleteTournament}><FontAwesomeIcon icon={faTimes} /> Cancelar</button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Registration link */}
                  {selectedTournament.registration_token && (
                    <div className="torneio-link-box">
                      <FontAwesomeIcon icon={faLink} style={{ color: '#94a3b8' }} />
                      <input readOnly value={`${window.location.origin}/torneio/${selectedTournament.registration_token}`} />
                      <button className="torneio-link-copy" onClick={copyRegistrationLink}>
                        <FontAwesomeIcon icon={faCopy} /> Copiar
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Teams tab */}
              {detailTab === 'teams' && (
                <div>
                  {!selectedTournament.bracket_generated && (
                    <div className="torneio-add-team">
                      <input
                        placeholder={selectedTournament.team_size === 1 ? 'Nome do jogador...' : 'Nome da equipe...'}
                        value={newTeamName}
                        onChange={e => setNewTeamName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddTeam()}
                      />
                      <button className="torneio-btn-primary" onClick={handleAddTeam} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
                        <FontAwesomeIcon icon={faPlus} /> Adicionar
                      </button>
                    </div>
                  )}

                  <div className="torneio-teams-list">
                    {selectedTournament.teams?.map(team => (
                      <div key={team.id} className="torneio-team-item">
                        <div className="torneio-team-info">
                          <span className="torneio-team-seed">{team.seed}</span>
                          <div>
                            <span className="torneio-team-name">{team.name || `Equipe ${team.seed}`}</span>
                            {team.members && team.members.length > 0 && (
                              <div className="torneio-team-members">
                                {team.members.map(m => m.name).filter(Boolean).join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {team.status === 'registered' && (
                            <button className="torneio-btn-success" style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }} onClick={() => handleApproveTeam(team.id)}>
                              <FontAwesomeIcon icon={faCheck} /> Aprovar
                            </button>
                          )}
                          <span className="torneio-team-status" style={{
                            background: team.status === 'approved' || team.status === 'active' ? '#dcfce7' : team.status === 'registered' ? '#fef3c7' : team.status === 'champion' ? '#fef08a' : '#f1f5f9',
                            color: team.status === 'approved' || team.status === 'active' ? '#16a34a' : team.status === 'registered' ? '#d97706' : team.status === 'champion' ? '#a16207' : '#64748b',
                          }}>
                            {team.status === 'approved' ? 'Aprovado' : team.status === 'registered' ? 'Pendente' : team.status === 'active' ? 'Ativo' : team.status === 'champion' ? 'Campeão' : team.status === 'runner_up' ? 'Vice' : team.status === 'third_place' ? '3º Lugar' : team.status === 'eliminated_winners' ? 'Elim. WB' : team.status === 'eliminated_losers' ? 'Eliminado' : team.status}
                          </span>
                          {!selectedTournament.bracket_generated && (
                            <button style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '0.8rem' }} onClick={() => handleRemoveTeam(team.id)}>
                              <FontAwesomeIcon icon={faTimes} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedTournament.teams && selectedTournament.teams.length >= 2 && !selectedTournament.bracket_generated && (
                    <div style={{ marginTop: 20, textAlign: 'center' }}>
                      <button className="torneio-btn-primary" onClick={handleGenerateBracket} style={{ padding: '12px 24px', fontSize: '1rem', borderRadius: '10px', border: 'none', cursor: 'pointer' }}>
                        <FontAwesomeIcon icon={faTrophy} /> Gerar Chave do Torneio
                      </button>
                    </div>
                  )}
                  {selectedTournament.bracket_generated && (
                    <div style={{ marginTop: 20, textAlign: 'center' }}>
                      <button className="torneio-btn-outline" onClick={handleGenerateBracket} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                        Regenerar Chave
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Bracket tab */}
              {detailTab === 'bracket' && (
                <div>
                  {bracketLoading ? (
                    <div className="torneio-loading"><FontAwesomeIcon icon={faSpinner} spin /> Carregando chave...</div>
                  ) : bracketData ? (
                    <BracketViewer
                      winners={bracketData.winners}
                      losers={bracketData.losers}
                      grandFinal={bracketData.grand_final}
                      thirdPlace={bracketData.third_place}
                      onMatchClick={(m) => setSelectedMatch(m)}
                      interactive={selectedTournament.status === 'live'}
                    />
                  ) : (
                    <div className="torneio-empty">
                      <FontAwesomeIcon icon={faTrophy} />
                      <p>Chave ainda não foi gerada</p>
                      <small>Adicione as equipes e clique em "Gerar Chave"</small>
                    </div>
                  )}
                </div>
              )}

              {/* Matches tab */}
              {detailTab === 'matches' && (
                <div>
                  {bracketLoading ? (
                    <div className="torneio-loading"><FontAwesomeIcon icon={faSpinner} spin /> Carregando jogos...</div>
                  ) : bracketData ? (
                    <div className="torneio-matches-list">
                      {getAllMatches(bracketData)
                        .filter(m => !m.is_bye)
                        .sort((a, b) => {
                          // Live first, then pending, then completed
                          const order = { live: 0, pending: 1, completed: 2 };
                          return (order[a.status] || 1) - (order[b.status] || 1) || a.match_number - b.match_number;
                        })
                        .map(match => (
                          <div key={match.id} className={`torneio-match-card ${match.status === 'live' ? 'live' : ''}`}>
                            <div className="torneio-match-header">
                              <span>#{match.match_number} — {match.bracket_type === 'winners' ? 'Vencedores' : match.bracket_type === 'losers' ? 'Perdedores' : match.bracket_type === 'grand_final' ? 'Grande Final' : '3º Lugar'} R{match.round_number}</span>
                              {match.status === 'live' && (
                                <span className="torneio-live-indicator"><span className="torneio-live-dot" /> AO VIVO</span>
                              )}
                              {match.status === 'completed' && (
                                <span style={{ color: '#10b981', fontWeight: 600 }}><FontAwesomeIcon icon={faCheck} /> Finalizada</span>
                              )}
                            </div>
                            <div className="torneio-match-teams">
                              <div className={`torneio-match-team ${match.winner_id === match.team1_id ? 'winner' : ''}`} style={{ flexDirection: 'column', alignItems: 'center' }}>
                                <span className="torneio-match-team-name">{match.team1_name || 'A definir'}</span>
                                {match.status === 'live' && match.team1_id && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                                    <button className="torneio-score-btn minus" onClick={() => handleScoreUpdate(match, match.team1_id!, 'undo_score')}>−</button>
                                    <span className="torneio-match-score">{match.team1_score || 0}</span>
                                    <button className="torneio-score-btn plus" onClick={() => handleScoreUpdate(match, match.team1_id!, 'score')}>+</button>
                                  </div>
                                )}
                                {match.status !== 'live' && match.team1_score !== null && match.team1_score !== undefined && (
                                  <span className="torneio-match-score">{match.team1_score}</span>
                                )}
                              </div>
                              <span className="torneio-match-vs">VS</span>
                              <div className={`torneio-match-team ${match.winner_id === match.team2_id ? 'winner' : ''}`} style={{ flexDirection: 'column', alignItems: 'center' }}>
                                <span className="torneio-match-team-name">{match.team2_name || 'A definir'}</span>
                                {match.status === 'live' && match.team2_id && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                                    <button className="torneio-score-btn minus" onClick={() => handleScoreUpdate(match, match.team2_id!, 'undo_score')}>−</button>
                                    <span className="torneio-match-score">{match.team2_score || 0}</span>
                                    <button className="torneio-score-btn plus" onClick={() => handleScoreUpdate(match, match.team2_id!, 'score')}>+</button>
                                  </div>
                                )}
                                {match.status !== 'live' && match.team2_score !== null && match.team2_score !== undefined && (
                                  <span className="torneio-match-score">{match.team2_score}</span>
                                )}
                              </div>
                            </div>
                            {match.status === 'pending' && match.team1_id && match.team2_id && (
                              <div className="torneio-match-actions">
                                <button className="torneio-btn-success" onClick={() => handleStartMatch(match)}>
                                  <FontAwesomeIcon icon={faPlay} /> Iniciar
                                </button>
                                <button className="torneio-btn-primary" onClick={() => handleDeclareWinner(match, match.team1_id!)}>
                                  {match.team1_name} Venceu
                                </button>
                                <button className="torneio-btn-primary" onClick={() => handleDeclareWinner(match, match.team2_id!)}>
                                  {match.team2_name} Venceu
                                </button>
                              </div>
                            )}
                            {match.status === 'live' && match.team1_id && match.team2_id && (
                              <div className="torneio-match-actions">
                                <button className="torneio-btn-primary" onClick={() => handleDeclareWinner(match, match.team1_id!)}>
                                  <FontAwesomeIcon icon={faTrophy} /> {match.team1_name} Venceu
                                </button>
                                <button className="torneio-btn-primary" onClick={() => handleDeclareWinner(match, match.team2_id!)}>
                                  <FontAwesomeIcon icon={faTrophy} /> {match.team2_name} Venceu
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="torneio-empty">
                      <p>Gere a chave para ver os jogos</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Match Detail Modal */}
      {selectedMatch && (
        <MatchDetailModal match={selectedMatch} onClose={() => { setSelectedMatch(null); if (selectedTournament) loadBracket(selectedTournament.id); }} />
      )}
    </div>
  );
}

// ─── Live bracket sub-component ───
function LiveBracketView({ tournamentId, onMatchClick }: { tournamentId: number; onMatchClick: (m: TournamentMatch) => void }) {
  const [bracket, setBracket] = useState<BracketData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tournamentService.getBracket(tournamentId).then(res => {
      setBracket(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [tournamentId]);

  if (loading) return <div className="torneio-loading"><FontAwesomeIcon icon={faSpinner} spin /></div>;
  if (!bracket) return null;

  return (
    <BracketViewer
      winners={bracket.winners}
      losers={bracket.losers}
      grandFinal={bracket.grand_final}
      thirdPlace={bracket.third_place}
      onMatchClick={onMatchClick}
      interactive
    />
  );
}

// ─── Helper ───
function getAllMatches(bracket: BracketData): TournamentMatch[] {
  const all: TournamentMatch[] = [];
  for (const round of bracket.winners || []) {
    if (round) all.push(...round);
  }
  for (const round of bracket.losers || []) {
    if (round) all.push(...round);
  }
  if (bracket.grand_final) all.push(bracket.grand_final);
  if (bracket.third_place) all.push(bracket.third_place);
  return all;
}
