import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrophy, faCalendar, faMapMarkerAlt, faUsers, faSpinner, faCheck, faUserPlus, faIdCard, faCamera, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import '../styles/Torneios.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://gerenciai-backend-798546007335.us-east1.run.app';

const POSITIONS = ['ESQ', 'DIR', 'JOG', 'ATA', 'DEF', 'PIV', 'LEV', 'LIB', 'SET', 'GOL'];

const CARD_BG_MAP: Record<string, string> = {
  gold: '/fut-cards/large-rare-gold.png',
  silver: '/fut-cards/large-rare-silver.png',
  bronze: '/fut-cards/large-rare-bronze.png',
  toty: '/fut-cards/large-toty.png',
  legend: '/fut-cards/large-legend.png',
  hero: '/fut-cards/large-hero.png',
  motm: '/fut-cards/large-motm.png',
  inform: '/fut-cards/large-if-gold.png',
};

const CARD_TEXT_COLORS: Record<string, string> = {
  gold: '#4a3b10',
  silver: '#3a3a3a',
  bronze: '#3e2415',
  toty: '#d4af37',
  legend: '#B39428',
  hero: '#fff',
  motm: '#fff',
  inform: '#d4af37',
};

interface CardFormData {
  enabled: boolean;
  player_name: string;
  position: string;
  photo: File | null;
  photoPreview: string | null;
  removingBg: boolean;
}

const defaultCardForm = (playerName = ''): CardFormData => ({
  enabled: false,
  player_name: playerName,
  position: 'JOG',
  photo: null,
  photoPreview: null,
  removingBg: false,
});

interface TournamentInfo {
  id: number;
  title: string;
  description?: string;
  image_url?: string;
  tournament_date: string;
  tournament_end_date?: string;
  location?: string;
  format: string;
  team_size: number;
  max_participants?: number;
  status: string;
  registration_deadline?: string;
  require_approval: boolean;
  team_count: number;
}

