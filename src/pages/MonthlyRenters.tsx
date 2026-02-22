import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { monthlyRenterService } from '../services/monthlyRenterService';
import type { MonthlyRenter, CreateMonthlyRenterData } from '../services/monthlyRenterService';
import { courtService } from '../services/courtService';
import type { Court } from '../types/courtTypes';
import '../styles/MonthlyRenters.css';

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function MonthlyRenters() {
  const [renters, setRenters] = useState<MonthlyRenter[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRenter, setEditingRenter] = useState<MonthlyRenter | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);

  const now = new Date();
  const [generateMonth, setGenerateMonth] = useState(now.getMonth() + 1);
  const [generateYear, setGenerateYear] = useState(now.getFullYear());

  const [formData, setFormData] = useState<CreateMonthlyRenterData>({
    court_id: 0,
    renter_name: '',
    renter_phone: '',
    renter_email: '',
    renter_cpf: '',
    day_of_week: 1,
    start_time: '18:00',
    end_time: '19:00',
    monthly_price_cents: 0,
    start_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rentersRes, courtsRes] = await Promise.all([
        monthlyRenterService.getAll(),
        courtService.getCourts(),
      ]);
      setRenters(rentersRes.data || []);
      const courtList = courtsRes.data || [];
      setCourts(courtList);
      if (courtList.length > 0 && !formData.court_id) {
        setFormData(prev => ({ ...prev, court_id: courtList[0].id }));
      }
    } catch {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (renter?: MonthlyRenter) => {
    if (renter) {
      setEditingRenter(renter);
      setFormData({
        court_id: renter.court_id,
        renter_name: renter.renter_name,
        renter_phone: renter.renter_phone,
        renter_email: renter.renter_email || '',
        renter_cpf: renter.renter_cpf || '',
        day_of_week: renter.day_of_week,
        start_time: renter.start_time.substring(0, 5),
        end_time: renter.end_time.substring(0, 5),
        monthly_price_cents: renter.monthly_price_cents,
        start_date: renter.start_date?.split('T')[0] || '',
        end_date: renter.end_date?.split('T')[0] || '',
        notes: renter.notes || '',
      });
    } else {
      setEditingRenter(null);
      setFormData({
        court_id: courts.length > 0 ? courts[0].id : 0,
        renter_name: '',
        renter_phone: '',
        renter_email: '',
        renter_cpf: '',
        day_of_week: 1,
        start_time: '18:00',
        end_time: '19:00',
        monthly_price_cents: 0,
        start_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRenter) {
        await monthlyRenterService.update(editingRenter.id, formData);
        toast.success('Mensalista atualizado!');
      } else {
        await monthlyRenterService.create(formData);
        toast.success('Mensalista criado!');
      }
      setShowModal(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar');
    }
  };

  const handleDeactivate = async (id: number) => {
    if (!confirm('Deseja desativar este mensalista?')) return;
    try {
      await monthlyRenterService.deactivate(id);
      toast.success('Mensalista desativado!');
      fetchData();
    } catch {
      toast.error('Erro ao desativar');
    }
  };

  const handleGenerateRentals = async () => {
    setGenerating(true);
    try {
      const response = await monthlyRenterService.generateRentals(generateMonth, generateYear);
      const data = response.data;
      toast.success(`${data.created} locações criadas, ${data.skipped} já existiam`);
      setShowGenerateModal(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao gerar locações');
    } finally {
      setGenerating(false);
    }
  };

  const formatTime = (t: string) => t ? t.substring(0, 5) : '';

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ativo': return { background: '#D1FAE5', color: '#065F46' };
      case 'inativo': return { background: '#FEF3C7', color: '#92400E' };
      case 'cancelado': return { background: '#FEE2E2', color: '#991B1B' };
      default: return {};
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>Carregando...</div>;
  }

  return (
    <div className="monthly-renters-page">
      <div className="mr-header">
        <h1>Mensalistas</h1>
        <div className="mr-header-actions">
          <button className="mr-btn mr-btn-secondary" onClick={() => setShowGenerateModal(true)}>
            Gerar Locações do Mês
          </button>
          <button className="mr-btn mr-btn-primary" onClick={() => handleOpenModal()}>
            + Novo Mensalista
          </button>
        </div>
      </div>

      {renters.length === 0 ? (
        <div className="mr-empty">
          <p>Nenhum mensalista cadastrado</p>
          <button className="mr-btn mr-btn-primary" onClick={() => handleOpenModal()}>
            Cadastrar primeiro mensalista
          </button>
        </div>
      ) : (
        <div className="mr-table-container">
          <table className="mr-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Telefone</th>
                <th>Quadra</th>
                <th>Dia</th>
                <th>Horário</th>
                <th>Valor/mês</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {renters.map((renter) => (
                <tr key={renter.id}>
                  <td style={{ fontWeight: 500 }}>{renter.renter_name}</td>
                  <td>{renter.renter_phone}</td>
                  <td>{renter.court_name}</td>
                  <td>{DAY_NAMES[renter.day_of_week]}</td>
                  <td>{formatTime(renter.start_time)} - {formatTime(renter.end_time)}</td>
                  <td style={{ fontWeight: 600, color: '#10B981' }}>
                    R$ {(renter.monthly_price_cents / 100).toFixed(2)}
                  </td>
                  <td>
                    <span
                      className="mr-status-badge"
                      style={getStatusStyle(renter.status)}
                    >
                      {renter.status === 'ativo' ? 'Ativo' : renter.status === 'inativo' ? 'Inativo' : 'Cancelado'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="mr-btn-sm mr-btn-edit" onClick={() => handleOpenModal(renter)}>
                        Editar
                      </button>
                      {renter.status === 'ativo' && (
                        <button className="mr-btn-sm mr-btn-danger" onClick={() => handleDeactivate(renter.id)}>
                          Desativar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile cards */}
      <div className="mr-cards-mobile">
        {renters.map((renter) => (
          <div key={renter.id} className="mr-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <strong>{renter.renter_name}</strong>
              <span className="mr-status-badge" style={getStatusStyle(renter.status)}>
                {renter.status === 'ativo' ? 'Ativo' : renter.status}
              </span>
            </div>
            <p style={{ color: '#6B7280', fontSize: '0.85rem', margin: '4px 0' }}>
              {renter.court_name} | {DAY_NAMES[renter.day_of_week]} {formatTime(renter.start_time)}-{formatTime(renter.end_time)}
            </p>
            <p style={{ color: '#10B981', fontWeight: 600, margin: '4px 0' }}>
              R$ {(renter.monthly_price_cents / 100).toFixed(2)}/mês
            </p>
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
              <button className="mr-btn-sm mr-btn-edit" onClick={() => handleOpenModal(renter)}>Editar</button>
              {renter.status === 'ativo' && (
                <button className="mr-btn-sm mr-btn-danger" onClick={() => handleDeactivate(renter.id)}>Desativar</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="mr-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="mr-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingRenter ? 'Editar Mensalista' : 'Novo Mensalista'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mr-form-grid">
                <div className="mr-form-group">
                  <label>Nome *</label>
                  <input
                    type="text" required value={formData.renter_name}
                    onChange={(e) => setFormData({ ...formData, renter_name: e.target.value })}
                    placeholder="Nome do mensalista"
                  />
                </div>
                <div className="mr-form-group">
                  <label>Telefone *</label>
                  <input
                    type="text" required value={formData.renter_phone}
                    onChange={(e) => setFormData({ ...formData, renter_phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div className="mr-form-grid">
                <div className="mr-form-group">
                  <label>CPF</label>
                  <input
                    type="text" value={formData.renter_cpf || ''}
                    onChange={(e) => setFormData({ ...formData, renter_cpf: e.target.value })}
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="mr-form-group">
                  <label>Email</label>
                  <input
                    type="email" value={formData.renter_email || ''}
                    onChange={(e) => setFormData({ ...formData, renter_email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>

              <div className="mr-form-grid">
                <div className="mr-form-group">
                  <label>Quadra *</label>
                  <select
                    required value={formData.court_id}
                    onChange={(e) => setFormData({ ...formData, court_id: parseInt(e.target.value) })}
                  >
                    {courts.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mr-form-group">
                  <label>Dia da Semana *</label>
                  <select
                    value={formData.day_of_week}
                    onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
                  >
                    {DAY_NAMES.map((name, i) => (
                      <option key={i} value={i}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mr-form-grid mr-form-grid-3">
                <div className="mr-form-group">
                  <label>Início *</label>
                  <input
                    type="time" required value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  />
                </div>
                <div className="mr-form-group">
                  <label>Fim *</label>
                  <input
                    type="time" required value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  />
                </div>
                <div className="mr-form-group">
                  <label>Valor Mensal (R$)</label>
                  <input
                    type="number" step="0.01" min="0"
                    value={formData.monthly_price_cents ? (formData.monthly_price_cents / 100).toFixed(2) : ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFormData({ ...formData, monthly_price_cents: v ? Math.round(parseFloat(v) * 100) : 0 });
                    }}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="mr-form-grid">
                <div className="mr-form-group">
                  <label>Data Início *</label>
                  <input
                    type="date" required value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div className="mr-form-group">
                  <label>Data Fim (opcional)</label>
                  <input
                    type="date" value={formData.end_date || ''}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value || undefined })}
                  />
                </div>
              </div>

              <div className="mr-form-group">
                <label>Observações</label>
                <textarea
                  value={formData.notes || ''} rows={2}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notas opcionais..."
                />
              </div>

              <div className="mr-modal-actions">
                <button type="button" className="mr-btn mr-btn-cancel" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="mr-btn mr-btn-primary">
                  {editingRenter ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Rentals Modal */}
      {showGenerateModal && (
        <div className="mr-modal-overlay" onClick={() => setShowGenerateModal(false)}>
          <div className="mr-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <h2>Gerar Locações do Mês</h2>
            <p style={{ color: '#6B7280', fontSize: '0.9rem', marginBottom: '20px' }}>
              Gera automaticamente as locações recorrentes de todos os mensalistas ativos para o mês selecionado.
            </p>
            <div className="mr-form-grid">
              <div className="mr-form-group">
                <label>Mês</label>
                <select value={generateMonth} onChange={(e) => setGenerateMonth(parseInt(e.target.value))}>
                  {['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'].map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="mr-form-group">
                <label>Ano</label>
                <input
                  type="number" value={generateYear}
                  onChange={(e) => setGenerateYear(parseInt(e.target.value))}
                />
              </div>
            </div>
            <div className="mr-modal-actions">
              <button type="button" className="mr-btn mr-btn-cancel" onClick={() => setShowGenerateModal(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="mr-btn mr-btn-primary"
                onClick={handleGenerateRentals}
                disabled={generating}
              >
                {generating ? 'Gerando...' : 'Gerar Locações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
