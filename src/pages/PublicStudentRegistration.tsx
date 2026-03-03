import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { publicStudentRegistrationService, PublicModality } from '../services/publicStudentRegistrationService';
import '../styles/PublicTrialBooking.css';

const WEEKDAY_OPTIONS = [
  { key: 'seg', label: 'Seg' },
  { key: 'ter', label: 'Ter' },
  { key: 'qua', label: 'Qua' },
  { key: 'qui', label: 'Qui' },
  { key: 'sex', label: 'Sex' },
  { key: 'sab', label: 'Sáb' },
  { key: 'dom', label: 'Dom' },
];

export default function PublicStudentRegistration() {
  // Public pages always use light theme
  useEffect(() => {
    const prev = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', 'light');
    return () => { if (prev) document.documentElement.setAttribute('data-theme', prev); };
  }, []);

  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Business info
  const [businessName, setBusinessName] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [sex, setSex] = useState('');
  const [preferredWeekdays, setPreferredWeekdays] = useState<string[]>([]);
  const [preferredModality, setPreferredModality] = useState('');
  const [preferredAvailability, setPreferredAvailability] = useState('');
  const [modalities, setModalities] = useState<PublicModality[]>([]);
  const [showWeekdays, setShowWeekdays] = useState(true);
  const [showAvailability, setShowAvailability] = useState(true);

  useEffect(() => {
    if (!token) return;
    loadInfo();
  }, [token]);

  const loadInfo = async () => {
    try {
      setLoading(true);
      const response = await publicStudentRegistrationService.getRegistrationInfo(token!);
      setBusinessName(response.data?.business_name || '');
      setBusinessDescription(response.data?.business_description || '');
      setLogoUrl(response.data?.logo_url || '');
      setShowWeekdays(response.data?.show_weekdays !== false);
      setShowAvailability(response.data?.show_availability !== false);

      // Load modalities
      try {
        const modRes = await publicStudentRegistrationService.getModalities(token!);
        setModalities(modRes.data || []);
      } catch { /* ignore - modalities are optional */ }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Link de cadastro invalido ou expirado.');
    } finally {
      setLoading(false);
    }
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  const validateCpf = (cpfStr: string): boolean => {
    const digits = cpfStr.replace(/\D/g, '');
    if (digits.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(digits)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
    let check = 11 - (sum % 11);
    if (check >= 10) check = 0;
    if (parseInt(digits[9]) !== check) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
    check = 11 - (sum % 11);
    if (check >= 10) check = 0;
    return parseInt(digits[10]) === check;
  };

  const validateEmail = (emailStr: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
  };

  const validatePhone = (phoneStr: string): boolean => {
    const digits = phoneStr.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 11;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setError('Nome e email sao obrigatorios.');
      return;
    }

    if (!validateEmail(email.trim())) {
      setError('Email invalido.');
      return;
    }

    if (phone && !validatePhone(phone)) {
      setError('Telefone invalido. Informe DDD + numero (10 ou 11 digitos).');
      return;
    }

    if (cpf && !validateCpf(cpf)) {
      setError('CPF invalido.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const data: any = {
        full_name: fullName.trim(),
        email: email.trim(),
      };
      if (phone) data.phone = phone.replace(/\D/g, '');
      if (cpf) data.cpf = cpf.replace(/\D/g, '');
      if (birthDate) data.birth_date = birthDate;
      if (sex) data.sex = sex;
      if (preferredWeekdays.length > 0) data.preferred_weekdays = preferredWeekdays.join(',');
      if (preferredModality) data.preferred_modality = preferredModality;
      if (preferredAvailability.trim()) data.preferred_availability = preferredAvailability.trim();

      await publicStudentRegistrationService.registerStudent(token!, data);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao enviar cadastro.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="ptb-page">
        <div className="ptb-container">
          <div className="ptb-loading">Carregando...</div>
        </div>
      </div>
    );
  }

  if (error && !businessName) {
    return (
      <div className="ptb-page">
        <div className="ptb-container">
          <div className="ptb-error-card">
            <h2>Link Invalido</h2>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="ptb-page">
        <div className="ptb-container">
          <div className="ptb-step ptb-success">
            <div className="ptb-success-icon">&#10003;</div>
            <h2>Cadastro Enviado!</h2>
            <p>
              Seu cadastro foi enviado com sucesso para <strong>{businessName}</strong>.
              <br />O gestor ira analisar e aprovar em breve.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ptb-page">
      <div className="ptb-container">
        {/* Header */}
        <div className="ptb-header">
          {logoUrl && (
            <img src={logoUrl} alt={businessName} className="ptb-logo" />
          )}
          <h1>{businessName}</h1>
          {businessDescription && <p className="ptb-subtitle">{businessDescription}</p>}
        </div>

        {/* Form */}
        <div className="ptb-step">
          <h2>Cadastro de Aluno</h2>

          {error && (
            <div className="ptb-error-inline">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="ptb-form-group">
              <label>Nome Completo *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Seu nome completo"
                required
              />
            </div>

            <div className="ptb-form-group">
              <label>Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="ptb-form-group">
                <label>Telefone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="ptb-form-group">
                <label>CPF</label>
                <input
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(formatCpf(e.target.value))}
                  placeholder="000.000.000-00"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="ptb-form-group">
                <label>Data de Nascimento</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>

              <div className="ptb-form-group">
                <label>Sexo</label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    backgroundColor: 'white',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">Selecione...</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Outro">Outro</option>
                  <option value="N/I">Prefiro nao informar</option>
                </select>
              </div>
            </div>

            {/* Modalidade Desejada */}
            {modalities.length > 0 && (
              <div className="ptb-form-group">
                <label>Modalidade Desejada</label>
                <select
                  value={preferredModality}
                  onChange={(e) => setPreferredModality(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    backgroundColor: 'white',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">Selecione...</option>
                  {modalities.map((m) => (
                    <option key={m.id} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Dia de Aula Desejado */}
            {showWeekdays && <div className="ptb-form-group">
              <label>Dia de Aula Desejado</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {WEEKDAY_OPTIONS.map((w) => (
                  <button
                    key={w.key}
                    type="button"
                    onClick={() => {
                      setPreferredWeekdays((prev) =>
                        prev.includes(w.key)
                          ? prev.filter((d) => d !== w.key)
                          : [...prev, w.key]
                      );
                    }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: preferredWeekdays.includes(w.key) ? '2px solid #2563eb' : '1px solid #D1D5DB',
                      backgroundColor: preferredWeekdays.includes(w.key) ? '#2563eb' : 'white',
                      color: preferredWeekdays.includes(w.key) ? 'white' : '#374151',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>}

            {/* Horario de Disponibilidade */}
            {showAvailability && <div className="ptb-form-group">
              <label>Horário de Disponibilidade</label>
              <input
                type="text"
                value={preferredAvailability}
                onChange={(e) => setPreferredAvailability(e.target.value)}
                placeholder="Ex: 18h às 20h, Manhã, etc."
              />
            </div>}

            <div className="ptb-btn-row" style={{ marginTop: '24px' }}>
              <button
                type="submit"
                className="ptb-btn ptb-btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Enviando...' : 'Enviar Cadastro'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
