import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faTrophy, faSpinner, faCalendar, faMapMarkerAlt,
  faUsers, faPlay, faStop, faCheck, faTimes, faCopy, faLink,
  faCamera, faMedal, faChevronRight, faCircle, faClock,
} from '@fortawesome/free-solid-svg-icons';
import { tournamentService } from '../services/tournamentService';
import type { Tournament, TournamentTeam, BracketData, TournamentMatch, TournamentRanking, TournamentGroup } from '../services/tournamentService';
import BracketViewer from '../components/BracketViewer';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
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

// ─── Create/Edit Modal (extracted to fix image upload ref issue) ───
function CreateModal({ editingTournament, onClose, onSave }: {
  editingTournament: Tournament | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [title, setTitle] = useState(editingTournament?.title || '');
  const [description, setDescription] = useState(editingTournament?.description || '');
  const [tournamentDate, setTournamentDate] = useState(editingTournament?.tournament_date?.split('T')[0] || '');
  const [startTime, setStartTime] = useState(editingTournament?.start_time || '');
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
  // Group stage fields
  const [numGroups, setNumGroups] = useState(String(editingTournament?.num_groups || 2));
  const [teamsPerGroup, setTeamsPerGroup] = useState(String(editingTournament?.teams_per_group || 4));
  const [advancePerGroup, setAdvancePerGroup] = useState(String(editingTournament?.advance_per_group || 2));
  const [knockoutFormat, setKnockoutFormat] = useState(editingTournament?.knockout_format || 'single_elimination');
  const [pointsWin, setPointsWin] = useState(String(editingTournament?.points_win ?? 3));
  const [pointsDraw, setPointsDraw] = useState(String(editingTournament?.points_draw ?? 1));
  const [pointsLoss, setPointsLoss] = useState(String(editingTournament?.points_loss ?? 0));
  const [category, setCategory] = useState(editingTournament?.category || '');
  const user = useAuthStore(s => s.user);
  const isApertaiUser = !!(user as any)?.has_apertai;
  const [isPrivate, setIsPrivate] = useState(editingTournament ? !editingTournament.is_public : false);
  const [streamMode, setStreamMode] = useState(
    editingTournament?.stream_mode || (isApertaiUser ? 'apertai' : 'none')
  );
  const [pairingMode, setPairingMode] = useState(editingTournament?.pairing_mode || 'fixed');

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
      if (startTime) formData.append('start_time', startTime);
      if (endDate) formData.append('tournament_end_date', endDate);
      formData.append('location', location);
      formData.append('format', format);
      formData.append('team_size', teamSize);
      if (maxParticipants) formData.append('max_participants', maxParticipants);
      formData.append('registration_mode', registrationMode);
      formData.append('require_approval', String(requireApproval));
      formData.append('show_scores_to_students', String(showScores));
      formData.append('third_place_match', String(thirdPlaceMatch));
      if (category) formData.append('category', category);
      formData.append('is_public', String(!isPrivate));
      if (streamMode !== 'none') formData.append('stream_mode', streamMode);
      if (Number(teamSize) > 1) formData.append('pairing_mode', pairingMode);
      if (format === 'group_stage') {
        formData.append('num_groups', numGroups);
        formData.append('teams_per_group', teamsPerGroup);
        formData.append('advance_per_group', advancePerGroup);
        formData.append('knockout_format', knockoutFormat);
        formData.append('points_win', pointsWin);
        formData.append('points_draw', pointsDraw);
        formData.append('points_loss', pointsLoss);
      }
      if (imageFile) formData.append('image', imageFile);

      if (editingTournament) {
        await tournamentService.updateTournament(editingTournament.id, formData);
        toast.success('Torneio atualizado!');
      } else {
        await tournamentService.createTournament(formData);
        toast.success('Torneio criado!');
      }
      onClose();
      onSave();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mm-overlay" onClick={onClose}>
      <div className="mm-modal mm-modal-md" onClick={e => e.stopPropagation()}>
        <div className="mm-header">
          <h3>{editingTournament ? 'Editar Torneio' : 'Novo Torneio'}</h3>
          <button className="mm-close" onClick={onClose}>&times;</button>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div className="mm-field">
              <label>Data Início *</label>
              <input type="date" value={tournamentDate} onChange={e => setTournamentDate(e.target.value)} />
            </div>
            <div className="mm-field">
              <label>Horário</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
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
              <label>Tamanho da Equipe</label>
              <select value={teamSize} onChange={e => setTeamSize(e.target.value)}>
                <option value="1">Individual (1x1)</option>
                <option value="2">Dupla (2x2)</option>
                <option value="3">Trio (3x3)</option>
                <option value="4">Quarteto (4x4)</option>
                <option value="5">Quinteto (5x5)</option>
              </select>
            </div>
            <div className="mm-field">
              <label>Categoria</label>
              <select value={category} onChange={e => setCategory(e.target.value)}>
                <option value="">Auto-detectar</option>
                <option value="beach_tennis">Beach Tennis</option>
                <option value="volei">Vôlei</option>
                <option value="futevolei">Futevôlei</option>
                <option value="futebol">Futebol</option>
              </select>
            </div>
          </div>
          {Number(teamSize) > 1 && (
            <div className="mm-field">
              <label>Formacao de Equipes</label>
              <select value={pairingMode} onChange={e => setPairingMode(e.target.value)}>
                <option value="fixed">Duplas pre-prontas</option>
                <option value="dynamic_single">Sorteio de duplas (unico)</option>
                <option value="dynamic_per_round">Sorteio de duplas (por rodada)</option>
              </select>
              <small style={{ color: '#888', marginTop: 4 }}>
                {pairingMode === 'fixed' && 'Inscreva as duplas ja formadas'}
                {pairingMode === 'dynamic_single' && 'Inscreva jogadores individuais. Duplas serao sorteadas uma vez.'}
                {pairingMode === 'dynamic_per_round' && 'Duplas novas sorteadas a cada rodada. Nunca repetem.'}
              </small>
            </div>
          )}
          <div className="mm-field">
            <label>Formato</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { value: 'single_elimination', label: 'Elim. Simples' },
                { value: 'double_elimination', label: 'Dupla Eliminatória' },
                { value: 'group_stage', label: 'Fase de Grupos' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormat(opt.value as any)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: format === opt.value ? '2px solid #3b82f6' : '2px solid var(--border-color, #e2e8f0)',
                    background: format === opt.value ? 'rgba(59,130,246,0.1)' : 'var(--bg-secondary, #f8fafc)',
                    color: format === opt.value ? '#3b82f6' : 'var(--text-primary, #334155)',
                    fontWeight: format === opt.value ? 700 : 500,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    transition: 'all 0.15s',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {format === 'group_stage' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="mm-field">
                  <label>Nº de Grupos</label>
                  <input type="number" min="2" max="12" value={numGroups} onChange={e => setNumGroups(e.target.value)} />
                </div>
                <div className="mm-field">
                  <label>Equipes por Grupo</label>
                  <input type="number" min="3" max="12" value={teamsPerGroup} onChange={e => setTeamsPerGroup(e.target.value)} />
                </div>
                <div className="mm-field">
                  <label>Avançam por Grupo</label>
                  <input type="number" min="1" max="8" value={advancePerGroup} onChange={e => setAdvancePerGroup(e.target.value)} />
                </div>
              </div>
              <div className="mm-field">
                <label>Fase Eliminatória (após grupos)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={() => setKnockoutFormat('single_elimination')} style={{
                    flex: 1, padding: '8px 12px', borderRadius: '8px',
                    border: knockoutFormat === 'single_elimination' ? '2px solid #3b82f6' : '2px solid var(--border-color, #e2e8f0)',
                    background: knockoutFormat === 'single_elimination' ? 'rgba(59,130,246,0.1)' : 'var(--bg-secondary, #f8fafc)',
                    color: knockoutFormat === 'single_elimination' ? '#3b82f6' : 'var(--text-primary, #334155)',
                    fontWeight: knockoutFormat === 'single_elimination' ? 700 : 500,
                    cursor: 'pointer', fontSize: '0.85rem',
                  }}>
                    Elim. Simples
                  </button>
                  <button type="button" onClick={() => setKnockoutFormat('double_elimination')} style={{
                    flex: 1, padding: '8px 12px', borderRadius: '8px',
                    border: knockoutFormat === 'double_elimination' ? '2px solid #3b82f6' : '2px solid var(--border-color, #e2e8f0)',
                    background: knockoutFormat === 'double_elimination' ? 'rgba(59,130,246,0.1)' : 'var(--bg-secondary, #f8fafc)',
                    color: knockoutFormat === 'double_elimination' ? '#3b82f6' : 'var(--text-primary, #334155)',
                    fontWeight: knockoutFormat === 'double_elimination' ? 700 : 500,
                    cursor: 'pointer', fontSize: '0.85rem',
                  }}>
                    Dupla Eliminatória
                  </button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="mm-field">
                  <label>Pts Vitória</label>
                  <input type="number" min="0" value={pointsWin} onChange={e => setPointsWin(e.target.value)} />
                </div>
                <div className="mm-field">
                  <label>Pts Empate</label>
                  <input type="number" min="0" value={pointsDraw} onChange={e => setPointsDraw(e.target.value)} />
                </div>
                <div className="mm-field">
                  <label>Pts Derrota</label>
                  <input type="number" min="0" value={pointsLoss} onChange={e => setPointsLoss(e.target.value)} />
                </div>
              </div>
              <small style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                Total de equipes: {Number(numGroups) * Number(teamsPerGroup)} — Avançam: {Number(numGroups) * Number(advancePerGroup)}
              </small>
            </>
          )}
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
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input type="checkbox" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)} />
              Campeonato privado (nao aparece no link publico)
            </label>
            {isPrivate && (
              <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', fontSize: '0.8rem', color: '#eab308', marginLeft: 20 }}>
                Campeonatos privados nao geram link publico e nao aparecem na pagina da arena.
              </div>
            )}
            {isApertaiUser && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 20, fontSize: '0.85rem', color: '#F58A25' }}>
                <FontAwesomeIcon icon={faCamera} /> Transmissao ao vivo Apertai ativada automaticamente
              </div>
            )}
          </div>
        </div>
        <div className="mm-footer">
          <button className="mm-btn mm-btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="mm-btn mm-btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? <FontAwesomeIcon icon={faSpinner} spin /> : editingTournament ? 'Salvar' : 'Criar Torneio'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sponsors Tab Component ───