export default function PublicTournamentRegistration() {
  const { registrationToken } = useParams<{ registrationToken: string }>();
  const [tournament, setTournament] = useState<TournamentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [step, setStep] = useState<'info' | 'form' | 'success'>('info');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [teamName, setTeamName] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');
  const [partners, setPartners] = useState<{ name: string; email: string; phone: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState('');

  // Card creation state
  const [showCardSection, setShowCardSection] = useState(false);
  const [myCard, setMyCard] = useState<CardFormData>(defaultCardForm());
  const [partnerCard, setPartnerCard] = useState<CardFormData>(defaultCardForm());
  const myCardPhotoRef = useRef<HTMLInputElement>(null);
  const partnerCardPhotoRef = useRef<HTMLInputElement>(null);

  const handleCardPhotoChange = async (
    file: File,
    setCardFn: React.Dispatch<React.SetStateAction<CardFormData>>
  ) => {
    const preview = URL.createObjectURL(file);
    setCardFn(prev => ({ ...prev, photoPreview: preview, photo: file, removingBg: true }));
    try {
      const mod = await import(/* @vite-ignore */ 'https://esm.sh/@imgly/background-removal@1.5.5');
      const removeBg = mod.removeBackground || mod.default;
      if (removeBg) {
        const blob = await removeBg(file, { output: { format: 'image/png' } });
        const noBgFile = new File([blob], 'card-no-bg.png', { type: 'image/png' });
        setCardFn(prev => ({ ...prev, photoPreview: URL.createObjectURL(blob), photo: noBgFile, removingBg: false }));
        return;
      }
    } catch {}
    setCardFn(prev => ({ ...prev, removingBg: false }));
  };

  const submitCardAfterRegistration = async (tournamentId: number, card: CardFormData) => {
    if (!card.enabled || !card.player_name.trim()) return;
    try {
      const fd = new FormData();
      fd.append('player_name', card.player_name.trim());
      fd.append('position', card.position);
      fd.append('overall', '70');
      fd.append('stat_atk', '50');
      fd.append('stat_def', '50');
      fd.append('stat_saq', '50');
      fd.append('stat_rec', '50');
      fd.append('stat_blq', '50');
      fd.append('stat_fin', '50');
      fd.append('card_type', 'gold');
      if (card.photo) fd.append('image', card.photo);
      await fetch(`${API_URL}/api/tournaments/${tournamentId}/cards/public`, {
        method: 'POST',
        body: fd,
      });
    } catch {
      // Card creation is optional, don't block registration success
    }
  };

  useEffect(() => {
    if (!registrationToken) return;
    fetch(`${API_URL}/api/tournaments/public/${registrationToken}`)
      .then(r => r.json())
      .then(data => {
        if (data.status === 'success') {
          setTournament(data.data);
        } else {
          setError('Torneio não encontrado');
        }
      })
      .catch(() => setError('Erro ao carregar torneio'))
      .finally(() => setLoading(false));
  }, [registrationToken]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const body: any = { name: name.trim(), email, phone };
      if (tournament && tournament.team_size > 1) {
        body.team_name = teamName || name;
        if (tournament.team_size === 2) {
          body.partner_name = partnerName;
          body.partner_email = partnerEmail;
          body.partner_phone = partnerPhone;
        } else if (partners.length > 0) {
          body.partners = partners;
        }
      }

      const res = await fetch(`${API_URL}/api/tournaments/public/${registrationToken}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        // Submit cards after successful registration (fire and forget)
        if (tournament) {
          const cardPromises: Promise<void>[] = [];
          if (myCard.enabled) {
            cardPromises.push(submitCardAfterRegistration(tournament.id, myCard));
          }
          if (tournament.team_size === 2 && partnerCard.enabled) {
            cardPromises.push(submitCardAfterRegistration(tournament.id, partnerCard));
          }
          if (cardPromises.length > 0) {
            await Promise.allSettled(cardPromises);
          }
        }
        setResultMessage(data.data?.message || 'Inscrição realizada com sucesso!');
        setStep('success');
      } else {
        setError(data.message || 'Erro ao realizar inscrição');
      }
    } catch {
      setError('Erro ao realizar inscrição');
    } finally {
      setSubmitting(false);
    }
  };

  const addPartner = () => {
    setPartners([...partners, { name: '', email: '', phone: '' }]);
  };

  const updatePartner = (index: number, field: string, value: string) => {
    const updated = [...partners];
    (updated[index] as any)[field] = value;
    setPartners(updated);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f8fafc' }}>
        <FontAwesomeIcon icon={faSpinner} spin size="2x" style={{ color: '#EAB308' }} />
      </div>
    );
  }

  if (error && !tournament) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f8fafc', flexDirection: 'column', gap: 16 }}>
        <FontAwesomeIcon icon={faTrophy} size="3x" style={{ color: '#e2e8f0' }} />
        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>{error}</p>
      </div>
    );
  }

  if (!tournament) return null;

  const isFull = tournament.max_participants ? tournament.team_count >= tournament.max_participants : false;
  const isDeadlinePassed = tournament.registration_deadline ? new Date(tournament.registration_deadline) < new Date() : false;
  const canRegister = !isFull && !isDeadlinePassed && tournament.status !== 'finished' && tournament.status !== 'cancelled';

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '20px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          {tournament.image_url ? (
            <img src={tournament.image_url} alt={tournament.title} style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 16, marginBottom: 16 }} />
          ) : (
            <div style={{ background: 'linear-gradient(135deg, #EAB308, #CA8A04)', borderRadius: 16, height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <FontAwesomeIcon icon={faTrophy} size="3x" style={{ color: 'rgba(255,255,255,0.4)' }} />
            </div>
          )}
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1a1a2e', margin: '0 0 8px' }}>{tournament.title}</h1>
          {tournament.description && <p style={{ color: '#64748b', margin: '0 0 12px' }}>{tournament.description}</p>}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, color: '#64748b', fontSize: '0.9rem', flexWrap: 'wrap' }}>
            <span><FontAwesomeIcon icon={faCalendar} /> {new Date(tournament.tournament_date).toLocaleDateString('pt-BR')}</span>
            {tournament.location && <span><FontAwesomeIcon icon={faMapMarkerAlt} /> {tournament.location}</span>}
            <span><FontAwesomeIcon icon={faUsers} /> {tournament.team_count}{tournament.max_participants ? `/${tournament.max_participants}` : ''} inscritos</span>
          </div>
        </div>

        {/* Steps */}
        {step === 'info' && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>Inscreva-se neste torneio!</h2>
            <p style={{ color: '#64748b', marginBottom: 20 }}>
              {tournament.format === 'double_elimination' ? 'Formato: Dupla Eliminatória' : 'Formato: Eliminatória Simples'}
              {tournament.team_size > 1 ? ` — Equipes de ${tournament.team_size}` : ' — Individual'}
            </p>
            {error && <p style={{ color: '#ef4444', marginBottom: 12 }}>{error}</p>}
            {canRegister ? (
              <button onClick={() => { setStep('form'); setError(''); }} style={{ background: 'linear-gradient(135deg, #EAB308, #CA8A04)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 32px', fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer' }}>
                <FontAwesomeIcon icon={faUserPlus} /> Quero me inscrever
              </button>
            ) : (
              <p style={{ color: '#ef4444', fontWeight: 600 }}>
                {isFull ? 'Vagas esgotadas' : isDeadlinePassed ? 'Prazo de inscrição encerrado' : 'Inscrições encerradas'}
              </p>
            )}
          </div>
        )}

        {step === 'form' && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>Dados da Inscrição</h2>
            {error && <p style={{ color: '#ef4444', marginBottom: 12 }}>{error}</p>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' }}>Seu Nome *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nome completo" style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' }}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
                <small style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Se você já é aluno, use o mesmo email cadastrado</small>
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' }}>Telefone</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(99) 99999-9999" style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              {/* Team name for team tournaments */}
              {tournament.team_size > 1 && (
                <>
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' }}>Nome da Equipe</label>
                    <input type="text" value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="Ex: Os Campeões" style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
                  </div>

                  {/* Partner for teams of 2 */}
                  {tournament.team_size === 2 && (
                    <>
                      <h4 style={{ margin: '8px 0 4px', color: '#475569' }}>Parceiro(a)</h4>
                      <div>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' }}>Nome do Parceiro *</label>
                        <input type="text" value={partnerName} onChange={e => setPartnerName(e.target.value)} placeholder="Nome do parceiro" style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' }}>Email do Parceiro</label>
                        <input type="email" value={partnerEmail} onChange={e => setPartnerEmail(e.target.value)} placeholder="email@exemplo.com" style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                    </>
                  )}

                  {/* Multiple partners for teams > 2 */}
                  {tournament.team_size > 2 && (
                    <>
                      <h4 style={{ margin: '8px 0 4px', color: '#475569' }}>Membros da Equipe</h4>
                      {partners.map((p, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input type="text" value={p.name} onChange={e => updatePartner(i, 'name', e.target.value)} placeholder={`Nome membro ${i + 2}`} style={{ flex: 1, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', outline: 'none' }} />
                          <input type="email" value={p.email} onChange={e => updatePartner(i, 'email', e.target.value)} placeholder="Email" style={{ flex: 1, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', outline: 'none' }} />
                        </div>
                      ))}
                      {partners.length < tournament.team_size - 1 && (
                        <button onClick={addPartner} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', color: '#64748b', fontSize: '0.85rem' }}>
                          + Adicionar membro
                        </button>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            {/* Card Creation Section */}
            <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 16, paddingTop: 16 }}>
              <button
                type="button"
                onClick={() => setShowCardSection(!showCardSection)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: showCardSection ? 'linear-gradient(135deg, rgba(234,179,8,0.08), rgba(202,138,4,0.08))' : '#f8fafc',
                  border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 16px', cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FontAwesomeIcon icon={faIdCard} style={{ color: '#EAB308', fontSize: '1.1rem' }} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1a1a2e' }}>Criar Card de Jogador</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Opcional - crie seu card estilo FUT</div>
                  </div>
                </div>
                <FontAwesomeIcon icon={showCardSection ? faChevronUp : faChevronDown} style={{ color: '#94a3b8' }} />
              </button>

              {showCardSection && (
                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* My Card */}
                  <CardFormSection
                    label={tournament.team_size > 1 ? 'Meu Card' : undefined}
                    card={myCard}
                    setCard={setMyCard}
                    playerName={name}
                    photoRef={myCardPhotoRef}
                    onPhotoChange={handleCardPhotoChange}
                  />

                  {/* Partner Card (for duplas) */}
                  {tournament.team_size === 2 && (
                    <CardFormSection
                      label="Card do Parceiro(a)"
                      card={partnerCard}
                      setCard={setPartnerCard}
                      playerName={partnerName}
                      photoRef={partnerCardPhotoRef}
                      onPhotoChange={handleCardPhotoChange}
                    />
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button onClick={() => setStep('info')} style={{ flex: 1, padding: '12px', border: '1px solid #e2e8f0', borderRadius: 10, background: 'transparent', cursor: 'pointer', color: '#64748b', fontSize: '0.95rem' }}>
                Voltar
              </button>
              <button onClick={handleSubmit} disabled={submitting || !name.trim()} style={{ flex: 2, padding: '12px', background: 'linear-gradient(135deg, #EAB308, #CA8A04)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', opacity: submitting || !name.trim() ? 0.6 : 1 }}>
                {submitting ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Confirmar Inscrição'}
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <FontAwesomeIcon icon={faCheck} size="2x" style={{ color: '#10b981' }} />
            </div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>Inscrição Realizada!</h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>{resultMessage}</p>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 32, color: '#cbd5e1', fontSize: '0.8rem' }}>
          Powered by ArenaAi
        </div>
      </div>
    </div>
  );
}

// ─── Card Form Section ───
function CardFormSection({
  label,
  card,
  setCard,
  playerName,
  photoRef,
  onPhotoChange,
}: {
  label?: string;
  card: CardFormData;
  setCard: React.Dispatch<React.SetStateAction<CardFormData>>;
  playerName: string;
  photoRef: React.RefObject<HTMLInputElement | null>;
  onPhotoChange: (file: File, setCard: React.Dispatch<React.SetStateAction<CardFormData>>) => Promise<void>;
}) {
  // Pre-fill player name from registration name when first enabling
  const didSyncRef = useRef(false);
  useEffect(() => {
    if (card.enabled && !didSyncRef.current && !card.player_name && playerName) {
      didSyncRef.current = true;
      setCard(prev => ({ ...prev, player_name: playerName }));
    }
  }, [card.enabled, playerName]);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0',
    borderRadius: 10, fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
    background: '#fff',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle, cursor: 'pointer', appearance: 'auto' as any,
  };

  return (
    <div style={{ background: '#fafbfc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
      {label && (
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: 12 }}>{label}</div>
      )}

      {/* Toggle */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: card.enabled ? 16 : 0 }}>
        <input
          type="checkbox"
          checked={card.enabled}
          onChange={e => {
            const enabled = e.target.checked;
            setCard(prev => ({
              ...prev,
              enabled,
              player_name: enabled && !prev.player_name ? playerName : prev.player_name,
            }));
          }}
          style={{ width: 18, height: 18, accentColor: '#EAB308', cursor: 'pointer' }}
        />
        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Criar meu card de jogador</span>
      </label>

      {card.enabled && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {/* Form fields */}
          <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' }}>Nome no Card</label>
              <input
                type="text"
                value={card.player_name}
                onChange={e => setCard(prev => ({ ...prev, player_name: e.target.value }))}
                placeholder="Nome do jogador"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' }}>Posicao</label>
              <select
                value={card.position}
                onChange={e => setCard(prev => ({ ...prev, position: e.target.value }))}
                style={selectStyle}
              >
                {POSITIONS.map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' }}>Foto</label>
              <input
                ref={photoRef}
                type="file"
                accept="image/*"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) onPhotoChange(file, setCard);
                }}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => photoRef.current?.click()}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 16px', border: '1px dashed #cbd5e1', borderRadius: 10,
                  background: '#fff', cursor: 'pointer', color: '#64748b', fontSize: '0.85rem',
                  width: '100%', justifyContent: 'center',
                }}
              >
                {card.removingBg ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin />
                    Removendo fundo...
                  </>
                ) : card.photoPreview ? (
                  <>
                    <FontAwesomeIcon icon={faCamera} />
                    Trocar foto
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCamera} />
                    Enviar foto (fundo removido automaticamente)
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Card preview */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: 8 }}>
            <FutCardPreview
              player_name={card.player_name || 'NOME'}
              position={card.position}
              photoPreview={card.photoPreview}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Inline FUT Card Preview (standalone, no imports) ───
function FutCardPreview({
  player_name,
  position,
  photoPreview,
}: {
  player_name: string;
  position: string;
  photoPreview: string | null;
}) {
  const bgImg = CARD_BG_MAP.gold;
  const color = CARD_TEXT_COLORS.gold;
  const w = 120;
  const h = 180;
  const scale = w / 200;

  return (
    <div
      style={{
        width: w, height: h, position: 'relative',
        backgroundImage: `url(${bgImg})`,
        backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center',
        fontFamily: "'Titillium Web', sans-serif",
        flexShrink: 0,
      }}
    >
      {/* Overall */}
      <div style={{
        position: 'absolute', top: 52 * scale, left: 32 * scale,
        fontSize: `${1.6 * scale}rem`, fontWeight: 900, color,
        lineHeight: 1, textShadow: '0 1px 2px rgba(0,0,0,0.1)',
      }}>
        70
      </div>

      {/* Position */}
      <div style={{
        position: 'absolute', top: 82 * scale, left: 32 * scale,
        fontSize: `${0.65 * scale}rem`, fontWeight: 700, color,
        textTransform: 'uppercase', letterSpacing: 0.5, width: 30 * scale, textAlign: 'center',
      }}>
        {position}
      </div>

      {/* Photo */}
      <div style={{
        position: 'absolute', top: 40 * scale, left: '50%', transform: 'translateX(-50%)',
        width: 100 * scale, height: 100 * scale, overflow: 'hidden',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}>
        {photoPreview ? (
          <img src={photoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
        ) : (
          <div style={{ color: `${color}44`, marginBottom: 5 * scale }}>
            <svg width={20 * scale} height={20 * scale} viewBox="0 0 24 24" fill="currentColor" opacity="0.4">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
        )}
      </div>

      {/* Name */}
      <div style={{
        position: 'absolute', top: 150 * scale, left: 0, right: 0,
        fontSize: `${0.78 * scale}rem`, fontWeight: 800, textTransform: 'uppercase',
        color, textAlign: 'center', letterSpacing: 0.3,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        padding: `0 ${12 * scale}px`,
      }}>
        {player_name}
      </div>

      {/* Divider */}
      <div style={{ position: 'absolute', top: 170 * scale, left: 30 * scale, right: 30 * scale, height: 1, background: `${color}44` }} />

      {/* Stats */}
      <div style={{
        position: 'absolute', top: 178 * scale, left: 25 * scale, right: 25 * scale,
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0px 0',
      }}>
        {[
          { label: 'ATK', val: 50 },
          { label: 'DEF', val: 50 },
          { label: 'SAQ', val: 50 },
          { label: 'REC', val: 50 },
          { label: 'BLQ', val: 50 },
          { label: 'FIN', val: 50 },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'center', padding: '1px 0' }}>
            <span style={{ fontSize: `${0.85 * scale}rem`, fontWeight: 800, color }}>{s.val}</span>
            <span style={{ fontSize: `${0.55 * scale}rem`, fontWeight: 600, color: `${color}99`, textTransform: 'uppercase', letterSpacing: 0.3 }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
