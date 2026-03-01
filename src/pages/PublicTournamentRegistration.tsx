import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrophy, faCalendar, faMapMarkerAlt, faUsers, faSpinner, faCheck, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import '../styles/Torneios.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://gerenciai-backend-798546007335.us-east1.run.app';

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