function SponsorsTab({ tournamentId }: { tournamentId: number }) {
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isMaster, setIsMaster] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      const res = await tournamentService.getSponsors(tournamentId);
      setSponsors(res.data || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [tournamentId]);

  const handleAdd = async () => {
    if (!file || !name.trim()) { toast.error('Nome e logo obrigatorios'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('name', name.trim());
      if (description.trim()) fd.append('description', description.trim());
      fd.append('logo', file);
      fd.append('is_master', String(isMaster));
      await tournamentService.addSponsor(tournamentId, fd);
      toast.success('Patrocinador adicionado!');
      setName(''); setDescription(''); setFile(null); setIsMaster(false);
      if (fileRef.current) fileRef.current.value = '';
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao adicionar');
    } finally { setUploading(false); }
  };

  const handleRemove = async (id: number) => {
    if (!confirm('Remover patrocinador?')) return;
    try {
      await tournamentService.removeSponsor(tournamentId, id);
      toast.success('Removido');
      load();
    } catch (err: any) { toast.error('Erro ao remover'); }
  };

  return (
    <div>
      {/* Add form */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="mm-field" style={{ flex: 1, minWidth: 150 }}>
          <label>Nome</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Nike" />
        </div>
        <div className="mm-field" style={{ flex: 1, minWidth: 200 }}>
          <label>Descricao (opcional)</label>
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Loja de esportes" />
        </div>
        <div className="mm-field" style={{ flex: 1, minWidth: 150 }}>
          <label>Logo (PNG/JPG)</label>
          <input ref={fileRef} type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
          <input type="checkbox" checked={isMaster} onChange={e => setIsMaster(e.target.checked)} />
          <span style={{ color: '#F58A25', fontWeight: 600 }}>Master</span>
        </label>
        <button onClick={handleAdd} disabled={uploading} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#10b981', color: '#fff', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
          {uploading ? 'Enviando...' : '+ Adicionar'}
        </button>
      </div>

      {/* List */}
      {loading ? <div>Carregando...</div> : sponsors.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: '0.85rem' }}>
          Nenhum patrocinador adicionado
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          {sponsors.map((s: any) => (
            <div key={s.id} style={{ padding: 12, borderRadius: 12, border: `1px solid ${s.is_master ? 'rgba(245,138,37,0.3)' : 'var(--border-color, #e2e8f0)'}`, background: s.is_master ? 'rgba(245,138,37,0.04)' : 'var(--bg-secondary, #f8fafc)', textAlign: 'center', position: 'relative' }}>
              {s.is_master && <span style={{ position: 'absolute', top: 6, right: 8, fontSize: '0.65rem', fontWeight: 700, color: '#F58A25', textTransform: 'uppercase' }}>Master</span>}
              <img src={s.logo_url} alt={s.name} style={{ width: '100%', height: 80, objectFit: 'contain', marginBottom: 8 }} />
              <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{s.name}</div>
              {s.description && <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>{s.description}</div>}
              <button onClick={() => handleRemove(s.id)} style={{ marginTop: 6, fontSize: '0.75rem', color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}>Remover</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Stream Controls Component ───
function StreamControls({ tournamentId }: { tournamentId: number }) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);

  const fetchStatus = async () => {
    try {
      const res = await tournamentService.getStreamStatus(tournamentId);
      setSession(res.data);
    } catch {} finally { setLoading(false); }
  };

  const fetchViewers = async () => {
    try {
      const res = await tournamentService.getViewerCount(tournamentId);
      setViewerCount(res.data?.viewer_count || 0);
    } catch {}
  };

  useEffect(() => {
    fetchStatus(); fetchViewers();
    const iv = setInterval(fetchStatus, 5000);
    const iv2 = setInterval(fetchViewers, 10000);
    return () => { clearInterval(iv); clearInterval(iv2); };
  }, [tournamentId]);

  const handleStart = async () => {
    try {
      const res = await tournamentService.startStream(tournamentId);
      toast.success('Transmissao iniciada!');
      setSession({ ...session, id: res.data?.session_id, status: 'live' });
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erro ao iniciar'); }
  };

  const handleStop = async () => {
    if (!session?.id || !confirm('Encerrar transmissao?')) return;
    try {
      await tournamentService.stopStream(session.id);
      toast.success('Transmissao encerrada');
      setSession(null);
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erro'); }
  };

  const handlePause = async () => {
    if (!session?.id) return;
    try {
      const res = await tournamentService.pauseStream(session.id);
      toast.success(res.message);
      setSession({ ...session, status: res.data?.status });
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erro'); }
  };

  const handleSponsor = async () => {
    if (!session?.id) return;
    try {
      const res = await tournamentService.showSponsors(session.id);
      toast.success(res.message);
      setSession({ ...session, status: res.data?.status });
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erro'); }
  };

  if (loading) return null;

  return (
    <div style={{ marginTop: 16, padding: '16px', borderRadius: 12, background: 'rgba(245,138,37,0.06)', border: '1px solid rgba(245,138,37,0.15)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <FontAwesomeIcon icon={faCamera} style={{ color: '#F58A25' }} />
        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#F58A25' }}>Transmissao Apertai</span>
        {session && session.status !== 'ended' && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', fontWeight: 700, color: session.status === 'live' ? '#ef4444' : session.status === 'paused' ? '#d97706' : '#64748b', background: session.status === 'live' ? 'rgba(239,68,68,0.1)' : 'rgba(0,0,0,0.05)', padding: '2px 8px', borderRadius: 10 }}>
            {session.status === 'live' && <><span className="torneio-live-dot" /> AO VIVO</>}
            {session.status === 'paused' && 'PAUSADO'}
            {session.status === 'sponsor' && 'PATROCINADORES'}
          </span>
        )}
        {viewerCount > 0 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 10 }}>
            <FontAwesomeIcon icon={faUsers} style={{ fontSize: '0.6rem' }} /> {viewerCount} assistindo
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(!session || session.status === 'ended') && (
          <button onClick={handleStart} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#10b981', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
            <FontAwesomeIcon icon={faPlay} /> Iniciar Transmissao
          </button>
        )}
        {session && session.status === 'live' && (
          <>
            <button onClick={handlePause} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-color, #e2e8f0)', background: 'var(--bg-secondary, #1a1a2e)', color: 'inherit', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
              <FontAwesomeIcon icon={faClock} /> Pausar
            </button>
            <button onClick={handleStop} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
              <FontAwesomeIcon icon={faStop} /> Encerrar
            </button>
          </>
        )}
        {session && session.status === 'paused' && (
          <>
            <button onClick={handlePause} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#10b981', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
              <FontAwesomeIcon icon={faPlay} /> Retomar
            </button>
            <button onClick={handleStop} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
              <FontAwesomeIcon icon={faStop} /> Encerrar
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function Torneios() {
  const user = useAuthStore(s => s.user);
  const isApertaiUser = !!(user as any)?.has_apertai;
  const [tab, setTab] = useState<'tournaments' | 'live' | 'ranking'>('tournaments');
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [rankings, setRankings] = useState<TournamentRanking[]>([]);
  const [rankingCategories, setRankingCategories] = useState<number[]>([]);
  const [rankingTeamSize, setRankingTeamSize] = useState<number>(2);
  const [initialLoading, setInitialLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [rankingLimit, setRankingLimit] = useState(10);

  // Create/Edit modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);

  // Detail modal
  const [selectedTournament, setSelectedTournament] = useState<(Tournament & { teams?: TournamentTeam[] }) | null>(null);
  const [detailTab, setDetailTab] = useState<'info' | 'teams' | 'groups' | 'bracket' | 'matches' | 'sponsors'>('info');
  const [bracketData, setBracketData] = useState<BracketData | null>(null);
  const [bracketLoading, setBracketLoading] = useState(false);

  // Group data
  const [groupData, setGroupData] = useState<TournamentGroup[] | null>(null);
  const [groupsLoading, setGroupsLoading] = useState(false);

  // Match management
  const [selectedMatch, setSelectedMatch] = useState<TournamentMatch | null>(null);
  const [matchWinner, setMatchWinner] = useState<number | null>(null);
  const [matchScores, setMatchScores] = useState<{ team1: number; team2: number }>({ team1: 0, team2: 0 });
  const [liveRefreshKey, setLiveRefreshKey] = useState(0);

  useEffect(() => { fetchAll().finally(() => setInitialLoading(false)); }, []);

  const fetchAll = async () => {
    try {
      const [tourRes, rankRes] = await Promise.all([
        tournamentService.getTournaments(),
        tournamentService.getRankings(),
      ]);
      setTournaments(tourRes.data || []);
      const rankData = rankRes.data;
      setRankings(rankData?.rankings || rankData || []);
      if (rankData?.categories) setRankingCategories(rankData.categories);
    } catch (err) {
      console.error('Tournament fetch error:', err);
    }
  };

  const openDetail = async (t: Tournament) => {
    try {
      const res = await tournamentService.getTournament(t.id);
      setSelectedTournament(res.data);
      setDetailTab('info');
      setBracketData(null);
      // Load individual players if dynamic pairing
      if (res.data.pairing_mode && res.data.pairing_mode !== 'fixed') {
        loadIndividualPlayers(res.data.id);
        // Auto-load bracket for per-round mode (needed to detect all matches done)
        if (res.data.bracket_generated) {
          loadBracket(res.data.id);
        }
      } else {
        setIndividualPlayers([]);
        setGeneratedPairs([]);
        setPairsGenerated(false);
      }
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
      const tRes = await tournamentService.getTournament(selectedTournament.id);
      setSelectedTournament(tRes.data);
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao gerar chave');
    }
  };

  // ─── Live Draw ───
  const [showBracketModal, setShowBracketModal] = useState(false);
  const [liveDraw, setLiveDraw] = useState<any>(null);
  const [liveDrawRevealing, setLiveDrawRevealing] = useState(false);
  const [bracketEditMode, setBracketEditMode] = useState(false);
  const [editMatchModal, setEditMatchModal] = useState<any>(null);
  const [editTeamModal, setEditTeamModal] = useState<any>(null);

  const handleStartLiveDraw = async () => {
    if (!selectedTournament) return;
    setShowBracketModal(false);
    try {
      const res = await tournamentService.startLiveDraw(selectedTournament.id);
      setLiveDraw(res.data?.draw_data || null);
      toast.success('Sorteio ao vivo iniciado! Clique para sortear cada confronto.');
      const tRes = await tournamentService.getTournament(selectedTournament.id);
      setSelectedTournament(tRes.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao iniciar sorteio ao vivo');
    }
  };

  const handleDrawNextMatch = async () => {
    if (!selectedTournament || liveDrawRevealing) return;
    setLiveDrawRevealing(true);
    try {
      const res = await tournamentService.drawNextMatch(selectedTournament.id);

      // If BYEs were revealed (first click), show immediately
      if (res.data?.type === 'byes') {
        setLiveDraw(res.data?.draw_data || null);
        setLiveDrawRevealing(false);
        const byeNames = (res.data.bye_teams || []).map((t: any) => t.name).join(', ');
        toast.success(`Passam direto: ${byeNames}`);
        return;
      }

      // Pairs reveal: shorter animation delay
      if (res.data?.type === 'pair') {
        setTimeout(() => {
          setLiveDraw(res.data?.draw_data || null);
          setLiveDrawRevealing(false);
          if (res.data?.all_revealed) {
            toast.success('Todas as duplas sorteadas!');
            // Clear live draw mode after public page animation
            setTimeout(async () => {
              try { await tournamentService.finishLiveDraw(selectedTournament.id); } catch {}
              const tRes = await tournamentService.getTournament(selectedTournament.id);
              setSelectedTournament(tRes.data);
              setLiveDraw(null);
              setGeneratedPairs(res.data?.draw_data?.pairs?.map((p: any) => ({ team_name: p.team_name, left_player: p.left_player, right_player: p.right_player })) || []);
              setPairsGenerated(true);
              fetchAll();
            }, 10000);
          }
        }, 3000);
        return;
      }

      // Confrontation reveal: wait 3s for suspense animation, then reveal
      setTimeout(() => {
        setLiveDraw(res.data?.draw_data || null);
        setLiveDrawRevealing(false);
        if (res.data?.all_revealed) {
          toast.success('Todos os confrontos sorteados! Chave gerada.');
          // Wait for public page to see last match animation, then clear live draw state
          setTimeout(async () => {
            try { await tournamentService.finishLiveDraw(selectedTournament.id); } catch {}
            const tRes = await tournamentService.getTournament(selectedTournament.id);
            setSelectedTournament(tRes.data);
            if (tRes.data.bracket_generated) {
              const bRes = await tournamentService.getBracket(selectedTournament.id);
              setBracketData(bRes.data);
            }
            setLiveDraw(null);
            fetchAll();
          }, 12000);
        }
      }, 3000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro');
      setLiveDrawRevealing(false);
    }
  };

  const handleDrawAll = async () => {
    if (!selectedTournament || liveDrawRevealing) return;
    setLiveDrawRevealing(true);

    const isPairs = liveDraw?.type === 'pairs';
    const total = isPairs ? (liveDraw?.pairs?.length || 0) : (liveDraw?.matches?.length || 0);
    const revealed = liveDraw?.revealed_count || 0;
    const remaining = total - revealed;
    // Also count byes step if needed
    const needByes = !isPairs && liveDraw?.bye_teams?.length > 0 && !liveDraw?.byes_revealed;

    try {
      // Reveal byes first if needed
      if (needByes) {
        const byeRes = await tournamentService.drawNextMatch(selectedTournament.id);
        setLiveDraw(byeRes.data?.draw_data || liveDraw);
        await new Promise(r => setTimeout(r, 1000));
      }

      // Reveal all remaining items one by one with short delay
      for (let i = 0; i < remaining; i++) {
        const res = await tournamentService.drawNextMatch(selectedTournament.id);
        setLiveDraw(res.data?.draw_data || liveDraw);

        if (res.data?.all_revealed) {
          // Last one - handle finish
          setLiveDrawRevealing(false);
          if (isPairs) {
            toast.success('Todas as duplas sorteadas!');
            setTimeout(async () => {
              try { await tournamentService.finishLiveDraw(selectedTournament.id); } catch {}
              const tRes = await tournamentService.getTournament(selectedTournament.id);
              setSelectedTournament(tRes.data);
              setLiveDraw(null);
              setPairsGenerated(true);
              fetchAll();
            }, 10000);
          } else {
            toast.success('Todos os confrontos sorteados! Chave gerada.');
            setTimeout(async () => {
              try { await tournamentService.finishLiveDraw(selectedTournament.id); } catch {}
              const tRes = await tournamentService.getTournament(selectedTournament.id);
              setSelectedTournament(tRes.data);
              if (tRes.data.bracket_generated) {
                const bRes = await tournamentService.getBracket(selectedTournament.id);
                setBracketData(bRes.data);
              }
              setLiveDraw(null);
              fetchAll();
            }, 12000);
          }
          return;
        }
        // Wait between reveals so public page catches each one
        await new Promise(r => setTimeout(r, 4000));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao sortear todos');
    } finally {
      setLiveDrawRevealing(false);
    }
  };

  const handleFinishLiveDraw = async () => {
    if (!selectedTournament) return;
    try {
      const res = await tournamentService.finishLiveDraw(selectedTournament.id);
      setBracketData(res.data);
      setLiveDraw(null);
      toast.success('Chave gerada!');
      const tRes = await tournamentService.getTournament(selectedTournament.id);
      setSelectedTournament(tRes.data);
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao finalizar sorteio');
    }
  };

  const handleSortearConfrontos = () => {
    setShowBracketModal(true);
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

  const loadGroups = async (tournamentId: number) => {
    setGroupsLoading(true);
    try {
      const res = await tournamentService.getGroupStandings(tournamentId);
      setGroupData(res.data.groups);
    } catch (err) {
      console.error('Groups error:', err);
    } finally {
      setGroupsLoading(false);
    }
  };

  const handleCompleteGroupStage = async () => {
    if (!selectedTournament) return;
    if (!confirm('Avançar para a fase eliminatória? Todas as partidas dos grupos devem estar concluídas.')) return;
    try {
      const res = await tournamentService.completeGroupStage(selectedTournament.id);
      setBracketData(res.data);
      toast.success('Fase de grupos concluída! Chave eliminatória gerada.');
      const tRes = await tournamentService.getTournament(selectedTournament.id);
      setSelectedTournament(tRes.data);
      setDetailTab('bracket');
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao avançar fase de grupos');
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

  const handleForceDeleteTournament = async () => {
    if (!selectedTournament) return;
    const name = prompt(`Para excluir permanentemente, digite o nome do torneio:\n"${selectedTournament.title}"`);
    if (name !== selectedTournament.title) {
      if (name !== null) toast.error('Nome incorreto');
      return;
    }
    try {
      const response = await (await import('../services/api')).api.delete(`/api/tournaments/${selectedTournament.id}?force=true`);
      toast.success('Torneio excluído permanentemente');
      setSelectedTournament(null);
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao excluir');
    }
  };

  // ─── Match actions ───
  const getTournamentId = (match: TournamentMatch) => selectedTournament?.id || match.tournament_id;

  const handleStartMatch = async (match: TournamentMatch, camera?: string) => {
    const tid = getTournamentId(match);
    if (!tid) return;
    const streamCamera = camera || undefined;
    try {
      await tournamentService.startMatch(tid, match.id, streamCamera ? { stream_camera: streamCamera } : undefined);
      toast.success('Partida iniciada!');
      setSelectedMatch(prev => prev?.id === match.id ? { ...prev, status: 'live' as const, team1_score: prev.team1_score ?? 0, team2_score: prev.team2_score ?? 0 } : prev);
      loadBracket(tid);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro');
    }
  };

  const handleScoreUpdate = async (match: TournamentMatch, teamId: number, action: 'score' | 'undo_score') => {
    const tid = getTournamentId(match);
    if (!tid) return;
    try {
      await tournamentService.updateMatchScore(tid, match.id, { team_id: teamId, action });
      // Optimistically update score in modal
      const delta = action === 'score' ? 1 : -1;
      setSelectedMatch(prev => {
        if (!prev || prev.id !== match.id) return prev;
        if (teamId === prev.team1_id) return { ...prev, team1_score: Math.max(0, (prev.team1_score || 0) + delta) };
        if (teamId === prev.team2_id) return { ...prev, team2_score: Math.max(0, (prev.team2_score || 0) + delta) };
        return prev;
      });
      loadBracket(tid);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro');
    }
  };

  const handleDeclareWinner = async (match: TournamentMatch, winnerId: number) => {
    const tid = getTournamentId(match);
    if (!tid) return;
    if (!confirm('Declarar vencedor desta partida?')) return;
    try {
      const res = await tournamentService.reportMatchResult(tid, match.id, {
        winner_id: winnerId,
        team1_score: match.team1_score || 0,
        team2_score: match.team2_score || 0,
      });
      setBracketData(res.data);
      toast.success('Resultado registrado!');
      setSelectedMatch(null); // Close modal after declaring winner
      // Refresh tournament status if detail modal is open
      if (selectedTournament) {
        const tRes = await tournamentService.getTournament(selectedTournament.id);
        setSelectedTournament(tRes.data);
      }
      setLiveRefreshKey(k => k + 1);
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro');
    }
  };

  // ─── Team management ───
  const [newTeamName, setNewTeamName] = useState('');

  // ─── Individual players (dynamic pairing) ───
  const [individualPlayers, setIndividualPlayers] = useState<any[]>([]);
  const [newPlayerNameLeft, setNewPlayerNameLeft] = useState('');
  const [newPlayerNameRight, setNewPlayerNameRight] = useState('');
  const [generatedPairs, setGeneratedPairs] = useState<any[]>([]);
  const [pairsGenerated, setPairsGenerated] = useState(false);

  const loadIndividualPlayers = async (tournamentId: number) => {
    try {
      const res = await tournamentService.getIndividualPlayers(tournamentId);
      setIndividualPlayers(res.data?.players || res.data || []);
      setGeneratedPairs(res.data?.pairs || []);
      setPairsGenerated((res.data?.pairs || []).length > 0);
    } catch {
      setIndividualPlayers([]);
    }
  };

  const handleAddIndividualPlayer = async (side: 'left' | 'right') => {
    if (!selectedTournament) return;
    const name = side === 'left' ? newPlayerNameLeft.trim() : newPlayerNameRight.trim();
    if (!name) return;
    try {
      await tournamentService.addIndividualPlayer(selectedTournament.id, { player_name: name, side });
      if (side === 'left') setNewPlayerNameLeft('');
      else setNewPlayerNameRight('');
      toast.success('Jogador adicionado!');
      loadIndividualPlayers(selectedTournament.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao adicionar jogador');
    }
  };

  const handleRemoveIndividualPlayer = async (playerId: number) => {
    if (!selectedTournament) return;
    try {
      await tournamentService.removeIndividualPlayer(selectedTournament.id, playerId);
      toast.success('Jogador removido');
      loadIndividualPlayers(selectedTournament.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao remover jogador');
    }
  };

  // ─── Scheduled draw modal ───
  const [showDrawModal, setShowDrawModal] = useState(false);
  const [drawRevealTime, setDrawRevealTime] = useState('');
  const [drawImmediate, setDrawImmediate] = useState(true);
  const [drawLive, setDrawLive] = useState(false);

  const handleGeneratePairsClick = () => {
    setDrawRevealTime('');
    setDrawImmediate(true);
    setDrawLive(false);
    setShowDrawModal(true);
  };

  const handleConfirmDraw = async () => {
    if (!selectedTournament) return;
    setShowDrawModal(false);
    try {
      let revealAt: string | undefined;
      if (!drawLive && !drawImmediate && drawRevealTime) {
        // Combine today's date with the chosen time
        const today = new Date().toISOString().split('T')[0];
        revealAt = `${today}T${drawRevealTime}:00`;
      }
      const res = await tournamentService.generatePairs(
        selectedTournament.id,
        selectedTournament.pairing_mode || 'dynamic_single',
        undefined,
        revealAt,
        drawLive
      );
      if (drawLive) {
        // Open live draw control panel (same as confrontation draw)
        setLiveDraw(res.data?.draw_data || { type: 'pairs', pairs: res.data?.pairs?.map((p: any) => ({ ...p, revealed: false })) || [], revealed_count: 0, finished: false });
        toast.success('Sorteio de duplas ao vivo iniciado! Clique para sortear cada dupla.');
      } else if (revealAt) {
        toast.success(`Duplas sorteadas! Revelação agendada para ${drawRevealTime}`);
      } else {
        toast.success('Duplas sorteadas com sucesso!');
      }
      setGeneratedPairs(res.data?.pairs || []);
      setPairsGenerated(true);
      const tRes = await tournamentService.getTournament(selectedTournament.id);
      setSelectedTournament(tRes.data);
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao sortear duplas');
    }
  };

  const handleNewRound = async () => {
    if (!selectedTournament) return;
    if (!confirm('Iniciar nova rodada? Isso irá desfazer todas as duplas e confrontos atuais.')) return;
    try {
      await tournamentService.newRound(selectedTournament.id);
      toast.success('Nova rodada! Sorteie novas duplas.');
      setGeneratedPairs([]);
      setPairsGenerated(false);
      setBracketData(null);
      const tRes = await tournamentService.getTournament(selectedTournament.id);
      setSelectedTournament(tRes.data);
      loadIndividualPlayers(selectedTournament.id);
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao iniciar nova rodada');
    }
  };

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

  // ─── Approve with side selection (dynamic pairing) ───
  const [approveModalTeamId, setApproveModalTeamId] = useState<number | null>(null);
  const [approveSide, setApproveSide] = useState<'left' | 'right'>('left');

  const handleApproveTeam = async (teamId: number, side?: 'left' | 'right') => {
    if (!selectedTournament) return;
    try {
      await tournamentService.approveTeam(selectedTournament.id, teamId, side);
      toast.success('Equipe aprovada!');
      setApproveModalTeamId(null);
      const tRes = await tournamentService.getTournament(selectedTournament.id);
      setSelectedTournament(tRes.data);
      // Reload individual players if dynamic pairing
      if (selectedTournament.pairing_mode && selectedTournament.pairing_mode !== 'fixed') {
        loadIndividualPlayers(selectedTournament.id);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro');
    }
  };

  const isDynamicPairing = selectedTournament?.pairing_mode && selectedTournament.pairing_mode !== 'fixed';

  const copyRegistrationLink = () => {
    if (!selectedTournament?.registration_token) return;
    const url = `${window.location.origin}/torneio/${selectedTournament.registration_token}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado!');
  };

  const copyPublicLink = () => {
    if (!selectedTournament?.public_token) return;
    const url = `${window.location.origin}/torneio/live/${selectedTournament.public_token}`;
    navigator.clipboard.writeText(url);
    toast.success('Link público copiado!');
  };

  // ─── Filtered tournaments ───
  const filtered = statusFilter === 'all'
    ? tournaments.filter(t => t.status !== 'cancelled')
    : tournaments.filter(t => t.status === statusFilter);

  const liveTournaments = tournaments.filter(t => t.status === 'live');

  // ─── Match Detail Modal ───
  const MatchDetailModal = ({ match, onClose }: { match: TournamentMatch; onClose: () => void }) => {
    const bracketLabel = match.bracket_type === 'winners' ? 'Chave Vencedores' : match.bracket_type === 'losers' ? 'Chave Perdedores' : match.bracket_type === 'grand_final' ? 'Grande Final' : match.bracket_type === 'group' ? 'Fase de Grupos' : '3º Lugar';
    const isPending = match.status === 'pending';
    const isLive = match.status === 'live';
    const isCompleted = match.status === 'completed';
    const hasBothTeams = !!match.team1_id && !!match.team2_id;
    const hasApertai = selectedTournament?.stream_mode === 'apertai' || isApertaiUser;
    const [matchCam, setMatchCam] = useState(match.stream_camera || '');

    return (
      <div className="mm-overlay" onClick={onClose}>
        <div className="mm-modal mm-modal-sm" onClick={e => e.stopPropagation()}>
          <div className="mm-header">
            <h3>Partida #{match.match_number} <span style={{ fontWeight: 400, fontSize: '0.85rem', color: '#94a3b8' }}>— {bracketLabel} · Rodada {match.round_number}</span></h3>
            <button className="mm-close" onClick={onClose}>&times;</button>
          </div>
          <div className="mm-content" style={{ padding: 0 }}>
            {/* Status banner */}
            {isLive && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '6px 0', background: '#fee2e2' }}>
                <span className="torneio-live-dot" /> <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ef4444', letterSpacing: 1 }}>AO VIVO</span>
                {match.stream_camera && <span style={{ fontSize: '0.7rem', color: '#ef4444' }}>— {match.stream_camera.replace('cam', 'Quadra ')}</span>}
              </div>
            )}
            {isCompleted && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '6px 0', background: '#dcfce7' }}>
                <FontAwesomeIcon icon={faCheck} style={{ color: '#16a34a', fontSize: '0.7rem' }} /> <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a' }}>FINALIZADA</span>
              </div>
            )}

            {/* Scoreboard */}
            <div style={{ display: 'flex', alignItems: 'stretch', padding: '20px 16px', gap: 0 }}>
              {/* Team 1 */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1rem', fontWeight: 600, textAlign: 'center', color: match.winner_id === match.team1_id ? '#10b981' : undefined }}>{match.team1_name || 'A definir'}</span>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: match.winner_id === match.team1_id ? '#10b981' : undefined }}>{match.team1_score ?? 0}</span>
                {isLive && match.team1_id && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="torneio-score-btn minus" onClick={() => handleScoreUpdate(match, match.team1_id!, 'undo_score')}>−</button>
                    <button className="torneio-score-btn plus" onClick={() => handleScoreUpdate(match, match.team1_id!, 'score')}>+</button>
                  </div>
                )}
              </div>
              {/* VS */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#94a3b8' }}>VS</span>
              </div>
              {/* Team 2 */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1rem', fontWeight: 600, textAlign: 'center', color: match.winner_id === match.team2_id ? '#10b981' : undefined }}>{match.team2_name || 'A definir'}</span>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: match.winner_id === match.team2_id ? '#10b981' : undefined }}>{match.team2_score ?? 0}</span>
                {isLive && match.team2_id && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="torneio-score-btn minus" onClick={() => handleScoreUpdate(match, match.team2_id!, 'undo_score')}>−</button>
                    <button className="torneio-score-btn plus" onClick={() => handleScoreUpdate(match, match.team2_id!, 'score')}>+</button>
                  </div>
                )}
              </div>
            </div>

            {/* Court/Camera selector for Apertai */}
            {hasApertai && hasBothTeams && !isCompleted && (
              <div style={{ padding: '0 16px 12px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: 6, display: 'block' }}>
                  <FontAwesomeIcon icon={faCamera} style={{ marginRight: 4 }} /> Quadra / Camera
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['cam1', 'cam2'].map(cam => (
                    <button
                      key={cam}
                      onClick={() => setMatchCam(cam)}
                      style={{
                        flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer',
                        fontWeight: 700, fontSize: '0.85rem',
                        background: matchCam === cam ? '#F58A25' : 'var(--bg-secondary, #f8fafc)',
                        color: matchCam === cam ? '#fff' : 'inherit',
                        borderWidth: 2, borderStyle: 'solid',
                        borderColor: matchCam === cam ? '#F58A25' : 'var(--border-color, #e2e8f0)',
                      }}
                    >
                      {cam.replace('cam', 'Quadra ')}
                    </button>
                  ))}
                </div>
                {isPending && !matchCam && (
                  <div style={{ fontSize: '0.75rem', color: '#F58A25', marginTop: 4 }}>Selecione a quadra para iniciar com transmissao</div>
                )}
              </div>
            )}

            {/* Actions */}
            {hasBothTeams && !isCompleted && (
              <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {isPending && (
                  <button
                    className="torneio-btn-success"
                    onClick={() => {
                      if (hasApertai && !matchCam) {
                        toast.error('Selecione a quadra/camera antes de iniciar');
                        return;
                      }
                      handleStartMatch(match, matchCam || undefined);
                    }}
                    style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' }}
                  >
                    <FontAwesomeIcon icon={faPlay} /> Iniciar Partida
                  </button>
                )}
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', margin: '4px 0 0' }}>
                  {isLive ? 'Declarar vencedor:' : 'Ou declarar vencedor direto:'}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button className="torneio-winner-btn" onClick={() => handleDeclareWinner(match, match.team1_id!)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 8px', borderRadius: 10, border: '2px solid #10b981', background: 'rgba(16,185,129,0.08)', color: '#10b981', fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem' }}>
                    <FontAwesomeIcon icon={faTrophy} /> {match.team1_name}
                  </button>
                  <button className="torneio-winner-btn" onClick={() => handleDeclareWinner(match, match.team2_id!)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 8px', borderRadius: 10, border: '2px solid #3b82f6', background: 'rgba(59,130,246,0.08)', color: '#3b82f6', fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem' }}>
                    <FontAwesomeIcon icon={faTrophy} /> {match.team2_name}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ─── Render ───
  if (initialLoading) {
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
                      <span><FontAwesomeIcon icon={faCalendar} /> {new Date(t.tournament_date).toLocaleDateString('pt-BR')}{t.start_time ? ` ${t.start_time}` : ''}</span>
                      {t.location && <span><FontAwesomeIcon icon={faMapMarkerAlt} /> {t.location}</span>}
                      <span><FontAwesomeIcon icon={faUsers} /> {t.team_count || 0} equipes</span>
                    </div>
                    <div className="torneio-card-badges">
                      <span className={`torneio-badge torneio-badge-${t.status}`}>
                        {t.status === 'live' && <FontAwesomeIcon icon={faCircle} style={{ fontSize: '0.5rem' }} />}
                        {STATUS_LABELS[t.status]}
                      </span>
                      <span className="torneio-badge torneio-badge-format">
                        {t.format === 'double_elimination' ? 'Dupla Elim.' : t.format === 'group_stage' ? 'Fase de Grupos' : 'Elim. Simples'}
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
                <LiveBracketView key={liveRefreshKey} tournamentId={t.id} onMatchClick={(m) => setSelectedMatch(m)} />
              </div>
            ))
          )}
        </>
      )}

      {/* ─── Tab: Ranking ─── */}
      {tab === 'ranking' && (
        <>
          {/* Category selector */}
          {rankingCategories.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {rankingCategories.map(size => (
                <button
                  key={size}
                  onClick={async () => {
                    setRankingTeamSize(size);
                    setRankingLimit(10);
                    try {
                      const res = await tournamentService.getRankings(size);
                      const d = res.data;
                      setRankings(d?.rankings || d || []);
                    } catch {}
                  }}
                  className={rankingTeamSize === size ? 'torneio-btn-primary' : 'torneio-btn-outline'}
                  style={{ padding: '6px 16px', borderRadius: 10, border: rankingTeamSize === size ? 'none' : '1px solid var(--border-color, #e2e8f0)', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}
                >
                  {size === 1 ? 'Individual' : size === 2 ? 'Duplas' : size === 3 ? 'Trios' : `${size}x${size}`}
                </button>
              ))}
            </div>
          )}

          {rankings.length === 0 ? (
            <div className="torneio-empty">
              <FontAwesomeIcon icon={faMedal} />
              <p>Nenhum ranking disponível</p>
              <small>Rankings são atualizados ao final de cada torneio</small>
            </div>
          ) : (
            <>
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
                  {rankings.slice(0, rankingLimit).map((r, i) => (
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
              {rankingLimit < rankings.length && (
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <button
                    className="torneio-btn-outline"
                    onClick={() => setRankingLimit(l => l + 10)}
                    style={{ padding: '8px 24px', borderRadius: 8, border: '1px solid var(--border-color, #e2e8f0)', cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    Ver mais ({rankings.length - rankingLimit} restantes)
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ─── Create/Edit Modal ─── */}
      {showCreateModal && (
        <CreateModal
          editingTournament={editingTournament}
          onClose={() => { setShowCreateModal(false); setEditingTournament(null); }}
          onSave={fetchAll}
        />
      )}

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
              {/* Start tournament banner - visible on all tabs when ready */}
              {selectedTournament.bracket_generated && selectedTournament.status !== 'live' && selectedTournament.status !== 'finished' && selectedTournament.status !== 'cancelled' && (
                <div className="torneio-start-banner">
                  <div className="torneio-start-banner-info">
                    <FontAwesomeIcon icon={faPlay} />
                    <span>Chave gerada! Quando estiver pronto, inicie o torneio para começar os jogos.</span>
                  </div>
                  <button className="torneio-start-banner-btn" onClick={handleStartTournament}>
                    <FontAwesomeIcon icon={faPlay} /> Iniciar Torneio
                  </button>
                </div>
              )}

              {/* Per-round: "Rodada concluída" banner - visible on ALL tabs */}
              {selectedTournament.pairing_mode === 'dynamic_per_round' && selectedTournament.bracket_generated && bracketData && (() => {
                const allDone = [...(bracketData.winners?.flat() || []), ...(bracketData.losers?.flat() || []), bracketData.grand_final, bracketData.third_place]
                  .filter(Boolean).filter((m: any) => !m.is_bye).every((m: any) => m.status === 'completed');
                return allDone ? (
                  <div style={{ padding: '14px 20px', borderRadius: 12, background: 'rgba(245,138,37,0.1)', border: '2px solid rgba(245,138,37,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: '#F58A25' }}>Rodada concluida!</div>
                      <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: 2 }}>Todos os jogos terminaram. Desfaca as duplas e sorteie novamente.</div>
                    </div>
                    <button onClick={handleNewRound} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', background: '#F58A25', color: '#fff', whiteSpace: 'nowrap' }}>
                      <FontAwesomeIcon icon={faUsers} /> Nova Rodada
                    </button>
                  </div>
                ) : null;
              })()}

              {/* Sub-tabs */}
              <div className="torneio-sub-tabs">
                <button className={`torneio-sub-tab ${detailTab === 'info' ? 'active' : ''}`} onClick={() => setDetailTab('info')}>Detalhes</button>
                <button className={`torneio-sub-tab ${detailTab === 'teams' ? 'active' : ''}`} onClick={() => setDetailTab('teams')}>
                  Participantes ({selectedTournament.teams?.length || 0})
                </button>
                {selectedTournament.format === 'group_stage' && selectedTournament.bracket_generated && (
                  <button className={`torneio-sub-tab ${detailTab === 'groups' ? 'active' : ''}`} onClick={() => { setDetailTab('groups'); if (!groupData) loadGroups(selectedTournament.id); }}>
                    Grupos
                  </button>
                )}
                <button className={`torneio-sub-tab ${detailTab === 'bracket' ? 'active' : ''}`} onClick={() => { setDetailTab('bracket'); if (!bracketData && selectedTournament.bracket_generated) loadBracket(selectedTournament.id); }}>
                  Chave
                </button>
                <button className={`torneio-sub-tab ${detailTab === 'matches' ? 'active' : ''}`} onClick={() => { setDetailTab('matches'); if (!bracketData && selectedTournament.bracket_generated) loadBracket(selectedTournament.id); }}>
                  Jogos
                </button>
                <button className={`torneio-sub-tab ${detailTab === 'sponsors' ? 'active' : ''}`} onClick={() => setDetailTab('sponsors')}>
                  Patrocinadores
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
                      <p><FontAwesomeIcon icon={faCalendar} /> {new Date(selectedTournament.tournament_date).toLocaleDateString('pt-BR')}{selectedTournament.start_time ? ` às ${selectedTournament.start_time}` : ''}{selectedTournament.tournament_end_date ? ` — ${new Date(selectedTournament.tournament_end_date).toLocaleDateString('pt-BR')}` : ''}</p>
                      {selectedTournament.location && <p><FontAwesomeIcon icon={faMapMarkerAlt} /> {selectedTournament.location}</p>}
                      <p><FontAwesomeIcon icon={faUsers} /> {selectedTournament.teams?.length || 0} equipes — {selectedTournament.format === 'double_elimination' ? 'Dupla Eliminatória' : selectedTournament.format === 'group_stage' ? 'Fase de Grupos' : 'Eliminatória Simples'} — {selectedTournament.team_size === 1 ? 'Individual' : `${selectedTournament.team_size}x${selectedTournament.team_size}`}</p>

                      <div className="torneio-detail-actions">
                        <button className="torneio-btn-outline" onClick={() => { setEditingTournament(selectedTournament); setShowCreateModal(true); }}>Editar</button>
                        {selectedTournament.bracket_generated && selectedTournament.status !== 'live' && selectedTournament.status !== 'finished' && selectedTournament.status !== 'cancelled' && (
                          <button className="torneio-btn-success" onClick={handleStartTournament} style={{ padding: '10px 20px', fontSize: '1rem', fontWeight: 700 }}>
                            <FontAwesomeIcon icon={faPlay} /> Iniciar Torneio
                          </button>
                        )}
                        {selectedTournament.status === 'live' && (
                          <button className="torneio-btn-danger" onClick={handleFinishTournament}><FontAwesomeIcon icon={faStop} /> Finalizar</button>
                        )}
                        {selectedTournament.status !== 'live' && selectedTournament.status !== 'finished' && selectedTournament.status !== 'cancelled' && (
                          <button className="torneio-btn-danger" onClick={handleDeleteTournament}><FontAwesomeIcon icon={faTimes} /> Cancelar</button>
                        )}
                        <button
                          onClick={handleForceDeleteTournament}
                          style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '0.78rem', opacity: 0.7 }}
                        >
                          Excluir permanentemente
                        </button>
                      </div>

                      {/* Apertai Stream Controls */}
                      {((selectedTournament as any).stream_mode === 'apertai' || isApertaiUser) && selectedTournament.status === 'live' && (
                        <StreamControls tournamentId={selectedTournament.id} />
                      )}
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

                  {/* Public live link */}
                  {selectedTournament.public_token && (
                    <div className="torneio-link-box" style={{ marginTop: 8 }}>
                      <FontAwesomeIcon icon={faLink} style={{ color: '#F58A25' }} />
                      <input readOnly value={`${window.location.origin}/torneio/live/${selectedTournament.public_token}`} style={{ color: '#F58A25' }} />
                      <button className="torneio-link-copy" onClick={copyPublicLink} style={{ background: '#F58A25', color: '#fff' }}>
                        <FontAwesomeIcon icon={faCopy} /> Link Público
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Teams tab */}
              {detailTab === 'teams' && (
                <div>
                  {selectedTournament.pairing_mode && selectedTournament.pairing_mode !== 'fixed' ? (
                    /* ─── Dynamic pairing: individual players management ─── */
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>
                          {selectedTournament.pairing_mode === 'dynamic_single'
                            ? 'Sorteio de duplas (unico) — inscreva jogadores individuais'
                            : 'Sorteio de duplas (por rodada) — duplas novas a cada rodada'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        {/* Left side */}
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 700, color: '#3b82f6' }}>Lado Esquerdo</h4>
                          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                            <input
                              placeholder="Nome do jogador..."
                              value={newPlayerNameLeft}
                              onChange={e => setNewPlayerNameLeft(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleAddIndividualPlayer('left')}
                              style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color, #e2e8f0)', fontSize: '0.9rem' }}
                            />
                            <button
                              onClick={() => handleAddIndividualPlayer('left')}
                              style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '1rem' }}
                            >
                              +
                            </button>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {individualPlayers.filter((p: any) => p.side === 'left').map((p: any) => (
                              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: p.eliminated ? 'rgba(239,68,68,0.06)' : p.is_seed ? 'rgba(251,191,36,0.08)' : 'var(--bg-secondary, #f8fafc)', border: `1px solid ${p.is_seed ? 'rgba(251,191,36,0.3)' : 'var(--border-color, #e2e8f0)'}`, opacity: p.eliminated ? 0.5 : 1 }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: p.is_seed ? 700 : 500, textDecoration: p.eliminated ? 'line-through' : 'none' }}>
                                  {p.is_seed && <FontAwesomeIcon icon={faMedal} style={{ color: '#fbbf24', marginRight: 4, fontSize: '0.75rem' }} />}
                                  {p.player_name}
                                  {p.total_losses > 0 && <span style={{ fontSize: '0.7rem', marginLeft: 6, color: p.total_losses >= 2 ? '#ef4444' : '#d97706' }}>{p.total_losses}D</span>}
                                </span>
                                <div style={{ display: 'flex', gap: 4 }}>
                                  <button
                                    onClick={async () => { await tournamentService.toggleSeed(selectedTournament!.id, p.id); loadIndividualPlayers(selectedTournament!.id); }}
                                    title={p.is_seed ? 'Remover cabeca de chave' : 'Definir cabeca de chave'}
                                    style={{ background: p.is_seed ? 'rgba(251,191,36,0.15)' : 'rgba(251,191,36,0.05)', color: p.is_seed ? '#fbbf24' : '#94a3b8', border: `1px solid ${p.is_seed ? 'rgba(251,191,36,0.3)' : 'transparent'}`, borderRadius: 6, padding: '2px 6px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}
                                  >
                                    <FontAwesomeIcon icon={faMedal} />
                                  </button>
                                  <button
                                    onClick={() => handleRemoveIndividualPlayer(p.id)}
                                    style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
                                  >
                                    x
                                  </button>
                                </div>
                              </div>
                            ))}
                            {individualPlayers.filter((p: any) => p.side === 'left').length === 0 && (
                              <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>Nenhum jogador</div>
                            )}
                          </div>
                        </div>

                        {/* Right side */}
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 700, color: '#ef4444' }}>Lado Direito</h4>
                          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                            <input
                              placeholder="Nome do jogador..."
                              value={newPlayerNameRight}
                              onChange={e => setNewPlayerNameRight(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleAddIndividualPlayer('right')}
                              style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color, #e2e8f0)', fontSize: '0.9rem' }}
                            />
                            <button
                              onClick={() => handleAddIndividualPlayer('right')}
                              style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '1rem' }}
                            >
                              +
                            </button>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {individualPlayers.filter((p: any) => p.side === 'right').map((p: any) => (
                              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: p.eliminated ? 'rgba(239,68,68,0.06)' : p.is_seed ? 'rgba(251,191,36,0.08)' : 'var(--bg-secondary, #f8fafc)', border: `1px solid ${p.is_seed ? 'rgba(251,191,36,0.3)' : 'var(--border-color, #e2e8f0)'}`, opacity: p.eliminated ? 0.5 : 1 }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: p.is_seed ? 700 : 500, textDecoration: p.eliminated ? 'line-through' : 'none' }}>
                                  {p.is_seed && <FontAwesomeIcon icon={faMedal} style={{ color: '#fbbf24', marginRight: 4, fontSize: '0.75rem' }} />}
                                  {p.player_name}
                                  {p.total_losses > 0 && <span style={{ fontSize: '0.7rem', marginLeft: 6, color: p.total_losses >= 2 ? '#ef4444' : '#d97706' }}>{p.total_losses}D</span>}
                                </span>
                                <div style={{ display: 'flex', gap: 4 }}>
                                  <button
                                    onClick={async () => { await tournamentService.toggleSeed(selectedTournament!.id, p.id); loadIndividualPlayers(selectedTournament!.id); }}
                                    title={p.is_seed ? 'Remover cabeca de chave' : 'Definir cabeca de chave'}
                                    style={{ background: p.is_seed ? 'rgba(251,191,36,0.15)' : 'rgba(251,191,36,0.05)', color: p.is_seed ? '#fbbf24' : '#94a3b8', border: `1px solid ${p.is_seed ? 'rgba(251,191,36,0.3)' : 'transparent'}`, borderRadius: 6, padding: '2px 6px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}
                                  >
                                    <FontAwesomeIcon icon={faMedal} />
                                  </button>
                                  <button
                                    onClick={() => handleRemoveIndividualPlayer(p.id)}
                                    style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
                                  >
                                    x
                                  </button>
                                </div>
                              </div>
                            ))}
                            {individualPlayers.filter((p: any) => p.side === 'right').length === 0 && (
                              <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>Nenhum jogador</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Generated pairs display */}
                      {pairsGenerated && generatedPairs.length > 0 && (
                        <div style={{ marginTop: 20, padding: 16, background: 'rgba(16,185,129,0.06)', borderRadius: 12, border: '1px solid rgba(16,185,129,0.2)' }}>
                          <h4 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 700, color: '#10b981' }}>Duplas Sorteadas</h4>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {generatedPairs.map((pair: any, idx: number) => (
                              <div key={idx} style={{ padding: '8px 14px', borderRadius: 8, background: 'var(--bg-primary, #fff)', border: '1px solid var(--border-color, #e2e8f0)', fontSize: '0.88rem' }}>
                                <strong>{pair.team_name || `Dupla ${idx + 1}`}</strong>
                                {pair.left_player && pair.right_player && (
                                  <span style={{ color: '#64748b' }}> — {pair.left_player} + {pair.right_player}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      {(() => {
                        const allMatchesDone = selectedTournament.bracket_generated && bracketData &&
                          [...(bracketData.winners?.flat() || []), ...(bracketData.losers?.flat() || []), bracketData.grand_final, bracketData.third_place]
                            .filter(Boolean)
                            .filter((m: any) => !m.is_bye)
                            .every((m: any) => m.status === 'completed');
                        const isPerRound = selectedTournament.pairing_mode === 'dynamic_per_round';

                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                            {/* Round completed banner for per-round mode */}
                            {isPerRound && allMatchesDone && (
                              <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(245,138,37,0.08)', border: '1px solid rgba(245,138,37,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#F58A25' }}>Rodada concluída!</div>
                                  <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: 2 }}>Desfaça as duplas e sorteie novamente para a próxima rodada.</div>
                                </div>
                                <button onClick={handleNewRound} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', background: '#F58A25', color: '#fff', whiteSpace: 'nowrap' }}>
                                  <FontAwesomeIcon icon={faUsers} /> Nova Rodada
                                </button>
                              </div>
                            )}

                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              {/* Sortear Duplas: only when no pairs yet and no bracket */}
                              {individualPlayers.length >= 2 && !pairsGenerated && !selectedTournament.bracket_generated && (
                                <button className="torneio-btn-primary" onClick={handleGeneratePairsClick} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' }}>
                                  <FontAwesomeIcon icon={faUsers} /> Sortear Duplas
                                </button>
                              )}
                              {/* Sortear Confrontos: only after pairs, before bracket */}
                              {pairsGenerated && !selectedTournament.bracket_generated && !liveDraw && (
                                <button className="torneio-btn-primary" onClick={handleSortearConfrontos} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem', background: '#10b981' }}>
                                  <FontAwesomeIcon icon={faTrophy} /> Sortear Confrontos
                                </button>
                              )}
                              {/* Re-sortear duplas: only before bracket generated */}
                              {pairsGenerated && !selectedTournament.bracket_generated && (
                                <button className="torneio-btn-outline" onClick={handleGeneratePairsClick} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color, #e2e8f0)', cursor: 'pointer', fontSize: '0.85rem' }}>
                                  Re-sortear Duplas
                                </button>
                              )}
                              {selectedTournament.bracket_generated && !allMatchesDone && (
                                <button className="torneio-btn-outline" onClick={handleGenerateBracket} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                                  Regenerar Chave
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Also show generated teams below if they exist */}
                      {selectedTournament.teams && selectedTournament.teams.length > 0 && (
                        <div style={{ marginTop: 20 }}>
                          <h4 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 600 }}>Equipes no Torneio</h4>
                          <div className="torneio-teams-list">
                            {selectedTournament.teams.map(team => (
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
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <button
                                    onClick={() => setEditTeamModal(team)}
                                    style={{ background: 'rgba(245,138,37,0.08)', color: '#F58A25', border: '1px solid rgba(245,138,37,0.2)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                                  >
                                    Editar
                                  </button>
                                  <span className="torneio-team-status" style={{
                                    background: team.status === 'approved' || team.status === 'active' ? '#dcfce7' : team.status === 'champion' ? '#fef08a' : '#f1f5f9',
                                    color: team.status === 'approved' || team.status === 'active' ? '#16a34a' : team.status === 'champion' ? '#a16207' : '#64748b',
                                  }}>
                                    {team.status === 'approved' ? 'Aprovado' : team.status === 'active' ? 'Ativo' : team.status === 'champion' ? 'Campeao' : team.status === 'runner_up' ? 'Vice' : team.status === 'third_place' ? '3o Lugar' : team.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* ─── Fixed pairing: original teams management ─── */
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
                              <button
                                onClick={() => setEditTeamModal(team)}
                                style={{ background: 'rgba(245,138,37,0.08)', color: '#F58A25', border: '1px solid rgba(245,138,37,0.2)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                              >
                                Editar
                              </button>
                              {team.status === 'registered' && (
                                isDynamicPairing ? (
                                  <button className="torneio-btn-success" style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }} onClick={() => { setApproveModalTeamId(team.id); setApproveSide('left'); }}>
                                    <FontAwesomeIcon icon={faCheck} /> Aprovar (lado)
                                  </button>
                                ) : (
                                  <button className="torneio-btn-success" style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }} onClick={() => handleApproveTeam(team.id)}>
                                    <FontAwesomeIcon icon={faCheck} /> Aprovar
                                  </button>
                                )
                              )}
                              <span className="torneio-team-status" style={{
                                background: team.status === 'approved' || team.status === 'active' ? '#dcfce7' : team.status === 'registered' ? '#fef3c7' : team.status === 'champion' ? '#fef08a' : '#f1f5f9',
                                color: team.status === 'approved' || team.status === 'active' ? '#16a34a' : team.status === 'registered' ? '#d97706' : team.status === 'champion' ? '#a16207' : '#64748b',
                              }}>
                                {team.status === 'approved' ? 'Aprovado' : team.status === 'registered' ? 'Pendente' : team.status === 'active' ? 'Ativo' : team.status === 'champion' ? 'Campeao' : team.status === 'runner_up' ? 'Vice' : team.status === 'third_place' ? '3o Lugar' : team.status === 'eliminated_winners' ? 'Na Repescagem' : team.status === 'eliminated_losers' ? 'Eliminado' : team.status}
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
                          <button className="torneio-btn-primary" onClick={handleSortearConfrontos} style={{ padding: '12px 24px', fontSize: '1rem', borderRadius: '10px', border: 'none', cursor: 'pointer' }}>
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
                </div>
              )}

              {/* Groups tab */}
              {detailTab === 'groups' && (
                <div>
                  {groupsLoading ? (
                    <div className="torneio-loading"><FontAwesomeIcon icon={faSpinner} spin /> Carregando grupos...</div>
                  ) : groupData && groupData.length > 0 ? (
                    <>
                      {groupData.map(group => (
                        <div key={group.id} style={{ marginBottom: 24 }}>
                          <h4 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 700 }}>{group.group_name}</h4>
                          <div style={{ overflowX: 'auto' }}>
                            <table className="torneio-ranking-table" style={{ width: '100%', marginBottom: 8 }}>
                              <thead>
                                <tr>
                                  <th style={{ width: 36 }}>Pos</th>
                                  <th>Equipe</th>
                                  <th style={{ textAlign: 'center' }}>J</th>
                                  <th style={{ textAlign: 'center' }}>V</th>
                                  <th style={{ textAlign: 'center' }}>E</th>
                                  <th style={{ textAlign: 'center' }}>D</th>
                                  <th style={{ textAlign: 'center' }}>Pts</th>
                                  <th style={{ textAlign: 'center' }}>Saldo</th>
                                </tr>
                              </thead>
                              <tbody>
                                {group.standings.map(s => (
                                  <tr key={s.team_id} style={{
                                    background: s.advances ? 'rgba(16,185,129,0.08)' : undefined,
                                    opacity: !s.advances && s.matches_played > 0 ? 0.6 : 1,
                                  }}>
                                    <td>
                                      <span style={{
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                        width: 24, height: 24, borderRadius: '50%', fontSize: '0.8rem', fontWeight: 700,
                                        background: s.advances ? '#10b981' : '#94a3b8', color: '#fff',
                                      }}>
                                        {s.position}
                                      </span>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{s.team_name}</td>
                                    <td style={{ textAlign: 'center' }}>{s.matches_played}</td>
                                    <td style={{ textAlign: 'center' }}>{s.wins}</td>
                                    <td style={{ textAlign: 'center' }}>{s.draws}</td>
                                    <td style={{ textAlign: 'center' }}>{s.losses}</td>
                                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{s.points}</td>
                                    <td style={{ textAlign: 'center', color: s.point_diff > 0 ? '#10b981' : s.point_diff < 0 ? '#ef4444' : undefined }}>
                                      {s.point_diff > 0 ? '+' : ''}{s.point_diff}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {/* Group matches */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                            {group.matches
                              .sort((a, b) => a.match_number - b.match_number)
                              .map(match => (
                                <div
                                  key={match.id}
                                  onClick={() => selectedTournament.status === 'live' && match.team1_id && match.team2_id && match.status !== 'completed' ? setSelectedMatch(match) : undefined}
                                  style={{
                                    padding: '8px 12px', borderRadius: 8,
                                    border: '1px solid var(--border-color, #e2e8f0)',
                                    background: match.status === 'completed' ? 'rgba(16,185,129,0.05)' : match.status === 'live' ? 'rgba(239,68,68,0.05)' : 'var(--bg-secondary, #f8fafc)',
                                    fontSize: '0.82rem', minWidth: 180,
                                    cursor: selectedTournament.status === 'live' && match.team1_id && match.team2_id && match.status !== 'completed' ? 'pointer' : 'default',
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#94a3b8', fontSize: '0.75rem' }}>
                                    <span>#{match.match_number}</span>
                                    {match.status === 'live' && <span style={{ color: '#ef4444', fontWeight: 700 }}>AO VIVO</span>}
                                    {match.status === 'completed' && <FontAwesomeIcon icon={faCheck} style={{ color: '#10b981' }} />}
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: match.winner_id === match.team1_id ? 700 : 400 }}>
                                    <span>{match.team1_name || 'A definir'}</span>
                                    <span>{match.team1_score ?? '-'}</span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: match.winner_id === match.team2_id ? 700 : 400 }}>
                                    <span>{match.team2_name || 'A definir'}</span>
                                    <span>{match.team2_score ?? '-'}</span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                      {/* Complete groups button */}
                      {!(selectedTournament as any).group_stage_completed && selectedTournament.status === 'live' && (
                        <div style={{ textAlign: 'center', marginTop: 20 }}>
                          <button
                            className="torneio-btn-success"
                            onClick={handleCompleteGroupStage}
                            style={{ padding: '12px 24px', fontSize: '1rem', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700 }}
                          >
                            <FontAwesomeIcon icon={faChevronRight} /> Avançar para Mata-Mata
                          </button>
                          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 8 }}>
                            Todas as partidas dos grupos devem estar concluídas
                          </p>
                        </div>
                      )}
                      {(selectedTournament as any).group_stage_completed && (
                        <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(16,185,129,0.08)', borderRadius: 10, marginTop: 16 }}>
                          <FontAwesomeIcon icon={faCheck} style={{ color: '#10b981', marginRight: 8 }} />
                          <span style={{ fontWeight: 600, color: '#10b981' }}>Fase de grupos concluída — Veja a chave eliminatória na aba "Chave"</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="torneio-empty">
                      <p>Nenhum grupo disponível</p>
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
                    selectedTournament.format === 'group_stage' && !bracketData.group_stage_completed ? (
                      <div className="torneio-empty">
                        <FontAwesomeIcon icon={faTrophy} />
                        <p>Fase de grupos em andamento</p>
                        <small>A chave eliminatória será gerada após concluir a fase de grupos. Veja a aba "Grupos".</small>
                      </div>
                    ) : (
                      <>
                        {/* Edit mode toggle */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12, gap: 8 }}>
                          {bracketEditMode ? (
                            <>
                              <span style={{ fontSize: '0.8rem', color: '#F58A25', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <FontAwesomeIcon icon={faCircle} style={{ fontSize: 6 }} /> Modo edicao ativo — clique nas partidas ou equipes para editar
                              </span>
                              <button
                                onClick={() => setBracketEditMode(false)}
                                style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border-color, #e2e8f0)', background: 'transparent', color: 'inherit', cursor: 'pointer', fontSize: '0.8rem' }}
                              >
                                Sair do modo edicao
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                if (confirm('ATENCAO: A edicao manual da chave pode ter efeitos irreversiveis (alterar resultados, equipes, etc). Deseja continuar?')) {
                                  setBracketEditMode(true);
                                }
                              }}
                              style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(245,138,37,0.3)', background: 'rgba(245,138,37,0.05)', color: '#F58A25', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                            >
                              Alterar Chave Manualmente
                            </button>
                          )}
                        </div>
                        <BracketViewer
                          winners={bracketData.winners}
                          losers={bracketData.losers}
                          grandFinal={bracketData.grand_final}
                          thirdPlace={bracketData.third_place}
                          onMatchClick={(m) => {
                            if (bracketEditMode) {
                              setEditMatchModal(m);
                            } else {
                              setSelectedMatch(m);
                            }
                          }}
                          interactive={selectedTournament.status === 'live' || bracketEditMode}
                        />
                      </>
                    )
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
                              <span>#{match.match_number} — {match.bracket_type === 'winners' ? 'Vencedores' : match.bracket_type === 'losers' ? 'Perdedores' : match.bracket_type === 'grand_final' ? 'Grande Final' : match.bracket_type === 'group' ? 'Grupo' : '3º Lugar'} Rodada {match.round_number}</span>
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
                                <button className="torneio-btn-success" onClick={() => setSelectedMatch(match)}>
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
              {/* Sponsors tab */}
              {detailTab === 'sponsors' && selectedTournament && (
                <SponsorsTab tournamentId={selectedTournament.id} />
              )}
          </div>
        </div>
      )}

      {/* Bracket Mode Modal (normal vs live draw) */}
      {showBracketModal && (
        <div className="mm-overlay" onClick={() => setShowBracketModal(false)}>
          <div className="mm-modal mm-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="mm-header">
              <h3>Sortear Confrontos</h3>
              <button className="mm-close" onClick={() => setShowBracketModal(false)}>&times;</button>
            </div>
            <div className="mm-content">
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 16 }}>
                Escolha como sortear os confrontos:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button onClick={handleGenerateBracket} style={{ padding: '16px', borderRadius: 12, border: '2px solid var(--border-color, #334155)', background: 'var(--bg-secondary, #1a1a2e)', cursor: 'pointer', textAlign: 'left', color: 'inherit' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}><FontAwesomeIcon icon={faTrophy} style={{ marginRight: 8 }} />Sorteio Instantaneo</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 4 }}>Gera toda a chave de uma vez</div>
                </button>
                <button onClick={handleStartLiveDraw} style={{ padding: '16px', borderRadius: 12, border: '2px solid #F58A25', background: 'rgba(245,138,37,0.08)', cursor: 'pointer', textAlign: 'left', color: 'inherit' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#F58A25' }}><FontAwesomeIcon icon={faPlay} style={{ marginRight: 8 }} />Sorteio Ao Vivo</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 4 }}>Sorteie um confronto por vez com animacao na pagina publica</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Draw Control Panel (handles both confrontations and pairs) */}
      {liveDraw && !liveDraw.finished && selectedTournament && (
        <div className="mm-overlay">
          <div className="mm-modal mm-modal-md" onClick={e => e.stopPropagation()}>
            <div className="mm-header">
              <h3>
                {liveDraw.type === 'pairs'
                  ? `Sorteio de Duplas Ao Vivo — ${liveDraw.revealed_count || 0}/${liveDraw.pairs?.length || 0}`
                  : `Sorteio Ao Vivo — ${liveDraw.revealed_count || 0}/${liveDraw.matches?.length || 0}`
                }
              </h3>
            </div>
            <div className="mm-content">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {liveDraw.type === 'pairs' ? (
                  /* ─── Pairs list ─── */
                  liveDraw.pairs?.map((p: any, idx: number) => (
                    <div key={idx} style={{
                      padding: '12px 16px', borderRadius: 10,
                      background: p.revealed ? 'rgba(16,185,129,0.08)' : 'var(--bg-secondary, #f8fafc)',
                      border: `1px solid ${p.revealed ? 'rgba(16,185,129,0.2)' : 'var(--border-color, #e2e8f0)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {p.revealed ? `${p.left_player} & ${p.right_player}` : `Dupla ${idx + 1}`}
                      </span>
                      {p.revealed ? (
                        <FontAwesomeIcon icon={faCheck} style={{ color: '#10b981' }} />
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Aguardando...</span>
                      )}
                    </div>
                  ))
                ) : (
                  /* ─── Confrontation list ─── */
                  <>
                    {liveDraw.bye_teams?.length > 0 && (
                      <div style={{ padding: '10px 14px', borderRadius: 10, background: liveDraw.byes_revealed ? 'rgba(245,138,37,0.08)' : 'var(--bg-secondary, #f8fafc)', border: `1px solid ${liveDraw.byes_revealed ? 'rgba(245,138,37,0.2)' : 'var(--border-color, #e2e8f0)'}` }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: liveDraw.byes_revealed ? '#F58A25' : '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>
                          Passam Direto (BYE) {!liveDraw.byes_revealed && '— Aguardando...'}
                        </div>
                        {liveDraw.byes_revealed ? (
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {liveDraw.bye_teams.map((t: any) => (
                              <span key={t.id} style={{ fontSize: '0.85rem', fontWeight: 600, color: '#F58A25' }}>{t.name}</span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{liveDraw.bye_teams.length} dupla(s)</span>
                        )}
                      </div>
                    )}
                    {liveDraw.matches?.map((m: any, idx: number) => (
                      <div key={idx} style={{
                        padding: '12px 16px', borderRadius: 10,
                        background: m.revealed ? 'rgba(16,185,129,0.08)' : 'var(--bg-secondary, #f8fafc)',
                        border: `1px solid ${m.revealed ? 'rgba(16,185,129,0.2)' : 'var(--border-color, #e2e8f0)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                          {m.revealed ? `${m.team1_name} vs ${m.team2_name}` : `Confronto ${idx + 1}`}
                        </span>
                        {m.revealed ? (
                          <FontAwesomeIcon icon={faCheck} style={{ color: '#10b981' }} />
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Aguardando...</span>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={handleDrawNextMatch}
                  disabled={liveDrawRevealing}
                  style={{
                    flex: 1, padding: '14px', borderRadius: 12, border: 'none',
                    background: liveDrawRevealing ? '#94a3b8' : '#F58A25', color: '#fff',
                    cursor: liveDrawRevealing ? 'not-allowed' : 'pointer',
                    fontWeight: 700, fontSize: '1rem',
                  }}
                >
                  {liveDrawRevealing ? 'Sorteando...'
                    : liveDraw.type === 'pairs' ? 'Sortear Proxima Dupla'
                    : liveDraw.bye_teams?.length > 0 && !liveDraw.byes_revealed ? 'Revelar Quem Passa Direto'
                    : 'Sortear Proximo Confronto'}
                </button>
                <button
                  onClick={handleDrawAll}
                  disabled={liveDrawRevealing}
                  style={{
                    padding: '14px 20px', borderRadius: 12, border: '2px solid #F58A25',
                    background: 'transparent', color: '#F58A25',
                    cursor: liveDrawRevealing ? 'not-allowed' : 'pointer',
                    fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap',
                    opacity: liveDrawRevealing ? 0.5 : 1,
                  }}
                >
                  Sortear Todos
                </button>
              </div>
            </div>
            {liveDraw.type === 'pairs' && liveDraw.pairs?.every((p: any) => p.revealed) && (
              <div className="mm-footer" style={{ justifyContent: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>
                  <FontAwesomeIcon icon={faCheck} style={{ marginRight: 6 }} />
                  Todas as duplas sorteadas!
                </span>
              </div>
            )}
            {liveDraw.type !== 'pairs' && liveDraw.matches?.every((m: any) => m.revealed) && (
              <div className="mm-footer" style={{ justifyContent: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>
                  <FontAwesomeIcon icon={faCheck} style={{ marginRight: 6 }} />
                  Todos os confrontos sorteados! Chave gerada automaticamente.
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Draw Schedule Modal */}
      {showDrawModal && (
        <div className="mm-overlay" onClick={() => setShowDrawModal(false)}>
          <div className="mm-modal mm-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="mm-header">
              <h3>Sortear Duplas</h3>
              <button className="mm-close" onClick={() => setShowDrawModal(false)}>&times;</button>
            </div>
            <div className="mm-content">
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 16 }}>
                As duplas serão sorteadas agora. Escolha como revelar o resultado na página pública:
              </p>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 12, fontSize: '0.9rem' }}>
                <input type="radio" checked={drawLive} onChange={() => { setDrawLive(true); setDrawImmediate(false); }} />
                <div>
                  <strong style={{ color: '#F58A25' }}><FontAwesomeIcon icon={faPlay} style={{ marginRight: 4 }} /> Sorteio Ao Vivo</strong>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Animacao de sorteio dispara na pagina publica em tempo real</div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 12, fontSize: '0.9rem' }}>
                <input type="radio" checked={!drawLive && drawImmediate} onChange={() => { setDrawLive(false); setDrawImmediate(true); }} />
                <div>
                  <strong>Revelar imediatamente</strong>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>O resultado aparece na hora na pagina publica (sem animacao)</div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 12, fontSize: '0.9rem' }}>
                <input type="radio" checked={!drawLive && !drawImmediate} onChange={() => { setDrawLive(false); setDrawImmediate(false); }} />
                <div>
                  <strong>Agendar revelacao</strong>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>A pagina publica mostra countdown ate a hora marcada</div>
                </div>
              </label>

              {!drawLive && !drawImmediate && (
                <div className="mm-field" style={{ marginTop: 8 }}>
                  <label>Horario da revelacao</label>
                  <input
                    type="time"
                    value={drawRevealTime}
                    onChange={e => setDrawRevealTime(e.target.value)}
                    style={{ fontSize: '1.2rem', padding: '8px 12px', textAlign: 'center' }}
                  />
                </div>
              )}
            </div>
            <div className="mm-footer">
              <button className="mm-btn mm-btn-secondary" onClick={() => setShowDrawModal(false)}>Cancelar</button>
              <button
                className="mm-btn mm-btn-primary"
                onClick={handleConfirmDraw}
                disabled={!drawLive && !drawImmediate && !drawRevealTime}
              >
                <FontAwesomeIcon icon={faUsers} /> Sortear Duplas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve with Side Selection Modal (dynamic pairing) */}
      {approveModalTeamId && selectedTournament && (
        <div className="mm-overlay" onClick={() => setApproveModalTeamId(null)}>
          <div className="mm-modal mm-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="mm-header">
              <h3>Aprovar Jogador — Escolher Lado</h3>
              <button className="mm-close" onClick={() => setApproveModalTeamId(null)}>&times;</button>
            </div>
            <div className="mm-content">
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 16 }}>
                Esse torneio usa sorteio dinâmico de duplas. Escolha o lado para este jogador:
              </p>

              {/* Current sides count */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1, padding: '10px', borderRadius: 10, background: approveSide === 'left' ? 'rgba(59,130,246,0.1)' : 'var(--bg-secondary, #f8fafc)', border: approveSide === 'left' ? '2px solid #3b82f6' : '2px solid var(--border-color, #e2e8f0)', cursor: 'pointer', textAlign: 'center' }}
                  onClick={() => setApproveSide('left')}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', marginBottom: 4 }}>Esquerdo</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{individualPlayers.filter(p => p.side === 'left').length}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>jogadores</div>
                </div>
                <div style={{ flex: 1, padding: '10px', borderRadius: 10, background: approveSide === 'right' ? 'rgba(239,68,68,0.1)' : 'var(--bg-secondary, #f8fafc)', border: approveSide === 'right' ? '2px solid #ef4444' : '2px solid var(--border-color, #e2e8f0)', cursor: 'pointer', textAlign: 'center' }}
                  onClick={() => setApproveSide('right')}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', marginBottom: 4 }}>Direito</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{individualPlayers.filter(p => p.side === 'right').length}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>jogadores</div>
                </div>
              </div>

              {/* Show current players in each side */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  {individualPlayers.filter(p => p.side === 'left').map((p: any) => (
                    <div key={p.id} style={{ fontSize: '0.8rem', padding: '3px 8px', borderRadius: 6, background: 'rgba(59,130,246,0.06)', marginBottom: 3, color: '#64748b' }}>{p.player_name}</div>
                  ))}
                </div>
                <div style={{ flex: 1 }}>
                  {individualPlayers.filter(p => p.side === 'right').map((p: any) => (
                    <div key={p.id} style={{ fontSize: '0.8rem', padding: '3px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.06)', marginBottom: 3, color: '#64748b' }}>{p.player_name}</div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mm-footer">
              <button className="mm-btn mm-btn-secondary" onClick={() => setApproveModalTeamId(null)}>Cancelar</button>
              <button className="mm-btn mm-btn-primary" onClick={() => handleApproveTeam(approveModalTeamId, approveSide)}>
                <FontAwesomeIcon icon={faCheck} /> Aprovar no lado {approveSide === 'left' ? 'esquerdo' : 'direito'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Match Detail Modal */}
      {selectedMatch && (
        <MatchDetailModal match={selectedMatch} onClose={() => {
          setSelectedMatch(null);
          if (selectedTournament) {
            loadBracket(selectedTournament.id);
            if (selectedTournament.format === 'group_stage') loadGroups(selectedTournament.id);
          } else {
            // Refresh LiveBracketView when closing from Live tab
            setLiveRefreshKey(k => k + 1);
          }
        }} />
      )}

      {/* ─── Edit Team Modal ─── */}
      {editTeamModal && selectedTournament && (() => {
        const team = editTeamModal;
        const members = team.members || [];
        return (
          <div className="mm-overlay" onClick={() => setEditTeamModal(null)}>
            <div className="mm-modal mm-modal-sm" onClick={e => e.stopPropagation()}>
              <div className="mm-header">
                <h3>Editar Equipe</h3>
                <button className="mm-close" onClick={() => setEditTeamModal(null)}>&times;</button>
              </div>
              <div className="mm-content">
                <div className="mm-field">
                  <label>Nome da equipe</label>
                  <input
                    type="text"
                    defaultValue={team.name || ''}
                    id="edit-team-name"
                    style={{ fontSize: '1rem' }}
                  />
                </div>

                {members.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 8, display: 'block' }}>Integrantes</label>
                    {members.map((m: any, idx: number) => (
                      <div key={idx} className="mm-field" style={{ marginBottom: 6 }}>
                        <input
                          type="text"
                          defaultValue={m.name || ''}
                          id={`edit-member-${idx}`}
                          placeholder={`Integrante ${idx + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {members.length === 0 && selectedTournament.team_size > 1 && (
                  <div style={{ marginTop: 12 }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 8, display: 'block' }}>Integrantes</label>
                    {Array.from({ length: selectedTournament.team_size }, (_, idx) => (
                      <div key={idx} className="mm-field" style={{ marginBottom: 6 }}>
                        <input
                          type="text"
                          defaultValue=""
                          id={`edit-member-${idx}`}
                          placeholder={`Integrante ${idx + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="mm-footer">
                <button className="mm-btn mm-btn-secondary" onClick={() => setEditTeamModal(null)}>Cancelar</button>
                <button className="mm-btn mm-btn-primary" onClick={async () => {
                  const nameInput = document.getElementById('edit-team-name') as HTMLInputElement;
                  const newName = nameInput?.value?.trim();

                  // Collect members
                  const memberCount = members.length || selectedTournament.team_size;
                  const newMembers: { external_name: string; old_name?: string }[] = [];
                  for (let i = 0; i < memberCount; i++) {
                    const input = document.getElementById(`edit-member-${i}`) as HTMLInputElement;
                    if (input?.value?.trim()) {
                      newMembers.push({
                        external_name: input.value.trim(),
                        old_name: members[i]?.name || undefined,
                      });
                    }
                  }

                  // Auto-generate team name from members if team_size > 1 and name matches old pattern
                  let finalName = newName || team.name;
                  if (newMembers.length >= 2) {
                    const autoName = newMembers.map(m => m.external_name).join(' & ');
                    // If name was auto-generated (contains &), update it
                    if (!newName || newName === team.name) {
                      const oldMemberNames = members.map((m: any) => m.name).filter(Boolean);
                      if (oldMemberNames.length >= 2 && team.name?.includes('&')) {
                        finalName = autoName;
                      }
                    }
                  }

                  try {
                    await tournamentService.renameTeam(selectedTournament.id, team.id, finalName);
                    if (newMembers.length > 0) {
                      // Update members via the updateTeam endpoint
                      await tournamentService.updateTeam(selectedTournament.id, team.id, { members: newMembers });
                    }
                    toast.success('Equipe atualizada!');
                    const tRes = await tournamentService.getTournament(selectedTournament.id);
                    setSelectedTournament(tRes.data);
                    if (selectedTournament.pairing_mode !== 'fixed') {
                      loadIndividualPlayers(selectedTournament.id);
                    }
                    setEditTeamModal(null);
                  } catch (err: any) {
                    toast.error(err.response?.data?.message || 'Erro ao atualizar equipe');
                  }
                }}>
                  Salvar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── Edit Match Modal (manual bracket editing) ─── */}
      {editMatchModal && selectedTournament && (
        <div className="mm-overlay" onClick={() => setEditMatchModal(null)}>
          <div className="mm-modal mm-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="mm-header">
              <h3>Editar Partida #{editMatchModal.match_number}</h3>
              <button className="mm-close" onClick={() => setEditMatchModal(null)}>&times;</button>
            </div>
            <div className="mm-content">
              <div style={{ marginBottom: 16, padding: 12, borderRadius: 10, background: 'var(--bg-secondary, #f8fafc)', border: '1px solid var(--border-color, #e2e8f0)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span
                    style={{ fontWeight: 600, cursor: 'pointer', color: '#3B82F6', textDecoration: 'underline dotted' }}
                    onClick={() => {
                      if (editMatchModal.team1_id) {
                        const name = prompt('Novo nome para a equipe:', editMatchModal.team1_name || '');
                        if (name && name.trim()) {
                          tournamentService.renameTeam(selectedTournament.id, editMatchModal.team1_id, name.trim()).then(() => {
                            toast.success('Equipe renomeada!');
                            loadBracket(selectedTournament.id);
                            setEditMatchModal(null);
                          }).catch((e: any) => toast.error(e.response?.data?.message || 'Erro'));
                        }
                      }
                    }}
                  >
                    {editMatchModal.team1_name || 'A definir'}
                  </span>
                  <span style={{ fontWeight: 700 }}>{editMatchModal.team1_score ?? '-'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{ fontWeight: 600, cursor: 'pointer', color: '#EF4444', textDecoration: 'underline dotted' }}
                    onClick={() => {
                      if (editMatchModal.team2_id) {
                        const name = prompt('Novo nome para a equipe:', editMatchModal.team2_name || '');
                        if (name && name.trim()) {
                          tournamentService.renameTeam(selectedTournament.id, editMatchModal.team2_id, name.trim()).then(() => {
                            toast.success('Equipe renomeada!');
                            loadBracket(selectedTournament.id);
                            setEditMatchModal(null);
                          }).catch((e: any) => toast.error(e.response?.data?.message || 'Erro'));
                        }
                      }
                    }}
                  >
                    {editMatchModal.team2_name || 'A definir'}
                  </span>
                  <span style={{ fontWeight: 700 }}>{editMatchModal.team2_score ?? '-'}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 8 }}>
                  Status: {editMatchModal.status === 'completed' ? 'Concluida' : editMatchModal.status === 'live' ? 'Ao Vivo' : 'Pendente'}
                  {' | '}{editMatchModal.bracket_type === 'winners' ? 'Vencedores' : editMatchModal.bracket_type === 'losers' ? 'Perdedores' : editMatchModal.bracket_type === 'grand_final' ? 'Grande Final' : editMatchModal.bracket_type}
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 8 }}>Clique no nome de uma equipe para renomea-la.</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Edit scores */}
                <button
                  onClick={() => {
                    const s1 = prompt('Placar equipe 1:', String(editMatchModal.team1_score ?? 0));
                    if (s1 === null) return;
                    const s2 = prompt('Placar equipe 2:', String(editMatchModal.team2_score ?? 0));
                    if (s2 === null) return;
                    tournamentService.manualEditMatch(selectedTournament.id, editMatchModal.id, {
                      team1_score: Number(s1), team2_score: Number(s2),
                    }).then(() => {
                      toast.success('Placar atualizado!');
                      loadBracket(selectedTournament.id);
                      setEditMatchModal(null);
                    }).catch((e: any) => toast.error(e.response?.data?.message || 'Erro'));
                  }}
                  style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid var(--border-color, #e2e8f0)', background: 'var(--bg-secondary, #f8fafc)', cursor: 'pointer', textAlign: 'left', color: 'inherit' }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Editar Placar</div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>Alterar o placar desta partida</div>
                </button>

                {/* Undo match result */}
                {editMatchModal.status === 'completed' && (
                  <button
                    onClick={() => {
                      if (!confirm('Desfazer resultado desta partida? As equipes serao removidas das partidas seguintes e os stats revertidos. Esta acao nao pode ser desfeita.')) return;
                      tournamentService.undoMatchResult(selectedTournament.id, editMatchModal.id).then((res) => {
                        toast.success('Resultado desfeito!');
                        setBracketData(res.data);
                        setEditMatchModal(null);
                      }).catch((e: any) => toast.error(e.response?.data?.message || 'Erro'));
                    }}
                    style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)', cursor: 'pointer', textAlign: 'left', color: 'inherit' }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#ef4444' }}>Desfazer Resultado</div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>Reverte a partida para pendente e remove equipes das proximas partidas</div>
                  </button>
                )}

                {/* Swap teams */}
                {editMatchModal.status === 'pending' && editMatchModal.team1_id && editMatchModal.team2_id && (
                  <button
                    onClick={() => {
                      tournamentService.manualEditMatch(selectedTournament.id, editMatchModal.id, {
                        team1_id: editMatchModal.team2_id, team2_id: editMatchModal.team1_id,
                      }).then(() => {
                        toast.success('Equipes trocadas!');
                        loadBracket(selectedTournament.id);
                        setEditMatchModal(null);
                      }).catch((e: any) => toast.error(e.response?.data?.message || 'Erro'));
                    }}
                    style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid var(--border-color, #e2e8f0)', background: 'var(--bg-secondary, #f8fafc)', cursor: 'pointer', textAlign: 'left', color: 'inherit' }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Trocar Posicoes</div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>Inverter equipe 1 e equipe 2 nesta partida</div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
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
  // Group matches
  if (bracket.groups) {
    for (const group of bracket.groups) {
      if (group.matches) all.push(...group.matches);
    }
  }
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
