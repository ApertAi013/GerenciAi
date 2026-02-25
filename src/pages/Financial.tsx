import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { faMoneyBillWave, faXmark, faCheck, faUndo, faPenToSquare, faCalendarAlt, faFileInvoice, faExternalLinkAlt, faCog } from '@fortawesome/free-solid-svg-icons';
import { financialService } from '../services/financialService';
import { studentService } from '../services/studentService';
import { getTemplates, applyVariables } from '../utils/whatsappTemplates';
import WhatsAppTemplatePicker from '../components/WhatsAppTemplatePicker';
import type { Invoice, RegisterPaymentRequest } from '../types/financialTypes';
import '../styles/Financial.css';

export default function Financial() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'aberta' | 'paga' | 'vencida' | 'due_soon'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentData, setPaymentData] = useState<RegisterPaymentRequest>({
    invoice_id: 0,
    paid_at: new Date().toISOString().split('T')[0],
    method: 'pix',
    amount_cents: 0,
    notes: '',
  });

  // Estado para edição de pagamento
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editPaymentData, setEditPaymentData] = useState({
    amount_cents: 0,
    paid_at: '',
    notes: '',
  });

  // Estado para modal de estorno
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundInvoice, setRefundInvoice] = useState<Invoice | null>(null);
  const [refundReason, setRefundReason] = useState('');

  // Estado para evitar duplo clique nos botões de submit
  const [submitting, setSubmitting] = useState(false);

  // Estado para edição rápida de vencimento
  const [showDueDateModal, setShowDueDateModal] = useState(false);
  const [editingDueDateInvoice, setEditingDueDateInvoice] = useState<Invoice | null>(null);
  const [newDueDate, setNewDueDate] = useState('');

  // New filter states
  const [instructorFilter, setInstructorFilter] = useState<string>('');
  const [modalityFilter, setModalityFilter] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [instructors, setInstructors] = useState<Array<{ id: number; name: string; email: string }>>([]);
  const [modalities, setModalities] = useState<Array<{ id: number; name: string }>>([]);
  const [levels, setLevels] = useState<Array<{ id: number; name: string; color: string }>>([]);

  // Estado para modal de edição de nível
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [levelEditInvoice, setLevelEditInvoice] = useState<Invoice | null>(null);
  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);

  // Filtro de mês - padrão é o mês atual
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));

  // Ordenação
  const [sortField, setSortField] = useState<'id' | 'student_name' | 'level_name' | 'reference_month' | 'due_date' | 'final_amount_cents' | 'status'>('student_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Personalização de colunas
  type ColumnKey = 'id' | 'student_name' | 'plan_name' | 'level' | 'reference_month' | 'due_date' | 'final_amount_cents' | 'paid' | 'status' | 'actions';
  const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
    { key: 'id', label: 'ID' },
    { key: 'student_name', label: 'Aluno' },
    { key: 'plan_name', label: 'Plano' },
    { key: 'level', label: 'Nível' },
    { key: 'reference_month', label: 'Referência' },
    { key: 'due_date', label: 'Vencimento' },
    { key: 'final_amount_cents', label: 'Valor' },
    { key: 'paid', label: 'Pago' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Ações' },
  ];
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(() => {
    const saved = localStorage.getItem('financial_visible_columns');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure new columns are included if not present
        const allKeys = ALL_COLUMNS.map(c => c.key);
        const validKeys = parsed.filter((k: string) => allKeys.includes(k as ColumnKey));
        // Add any new columns that weren't in the saved config
        allKeys.forEach(k => { if (!validKeys.includes(k)) validKeys.push(k); });
        return validKeys;
      } catch { return ALL_COLUMNS.map(c => c.key); }
    }
    return ALL_COLUMNS.map(c => c.key);
  });
  const [showColumnConfig, setShowColumnConfig] = useState(false);

  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns(prev => {
      const next = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
      localStorage.setItem('financial_visible_columns', JSON.stringify(next));
      return next;
    });
  };

  const isColumnVisible = (key: ColumnKey) => visibleColumns.includes(key);

  // Estado do template picker
  const [showTemplatePicker, setShowTemplatePicker] = useState<number | null>(null);

  // Função para enviar WhatsApp com uma mensagem específica
  const sendWhatsApp = (invoice: Invoice, message: string) => {
    const phone = invoice.student_phone!.replace(/\D/g, '');
    const firstName = (invoice.student_name || '').split(' ')[0];
    const applied = applyVariables(message, {
      firstName,
      fullName: invoice.student_name || '',
      amount: formatPrice(invoice.final_amount_cents),
      dueDate: formatDate(invoice.due_date),
      referenceMonth: invoice.reference_month,
    });
    const whatsappUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(applied)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Função para abrir WhatsApp com mensagem personalizada
  const handleWhatsAppClick = (invoice: Invoice) => {
    if (!invoice.student_phone) {
      toast.error('Aluno não possui telefone cadastrado');
      return;
    }

    const phone = invoice.student_phone.replace(/\D/g, '');
    if (phone.length < 10) {
      toast.error('Telefone do aluno é inválido');
      return;
    }

    const templates = getTemplates();
    if (templates.length === 1) {
      sendWhatsApp(invoice, templates[0].message);
    } else {
      setShowTemplatePicker(invoice.id);
    }
  };

  // Handle sort
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort invoices
  const sortInvoices = (invoicesToSort: Invoice[]) => {
    return [...invoicesToSort].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'id':
          aValue = a.id;
          bValue = b.id;
          break;
        case 'student_name':
          aValue = (a.student_name || '').toLowerCase();
          bValue = (b.student_name || '').toLowerCase();
          break;
        case 'reference_month':
          aValue = a.reference_month;
          bValue = b.reference_month;
          break;
        case 'due_date':
          aValue = a.due_date;
          bValue = b.due_date;
          break;
        case 'final_amount_cents':
          aValue = a.final_amount_cents;
          bValue = b.final_amount_cents;
          break;
        case 'level_name':
          aValue = (a.level_name || '').toLowerCase();
          bValue = (b.level_name || '').toLowerCase();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Render sort indicator
  const renderSortIndicator = (field: typeof sortField) => {
    if (sortField !== field) return <span style={{ opacity: 0.3, marginLeft: '4px' }}>⇅</span>;
    return <span style={{ marginLeft: '4px' }}>{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  // Exportar para Excel (CSV)
  const exportToExcel = () => {
    // Cabeçalho
    const headers = ['ID', 'Aluno', 'Plano', 'Nível', 'Referência', 'Vencimento', 'Valor Bruto', 'Desconto', 'Valor Final', 'Valor Pago', 'Status'];

    // Dados
    const rows = invoices.map(inv => [
      inv.id,
      `"${inv.student_name || ''}"`,
      `"${inv.plan_name || ''}"`,
      `"${inv.level_name || ''}"`,
      inv.reference_month,
      inv.due_date ? formatDate(inv.due_date) : '',
      (inv.amount_cents / 100).toFixed(2).replace('.', ','),
      (inv.discount_cents / 100).toFixed(2).replace('.', ','),
      (inv.final_amount_cents / 100).toFixed(2).replace('.', ','),
      ((inv.paid_amount_cents || 0) / 100).toFixed(2).replace('.', ','),
      inv.status
    ]);

    // Linha em branco e totais
    const notCancelled = invoices.filter(i => i.status !== 'cancelada');
    const totalBruto = notCancelled.reduce((sum, i) => sum + i.amount_cents, 0) / 100;
    const totalDesconto = notCancelled.reduce((sum, i) => sum + i.discount_cents, 0) / 100;
    const totalFinal = notCancelled.reduce((sum, i) => sum + i.final_amount_cents, 0) / 100;
    const totalPago = invoices.filter(i => i.status === 'paga').reduce((sum, i) => sum + (i.paid_amount_cents || 0), 0) / 100;
    const totalAberta = invoices.filter(i => i.status === 'aberta').reduce((sum, i) => sum + i.final_amount_cents, 0) / 100;
    const totalVencida = invoices.filter(i => i.status === 'vencida').reduce((sum, i) => sum + i.final_amount_cents, 0) / 100;

    rows.push([]);
    rows.push(['', '', '', '', 'TOTAIS:', totalBruto.toFixed(2).replace('.', ','), totalDesconto.toFixed(2).replace('.', ','), totalFinal.toFixed(2).replace('.', ','), totalPago.toFixed(2).replace('.', ','), '']);
    rows.push([]);
    rows.push(['RESUMO']);
    rows.push(['Total Bruto (sem desconto)', `R$ ${totalBruto.toFixed(2).replace('.', ',')}`]);
    rows.push(['Total Descontos', `R$ ${totalDesconto.toFixed(2).replace('.', ',')}`]);
    rows.push(['Total Final (com desconto)', `R$ ${totalFinal.toFixed(2).replace('.', ',')}`]);
    rows.push(['Total Recebido', `R$ ${totalPago.toFixed(2).replace('.', ',')}`]);
    rows.push(['Total A Vencer', `R$ ${totalAberta.toFixed(2).replace('.', ',')}`]);
    rows.push(['Total Inadimplente', `R$ ${totalVencida.toFixed(2).replace('.', ',')}`]);
    rows.push(['Quantidade de Faturas', invoices.length]);

    // Criar CSV com BOM para Excel reconhecer UTF-8
    const BOM = '\uFEFF';
    const csvContent = BOM + headers.join(';') + '\n' + rows.map(row => row.join(';')).join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `financeiro_${selectedMonth}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Planilha exportada com sucesso!');
  };

  useEffect(() => {
    // Load filters on mount
    const loadFilters = async () => {
      try {
        const response = await financialService.getFilters();
        const data = response.data || response;
        setInstructors(data.instructors || []);
        setModalities(data.modalities || []);
        setLevels(data.levels || []);
      } catch (error) {
        console.error('Erro ao carregar filtros:', error);
      }
    };
    loadFilters();

    // Read modality filter from URL params (from Dashboard redirect)
    const modalityParam = searchParams.get('modality');
    if (modalityParam) {
      setModalityFilter(modalityParam);
    }
  }, [searchParams]);

  useEffect(() => {
    // Log current user info for debugging
    const userDataStr = localStorage.getItem('userData');
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        console.log('Current logged in user:', userData);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    // Check if there's a student_id in URL params
    const studentIdParam = searchParams.get('student_id');
    if (studentIdParam) {
      // Find the student name from the loaded invoices to set searchTerm
      loadInvoices().then((loaded) => {
        const studentInvoice = loaded.find((inv: Invoice) => inv.student_id === Number(studentIdParam));
        if (studentInvoice?.student_name) {
          setSearchTerm(studentInvoice.student_name);
        }
      });
    } else {
      loadInvoices();
    }
  }, [filter, instructorFilter, modalityFilter, levelFilter, selectedMonth]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      // Build params object
      const params: {
        status?: string;
        instructor_id?: number;
        modality_id?: number;
        level_id?: number;
        reference_month?: string;
      } = {};

      // Don't pass status parameter for "all" or "due_soon" filters
      // "due_soon" will be filtered client-side
      if (filter !== 'all' && filter !== 'due_soon') {
        params.status = filter;
      }

      // Add instructor filter
      if (instructorFilter) {
        params.instructor_id = Number(instructorFilter);
      }

      // Add modality filter
      if (modalityFilter) {
        params.modality_id = Number(modalityFilter);
      }

      // Add level filter
      if (levelFilter) {
        params.level_id = Number(levelFilter);
      }

      // Add month filter
      if (selectedMonth) {
        params.reference_month = selectedMonth;
      }

      console.log('Loading invoices with params:', params);
      const response = await financialService.getInvoices(Object.keys(params).length > 0 ? params : undefined);

      console.log('Load invoices response:', response);
      console.log('Filter:', filter);

      // Backend returns either { status: 'success', data: { invoices: [] } }
      // or { success: true, data: [] } depending on the endpoint
      const invoiceList = response.data?.invoices || response.data || [];

      console.log('Invoices loaded:', invoiceList.length);
      if (invoiceList.length > 0) {
        console.log('Invoice details:', invoiceList.map((inv: Invoice) => ({
          id: inv.id,
          status: inv.status,
          student_id: inv.student_id,
          amount: inv.final_amount_cents
        })));
      }

      setInvoices(invoiceList);
      return invoiceList;
    } catch (error) {
      console.error('Erro ao carregar faturas:', error);
      alert('Erro ao carregar faturas');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoices = async () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const confirmMsg = `Gerar faturas para o mês ${currentMonth}?\n\nIsso criará faturas para todas as matrículas ativas.`;

    if (!confirm(confirmMsg)) return;

    try {
      const response = await financialService.generateInvoices({
        reference_month: currentMonth,
      });

      console.log('Generate invoices response:', response);

      // A resposta pode vir como { status: 'success' } ou { message: 'success' }
      if ((response as any).status === 'success' || (response as any).success === true || response.message) {
        alert(response.message || 'Faturas geradas com sucesso!');
        // Aguardar um momento antes de recarregar para garantir que o backend processou
        setTimeout(() => {
          loadInvoices();
        }, 500);
      }
    } catch (error: any) {
      console.error('Erro ao gerar faturas:', error);
      alert(error.response?.data?.message || 'Erro ao gerar faturas');
    }
  };

  const openPaymentModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentData({
      invoice_id: invoice.id,
      paid_at: new Date().toISOString().split('T')[0],
      method: 'pix',
      amount_cents: invoice.final_amount_cents,
      notes: '',
    });
    setShowPaymentModal(true);
  };

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting) return; // Evita duplo clique
    setSubmitting(true);

    try {
      const response = await financialService.registerPayment(paymentData);

      if ((response as any).status === 'success' || (response as any).success === true) {
        toast.success('Pagamento registrado com sucesso!');
        setShowPaymentModal(false);
        setSelectedInvoice(null);
        loadInvoices();
      }
    } catch (error: any) {
      console.error('Erro ao registrar pagamento:', error);
      toast.error(error.response?.data?.message || 'Erro ao registrar pagamento');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelInvoice = async (invoiceId: number) => {
    if (!confirm('Tem certeza que deseja cancelar esta fatura?')) return;

    try {
      const response = await financialService.cancelInvoice(invoiceId);

      if ((response as any).status === 'success' || (response as any).success === true) {
        alert('Fatura cancelada com sucesso!');
        loadInvoices();
      }
    } catch (error: any) {
      console.error('Erro ao cancelar fatura:', error);
      alert(error.response?.data?.message || 'Erro ao cancelar fatura');
    }
  };

  const openLevelModal = (invoice: Invoice) => {
    setLevelEditInvoice(invoice);
    setSelectedLevelId(invoice.level_id || null);
    setShowLevelModal(true);
  };

  const handleUpdateLevel = async () => {
    if (!levelEditInvoice || !selectedLevelId) return;
    if (submitting) return;

    try {
      setSubmitting(true);
      const selectedLevel = levels.find(l => l.id === selectedLevelId);
      const response = await studentService.updateStudent(levelEditInvoice.student_id!, {
        level_id: selectedLevelId,
        level: selectedLevel?.name
      } as any);

      if ((response as any).status === 'success' || (response as any).success === true) {
        toast.success('Nível atualizado com sucesso!');
        setShowLevelModal(false);
        setLevelEditInvoice(null);
        loadInvoices();
      }
    } catch (error: any) {
      console.error('Erro ao atualizar nível:', error);
      toast.error(error.response?.data?.message || 'Erro ao atualizar nível');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditPaymentModal = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    // Formata a data para o input date (YYYY-MM-DD)
    const paidAtDate = invoice.paid_at
      ? new Date(invoice.paid_at).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    setEditPaymentData({
      amount_cents: invoice.paid_amount_cents || invoice.final_amount_cents,
      paid_at: paidAtDate,
      notes: '',
    });
    setShowEditPaymentModal(true);
  };

  const handleEditPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting) return; // Evita duplo clique

    if (!editingInvoice || !editingInvoice.payment_id) {
      toast.error('Não foi possível identificar o pagamento');
      return;
    }

    const changes = [];
    if (editPaymentData.amount_cents !== (editingInvoice.paid_amount_cents || 0)) {
      changes.push(`Valor: ${formatPrice(editingInvoice.paid_amount_cents || 0)} → ${formatPrice(editPaymentData.amount_cents)}`);
    }
    const originalDate = editingInvoice.paid_at ? new Date(editingInvoice.paid_at).toISOString().split('T')[0] : '';
    if (editPaymentData.paid_at !== originalDate) {
      changes.push(`Data: ${formatDate(originalDate)} → ${formatDate(editPaymentData.paid_at)}`);
    }

    if (changes.length === 0) {
      toast.error('Nenhuma alteração foi feita');
      return;
    }

    const confirmMessage = `Confirma as seguintes alterações?\n\n${changes.join('\n')}\n\nIsso irá alterar o registro do pagamento.`;

    if (!confirm(confirmMessage)) return;

    setSubmitting(true);

    try {
      const response = await financialService.updatePayment(editingInvoice.payment_id, {
        amount_cents: editPaymentData.amount_cents,
        paid_at: editPaymentData.paid_at,
        notes: editPaymentData.notes || undefined,
      });

      if ((response as any).status === 'success' || (response as any).success === true) {
        const diff = response.data?.difference_cents || 0;
        const diffText = diff > 0 ? `+${formatPrice(diff)}` : diff < 0 ? formatPrice(diff) : 'sem alteração';
        toast.success(`Pagamento atualizado! Diferença no balanço: ${diffText}`);
        setShowEditPaymentModal(false);
        setEditingInvoice(null);
        loadInvoices();
      }
    } catch (error: any) {
      console.error('Erro ao editar pagamento:', error);
      toast.error(error.response?.data?.message || 'Erro ao editar pagamento');
    } finally {
      setSubmitting(false);
    }
  };

  // Função para abrir modal de estorno
  const openRefundModal = (invoice: Invoice) => {
    setRefundInvoice(invoice);
    setRefundReason('');
    setShowRefundModal(true);
    setShowEditPaymentModal(false);
  };

  // Função para processar estorno
  const handleRefund = async () => {
    if (submitting || !refundInvoice) return;

    const confirmMessage = `Confirma o estorno do pagamento?\n\nAluno: ${refundInvoice.student_name}\nValor pago: ${formatPrice(refundInvoice.paid_amount_cents || 0)}\n\nO pagamento será removido e a fatura marcada como estornada.`;

    if (!confirm(confirmMessage)) return;

    setSubmitting(true);

    try {
      const response = await financialService.refundPayment(refundInvoice.id, refundReason);

      if ((response as any).status === 'success') {
        toast.success(`Estorno realizado com sucesso! Valor: ${formatPrice(response.data.refunded_amount_cents)}`);
        setShowRefundModal(false);
        setRefundInvoice(null);
        setRefundReason('');
        loadInvoices();
      }
    } catch (error: any) {
      console.error('Erro ao estornar pagamento:', error);
      toast.error(error.response?.data?.message || 'Erro ao estornar pagamento');
    } finally {
      setSubmitting(false);
    }
  };

  // Função para cancelar recebimento (volta fatura para aberta)
  const handleCancelPayment = async () => {
    if (submitting || !editingInvoice) return;

    const confirmMessage = `Confirma o cancelamento do recebimento?\n\nAluno: ${editingInvoice.student_name}\nValor pago: ${formatPrice(editingInvoice.paid_amount_cents || 0)}\n\nA fatura voltará ao status "aberta" ou "vencida".`;

    if (!confirm(confirmMessage)) return;

    setSubmitting(true);

    try {
      const response = await financialService.cancelPayment(editingInvoice.id);

      if ((response as any).status === 'success') {
        toast.success(`Recebimento cancelado! Fatura voltou para "${response.data.new_status}".`);
        setShowEditPaymentModal(false);
        setEditingInvoice(null);
        loadInvoices();
      }
    } catch (error: any) {
      console.error('Erro ao cancelar recebimento:', error);
      toast.error(error.response?.data?.message || 'Erro ao cancelar recebimento');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    // Adiciona T00:00:00 para interpretar como meia-noite local, não UTC
    // Isso evita o bug de mostrar 1 dia antes devido ao fuso horário
    const dateOnly = dateString.split('T')[0]; // Remove qualquer horário existente
    return new Date(dateOnly + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; class: string }> = {
      aberta: { label: 'Aberta', class: 'status-open' },
      paga: { label: 'Paga', class: 'status-paid' },
      vencida: { label: 'Vencida', class: 'status-overdue' },
      cancelada: { label: 'Cancelada', class: 'status-cancelled' },
      estornada: { label: 'Estornada', class: 'status-refunded' },
    };
    const info = statusMap[status] || { label: status, class: '' };
    return <span className={`status-badge ${info.class}`}>{info.label}</span>;
  };

  // Total SEM desconto: soma o valor bruto (amount_cents) das faturas não canceladas/estornadas
  const totalAmountGross = invoices
    .filter(inv => inv.status !== 'cancelada' && inv.status !== 'estornada')
    .reduce((sum, inv) => sum + Number(inv.amount_cents || 0), 0);

  // Total COM desconto (esperado): soma o valor final (final_amount_cents) das faturas não canceladas/estornadas
  const totalAmountNet = invoices
    .filter(inv => inv.status !== 'cancelada' && inv.status !== 'estornada')
    .reduce((sum, inv) => sum + Number(inv.final_amount_cents || 0), 0);

  // Total REAL: para pagas usa paid_amount_cents, para abertas/vencidas usa final_amount_cents
  const totalAmountReal = invoices
    .filter(inv => inv.status !== 'cancelada' && inv.status !== 'estornada')
    .reduce((sum, inv) => {
      if (inv.status === 'paga') {
        return sum + Number(inv.paid_amount_cents || 0);
      }
      return sum + Number(inv.final_amount_cents || 0);
    }, 0);

  // Recebido: soma o valor REAL pago nas faturas pagas
  const paidAmount = invoices
    .filter(inv => inv.status === 'paga')
    .reduce((sum, inv) => sum + Number(inv.paid_amount_cents || 0), 0);

  // Previsto (valor das faturas pagas, sem considerar diferenças de pagamento)
  const expectedPaidAmount = invoices
    .filter(inv => inv.status === 'paga')
    .reduce((sum, inv) => sum + Number(inv.final_amount_cents || 0), 0);

  // A Vencer: soma faturas abertas (ainda não venceram e não foram pagas)
  const pendingAmount = invoices
    .filter(inv => inv.status === 'aberta')
    .reduce((sum, inv) => sum + Number(inv.final_amount_cents || 0), 0);

  // Inadimplente: soma apenas faturas vencidas
  const overdueAmount = invoices
    .filter(inv => inv.status === 'vencida')
    .reduce((sum, inv) => sum + Number(inv.final_amount_cents || 0), 0);

  if (loading) {
    return <div className="loading">Carregando informações financeiras...</div>;
  }

  // Função para formatar o nome do mês
  const formatMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  // Gerar lista de meses (últimos 12 meses + próximos 2)
  const getMonthOptions = () => {
    const months = [];
    const today = new Date();

    // 12 meses anteriores
    for (let i = 12; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const value = date.toISOString().slice(0, 7);
      months.push({
        value,
        label: date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      });
    }

    // 2 meses futuros
    for (let i = 1; i <= 2; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const value = date.toISOString().slice(0, 7);
      months.push({
        value,
        label: date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      });
    }

    return months;
  };

  return (
    <div className="financial-container">
      <div className="page-header">
        <h1>Financeiro</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Seletor de Mês */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                const months = getMonthOptions();
                const currentIndex = months.findIndex(m => m.value === selectedMonth);
                if (currentIndex > 0) {
                  setSelectedMonth(months[currentIndex - 1].value);
                }
              }}
              style={{
                background: 'none',
                border: '1px solid #ddd',
                borderRadius: '4px',
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
              title="Mês anterior"
            >
              ◀
            </button>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '16px',
                fontWeight: '500',
                minWidth: '200px',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {getMonthOptions().map(month => (
                <option key={month.value} value={month.value} style={{ textTransform: 'capitalize' }}>
                  {month.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                const months = getMonthOptions();
                const currentIndex = months.findIndex(m => m.value === selectedMonth);
                if (currentIndex < months.length - 1) {
                  setSelectedMonth(months[currentIndex + 1].value);
                }
              }}
              style={{
                background: 'none',
                border: '1px solid #ddd',
                borderRadius: '4px',
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
              title="Próximo mês"
            >
              ▶
            </button>
          </div>
          <button type="button" className="btn-primary" onClick={handleGenerateInvoices}>
            Gerar Faturas do Mês
          </button>
          <button
            type="button"
            onClick={exportToExcel}
            style={{
              background: '#217346',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              cursor: 'pointer',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            title="Exportar para Excel"
          >
            📊 Exportar Excel
          </button>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowColumnConfig(!showColumnConfig)}
              className="column-config-btn"
              title="Personalizar colunas"
            >
              <FontAwesomeIcon icon={faCog} /> Colunas
            </button>
            {showColumnConfig && (
              <div className="column-config-dropdown">
                <div className="column-config-header">Colunas visíveis</div>
                {ALL_COLUMNS.map(col => (
                  <label key={col.key} className="column-config-item">
                    <input
                      type="checkbox"
                      checked={isColumnVisible(col.key)}
                      onChange={() => toggleColumn(col.key)}
                    />
                    {col.label}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="financial-stats">
        <div className="stat-card stat-total">
          <h3>Total</h3>
          <p className="stat-value">{formatPrice(totalAmountReal)}</p>
          <small>{invoices.filter(i => i.status !== 'cancelada').length} faturas</small>
          {totalAmountReal !== totalAmountNet && (
            <small style={{ display: 'block', marginTop: '4px', color: '#7f8c8d' }}>
              Esperado: {formatPrice(totalAmountNet)}
            </small>
          )}
        </div>
        <div className="stat-card stat-paid">
          <h3>Recebido</h3>
          <p className="stat-value">{formatPrice(paidAmount)}</p>
          <small>{invoices.filter(i => i.status === 'paga').length} pagas</small>
          {paidAmount !== expectedPaidAmount && (
            <small style={{ display: 'block', marginTop: '4px', color: '#7f8c8d' }}>
              Previsto: {formatPrice(expectedPaidAmount)}
            </small>
          )}
        </div>
        <div className="stat-card stat-pending">
          <h3>A Vencer</h3>
          <p className="stat-value">{formatPrice(pendingAmount)}</p>
          <small>{invoices.filter(i => i.status === 'aberta').length} abertas</small>
        </div>
        <div className="stat-card stat-overdue">
          <h3>Inadimplente</h3>
          <p className="stat-value">{formatPrice(overdueAmount)}</p>
          <small>{invoices.filter(i => i.status === 'vencida').length} vencidas</small>
        </div>
      </div>

      <div className="filter-bar">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Todas
        </button>
        <button
          className={`filter-btn ${filter === 'aberta' ? 'active' : ''}`}
          onClick={() => setFilter('aberta')}
        >
          Abertas
        </button>
        <button
          className={`filter-btn ${filter === 'due_soon' ? 'active' : ''}`}
          onClick={() => setFilter('due_soon')}
        >
          Próximas a Vencer
        </button>
        <button
          className={`filter-btn ${filter === 'vencida' ? 'active' : ''}`}
          onClick={() => setFilter('vencida')}
        >
          Vencidas
        </button>
        <button
          className={`filter-btn ${filter === 'paga' ? 'active' : ''}`}
          onClick={() => setFilter('paga')}
        >
          Pagas
        </button>
      </div>

      {/* Search and Filters */}
      <div className="search-section">
        <input
          type="text"
          placeholder="Buscar aluno por nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="financial-search-input"
        />
        {searchTerm && (
          <button
            type="button"
            className="clear-search-btn"
            onClick={() => setSearchTerm('')}
            title="Limpar busca"
          >
            ✕
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      <div className="advanced-filters">
        <div className="filter-group">
          <label htmlFor="instructor-filter">Instrutor:</label>
          <select
            id="instructor-filter"
            value={instructorFilter}
            onChange={(e) => setInstructorFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">Todos</option>
            {instructors.map((instructor) => (
              <option key={instructor.id} value={instructor.id}>
                {instructor.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="modality-filter">Modalidade:</label>
          <select
            id="modality-filter"
            value={modalityFilter}
            onChange={(e) => setModalityFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">Todas</option>
            {modalities.map((modality) => (
              <option key={modality.id} value={modality.id}>
                {modality.name}
              </option>
            ))}
          </select>
        </div>

        {levels.length > 0 && (
          <div className="filter-group">
            <label htmlFor="level-filter">Nível:</label>
            <select
              id="level-filter"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">Todos</option>
              {levels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {(instructorFilter || modalityFilter || levelFilter) && (
          <button
            type="button"
            className="btn-clear-filters"
            onClick={() => {
              setInstructorFilter('');
              setModalityFilter('');
              setLevelFilter('');
            }}
          >
            Limpar filtros
          </button>
        )}
      </div>

      <div className="invoices-table-container">
        <table className="invoices-table">
          <thead>
            <tr>
              {isColumnVisible('id') && (
                <th onClick={() => handleSort('id')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  ID {renderSortIndicator('id')}
                </th>
              )}
              {isColumnVisible('student_name') && (
                <th onClick={() => handleSort('student_name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Aluno {renderSortIndicator('student_name')}
                </th>
              )}
              {isColumnVisible('plan_name') && <th>Plano</th>}
              {isColumnVisible('level') && (
                <th onClick={() => handleSort('level_name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Nível {renderSortIndicator('level_name')}
                </th>
              )}
              {isColumnVisible('reference_month') && (
                <th onClick={() => handleSort('reference_month')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Referência {renderSortIndicator('reference_month')}
                </th>
              )}
              {isColumnVisible('due_date') && (
                <th onClick={() => handleSort('due_date')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Vencimento {renderSortIndicator('due_date')}
                </th>
              )}
              {isColumnVisible('final_amount_cents') && (
                <th onClick={() => handleSort('final_amount_cents')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Valor {renderSortIndicator('final_amount_cents')}
                </th>
              )}
              {isColumnVisible('paid') && <th>Pago</th>}
              {isColumnVisible('status') && (
                <th onClick={() => handleSort('status')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Status {renderSortIndicator('status')}
                </th>
              )}
              {isColumnVisible('actions') && <th>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {(() => {
              // Filter invoices by search term and "due soon"
              let filteredInvoices = invoices;

              // Apply "due soon" filter (next 7 days)
              if (filter === 'due_soon') {
                const today = new Date();
                const sevenDaysFromNow = new Date();
                sevenDaysFromNow.setDate(today.getDate() + 7);

                filteredInvoices = filteredInvoices.filter(invoice => {
                  if (invoice.status !== 'aberta') return false;
                  const dueDate = new Date(invoice.due_date);
                  return dueDate >= today && dueDate <= sevenDaysFromNow;
                });
              }

              // Apply search filter
              if (searchTerm.trim()) {
                filteredInvoices = filteredInvoices.filter(invoice =>
                  (invoice.student_name || '')
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())
                );
              }

              // Apply sorting
              const sortedInvoices = sortInvoices(filteredInvoices);

              return sortedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length} className="empty-state">
                    {searchTerm
                      ? `Nenhuma fatura encontrada para "${searchTerm}"`
                      : filter === 'all'
                      ? 'Nenhuma fatura encontrada. Clique em "Gerar Faturas do Mês" para começar.'
                      : filter === 'due_soon'
                      ? 'Nenhuma fatura próxima a vencer (próximos 7 dias).'
                      : `Nenhuma fatura ${filter} encontrada.`
                    }
                  </td>
                </tr>
              ) : (
                sortedInvoices.map(invoice => (
                  <tr key={invoice.id}>
                    {isColumnVisible('id') && (
                    <td>
                      <span
                        onClick={() => {
                          navigator.clipboard.writeText(`#${invoice.id}`);
                          toast.success(`ID #${invoice.id} copiado!`, { duration: 1500 });
                        }}
                        style={{
                          cursor: 'pointer',
                          color: '#6c757d',
                          fontFamily: 'monospace',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(108, 117, 125, 0.1)',
                        }}
                        title="Clique para copiar o ID"
                      >
                        #{invoice.id}
                      </span>
                    </td>
                    )}
                    {isColumnVisible('student_name') && (
                    <td>
                      <span
                        onClick={() => window.open(`/alunos/${invoice.student_id}`, '_blank')}
                        style={{
                          cursor: 'pointer',
                          color: '#007bff',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                        title="Clique para ver detalhes do aluno (abre em nova aba)"
                      >
                        {invoice.student_name || `ID ${invoice.student_id}`}
                        <FontAwesomeIcon icon={faExternalLinkAlt} style={{ fontSize: '10px', opacity: 0.5 }} />
                      </span>
                    </td>
                    )}
                    {isColumnVisible('plan_name') && (
                    <td>
                      {invoice.plan_name ? (
                        <span
                          onClick={() => window.open(`/matriculas?edit=${invoice.enrollment_id}`, '_blank')}
                          style={{
                            cursor: 'pointer',
                            color: '#007bff',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title="Clique para editar matrícula (abre em nova aba)"
                        >
                          {invoice.plan_name}
                          <FontAwesomeIcon icon={faPenToSquare} style={{ fontSize: '10px', opacity: 0.5 }} />
                        </span>
                      ) : '-'}
                    </td>
                    )}
                    {isColumnVisible('level') && (
                    <td>
                      {invoice.level_name ? (
                        <span
                          onClick={() => openLevelModal(invoice)}
                          className="level-badge"
                          style={{
                            background: invoice.level_color || '#6b7280',
                          }}
                          title="Clique para alterar o nível do aluno"
                        >
                          {invoice.level_name}
                          <FontAwesomeIcon icon={faPenToSquare} style={{ fontSize: '9px', opacity: 0.7, marginLeft: '4px' }} />
                        </span>
                      ) : (
                        <span
                          onClick={() => openLevelModal(invoice)}
                          style={{ color: '#999', cursor: 'pointer' }}
                          title="Clique para definir o nível do aluno"
                        >
                          -
                        </span>
                      )}
                    </td>
                    )}
                    {isColumnVisible('reference_month') && (
                    <td>
                      <span
                        onClick={() => {
                          const [year, month] = invoice.reference_month.split('-');
                          if (year && month) {
                            setSelectedMonth(`${year}-${month.padStart(2, '0')}`);
                          }
                        }}
                        style={{
                          cursor: 'pointer',
                          color: '#007bff',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                        title="Clique para filtrar por este mês"
                      >
                        {invoice.reference_month}
                      </span>
                    </td>
                    )}
                    {isColumnVisible('due_date') && (
                    <td>
                      <span
                        onClick={() => {
                          if (invoice.status === 'aberta' || invoice.status === 'vencida') {
                            setEditingDueDateInvoice(invoice);
                            setNewDueDate(invoice.due_date);
                            setShowDueDateModal(true);
                          }
                        }}
                        style={{
                          cursor: (invoice.status === 'aberta' || invoice.status === 'vencida') ? 'pointer' : 'default',
                          color: (invoice.status === 'aberta' || invoice.status === 'vencida') ? '#007bff' : 'inherit',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                        title={(invoice.status === 'aberta' || invoice.status === 'vencida') ? 'Clique para alterar o vencimento' : undefined}
                      >
                        {formatDate(invoice.due_date)}
                        {(invoice.status === 'aberta' || invoice.status === 'vencida') && (
                          <FontAwesomeIcon icon={faCalendarAlt} style={{ fontSize: '10px', opacity: 0.6 }} />
                        )}
                      </span>
                    </td>
                    )}
                    {isColumnVisible('final_amount_cents') && (
                    <td className="amount-cell">
                      <span
                        onClick={() => {
                          const valor = (invoice.final_amount_cents / 100).toFixed(2).replace('.', ',');
                          navigator.clipboard.writeText(`R$ ${valor}`);
                          toast.success(`Valor R$ ${valor} copiado!`, { duration: 1500 });
                        }}
                        style={{
                          cursor: 'pointer',
                          display: 'inline-block',
                        }}
                        title="Clique para copiar o valor"
                      >
                        {invoice.discount_cents && invoice.discount_cents > 0 ? (
                          <>
                            <span className="original-amount">{formatPrice(invoice.amount_cents)}</span>
                            <span className="final-amount">{formatPrice(invoice.final_amount_cents)}</span>
                          </>
                        ) : (
                          formatPrice(invoice.final_amount_cents)
                        )}
                      </span>
                    </td>
                    )}
                    {isColumnVisible('paid') && (
                    <td className="amount-cell">
                      {invoice.status === 'paga' && invoice.paid_amount_cents ? (
                        <span
                          onClick={() => openEditPaymentModal(invoice)}
                          style={{
                            cursor: 'pointer',
                            color: '#007bff',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Clique para editar o valor pago"
                        >
                          {formatPrice(invoice.paid_amount_cents)}
                          <FontAwesomeIcon icon={faPenToSquare} style={{ fontSize: '10px', opacity: 0.7, marginLeft: '4px' }} />
                        </span>
                      ) : (
                        <span style={{ color: '#999' }}>-</span>
                      )}
                    </td>
                    )}
                    {isColumnVisible('status') && (
                    <td>
                      <span
                        onClick={() => {
                          if (invoice.status === 'aberta' || invoice.status === 'vencida') {
                            openPaymentModal(invoice);
                          } else if (invoice.status === 'paga') {
                            openEditPaymentModal(invoice);
                          }
                        }}
                        style={{
                          cursor: (invoice.status !== 'cancelada' && invoice.status !== 'estornada') ? 'pointer' : 'default',
                        }}
                        title={
                          invoice.status === 'aberta' || invoice.status === 'vencida'
                            ? 'Clique para dar baixa'
                            : invoice.status === 'paga'
                            ? 'Clique para editar pagamento'
                            : undefined
                        }
                      >
                        {getStatusBadge(invoice.status)}
                      </span>
                    </td>
                    )}
                    {isColumnVisible('actions') && (
                    <td>
                      <div className="action-buttons">
                        {invoice.status === 'aberta' || invoice.status === 'vencida' ? (
                          <>
                            <div className="wtp-wrapper">
                              <button
                                className="btn-action btn-whatsapp"
                                onClick={() => handleWhatsAppClick(invoice)}
                                title="Enviar cobrança via WhatsApp"
                                style={{ backgroundColor: '#25D366', color: 'white' }}
                              >
                                <FontAwesomeIcon icon={faWhatsapp} />
                              </button>
                              {showTemplatePicker === invoice.id && (
                                <WhatsAppTemplatePicker
                                  onSelect={(message) => {
                                    setShowTemplatePicker(null);
                                    sendWhatsApp(invoice, message);
                                  }}
                                  onClose={() => setShowTemplatePicker(null)}
                                />
                              )}
                            </div>
                            <button
                              className="btn-action btn-pay"
                              onClick={() => openPaymentModal(invoice)}
                              title="Dar baixa"
                            >
                              <FontAwesomeIcon icon={faMoneyBillWave} />
                            </button>
                            <button
                              className="btn-action btn-cancel"
                              onClick={() => handleCancelInvoice(invoice.id)}
                              title="Cancelar"
                            >
                              <FontAwesomeIcon icon={faXmark} />
                            </button>
                          </>
                        ) : invoice.status === 'cancelada' ? (
                          <div className="wtp-wrapper">
                            <button
                              className="btn-action btn-whatsapp"
                              onClick={() => handleWhatsAppClick(invoice)}
                              title="Enviar mensagem via WhatsApp"
                              style={{ backgroundColor: '#25D366', color: 'white' }}
                            >
                              <FontAwesomeIcon icon={faWhatsapp} />
                            </button>
                            {showTemplatePicker === invoice.id && (
                              <WhatsAppTemplatePicker
                                onSelect={(message) => {
                                  setShowTemplatePicker(null);
                                  sendWhatsApp(invoice, message);
                                }}
                                onClose={() => setShowTemplatePicker(null)}
                              />
                            )}
                          </div>
                        ) : invoice.status === 'paga' ? (
                          <span className="paid-indicator" title={`Pago em ${formatDate(invoice.paid_at!)}`}>
                            <FontAwesomeIcon icon={faCheck} style={{ color: '#27ae60' }} />
                          </span>
                        ) : null}
                      </div>
                    </td>
                    )}
                  </tr>
              ))
              );
            })()}
          </tbody>
        </table>
      </div>

      {showPaymentModal && selectedInvoice && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Registrar Pagamento</h2>
              <button type="button" className="modal-close" onClick={() => setShowPaymentModal(false)}>×</button>
            </div>

            <div className="invoice-details">
              <h3>Detalhes da Fatura</h3>
              <p><strong>Aluno:</strong> {selectedInvoice.student_name}</p>
              <p><strong>Valor:</strong> {formatPrice(selectedInvoice.final_amount_cents)}</p>
              <p><strong>Vencimento:</strong> {formatDate(selectedInvoice.due_date)}</p>
            </div>

            <form onSubmit={handleRegisterPayment} className="payment-form">
              <div className="form-group">
                <label htmlFor="paid_at">Data do Pagamento *</label>
                <input
                  type="date"
                  id="paid_at"
                  value={paymentData.paid_at}
                  onChange={(e) => setPaymentData({ ...paymentData, paid_at: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="method">Método de Pagamento *</label>
                <select
                  id="method"
                  value={paymentData.method}
                  onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value as any })}
                  required
                >
                  <option value="pix">PIX</option>
                  <option value="cartao">Cartão</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="boleto">Boleto</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="amount_cents">Valor Pago (R$) *</label>
                <input
                  type="number"
                  id="amount_cents"
                  step="0.01"
                  value={(paymentData.amount_cents / 100).toFixed(2)}
                  onChange={(e) => setPaymentData({
                    ...paymentData,
                    amount_cents: Math.round(parseFloat(e.target.value) * 100)
                  })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="notes">Observações</label>
                <textarea
                  id="notes"
                  rows={3}
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  placeholder="Adicione observações sobre o pagamento (opcional)"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowPaymentModal(false)} disabled={submitting}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Processando...' : 'Confirmar Pagamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Edição de Pagamento */}
      {showEditPaymentModal && editingInvoice && (
        <div className="modal-overlay" onClick={() => setShowEditPaymentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar Pagamento</h2>
              <button type="button" className="modal-close" onClick={() => setShowEditPaymentModal(false)}>×</button>
            </div>

            <div className="invoice-details">
              <h3>Detalhes da Fatura</h3>
              <p><strong>Aluno:</strong> {editingInvoice.student_name}</p>
              <p><strong>Valor da fatura:</strong> {formatPrice(editingInvoice.final_amount_cents)}</p>
              <p><strong>Valor pago atual:</strong> {formatPrice(editingInvoice.paid_amount_cents || 0)}</p>
              <p><strong>Pago em:</strong> {editingInvoice.paid_at ? formatDate(editingInvoice.paid_at) : '-'}</p>
            </div>

            <div style={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
              fontSize: '14px',
              color: '#856404'
            }}>
              ⚠️ <strong>Atenção:</strong> Alterar o valor do pagamento irá afetar o balanço financeiro.
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={handleCancelPayment}
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#ffc107',
                  color: '#212529',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: submitting ? 0.6 : 1
                }}
              >
                <FontAwesomeIcon icon={faXmark} /> Cancelar Recebimento
              </button>
              <button
                type="button"
                onClick={() => openRefundModal(editingInvoice)}
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: submitting ? 0.6 : 1
                }}
              >
                <FontAwesomeIcon icon={faUndo} /> Estornar
              </button>
            </div>

            <form onSubmit={handleEditPayment} className="payment-form">
              <div className="form-group">
                <label htmlFor="edit_paid_at">Data do Pagamento *</label>
                <input
                  type="date"
                  id="edit_paid_at"
                  value={editPaymentData.paid_at}
                  onChange={(e) => setEditPaymentData({
                    ...editPaymentData,
                    paid_at: e.target.value
                  })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit_amount_cents">Valor Pago (R$) *</label>
                <input
                  type="number"
                  id="edit_amount_cents"
                  step="0.01"
                  value={(editPaymentData.amount_cents / 100).toFixed(2)}
                  onChange={(e) => setEditPaymentData({
                    ...editPaymentData,
                    amount_cents: Math.round(parseFloat(e.target.value) * 100)
                  })}
                  required
                />
                {editPaymentData.amount_cents !== (editingInvoice.paid_amount_cents || 0) && (
                  <small style={{
                    color: editPaymentData.amount_cents > (editingInvoice.paid_amount_cents || 0) ? '#28a745' : '#dc3545',
                    fontWeight: 'bold'
                  }}>
                    Diferença: {formatPrice(editPaymentData.amount_cents - (editingInvoice.paid_amount_cents || 0))}
                  </small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="edit_notes">Motivo da alteração</label>
                <textarea
                  id="edit_notes"
                  rows={3}
                  value={editPaymentData.notes}
                  onChange={(e) => setEditPaymentData({ ...editPaymentData, notes: e.target.value })}
                  placeholder="Descreva o motivo da alteração (opcional)"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowEditPaymentModal(false)} disabled={submitting}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Processando...' : 'Confirmar Alteração'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Estorno */}
      {showRefundModal && refundInvoice && (
        <div className="modal-overlay" onClick={() => setShowRefundModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ backgroundColor: '#dc3545', color: 'white' }}>
              <h2><FontAwesomeIcon icon={faUndo} /> Estornar Pagamento</h2>
              <button type="button" className="modal-close" onClick={() => setShowRefundModal(false)} style={{ color: 'white' }}>×</button>
            </div>

            <div style={{
              backgroundColor: '#f8d7da',
              border: '1px solid #f5c6cb',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px',
              color: '#721c24'
            }}>
              <strong>⚠️ Atenção: Esta ação não pode ser desfeita!</strong>
              <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
                O pagamento será removido e a fatura será marcada como estornada (valor R$ 0,00).
                O histórico do estorno ficará registrado nas observações da fatura.
              </p>
            </div>

            <div className="invoice-details">
              <h3>Detalhes do Pagamento</h3>
              <p><strong>Aluno:</strong> {refundInvoice.student_name}</p>
              <p><strong>Valor da fatura:</strong> {formatPrice(refundInvoice.final_amount_cents)}</p>
              <p><strong>Valor pago:</strong> {formatPrice(refundInvoice.paid_amount_cents || 0)}</p>
              <p><strong>Método:</strong> {refundInvoice.payment_method || '-'}</p>
              <p><strong>Pago em:</strong> {refundInvoice.paid_at ? formatDate(refundInvoice.paid_at) : '-'}</p>
            </div>

            <div className="form-group">
              <label htmlFor="refund_reason">Motivo do Estorno *</label>
              <textarea
                id="refund_reason"
                rows={3}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Descreva o motivo do estorno (ex: pagamento duplicado, mudança de plano, etc.)"
                required
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowRefundModal(false)} disabled={submitting}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleRefund}
                disabled={submitting || !refundReason.trim()}
                style={{ backgroundColor: '#dc3545', borderColor: '#dc3545' }}
              >
                {submitting ? 'Processando...' : 'Confirmar Estorno'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Vencimento */}
      {showDueDateModal && editingDueDateInvoice && (
        <div className="modal-overlay" onClick={() => setShowDueDateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2><FontAwesomeIcon icon={faCalendarAlt} /> Alterar Vencimento</h2>
              <button type="button" className="modal-close" onClick={() => setShowDueDateModal(false)}>×</button>
            </div>

            <div className="invoice-details">
              <p><strong>Aluno:</strong> {editingDueDateInvoice.student_name}</p>
              <p><strong>Plano:</strong> {editingDueDateInvoice.plan_name || '-'}</p>
              <p><strong>Valor:</strong> {formatPrice(editingDueDateInvoice.final_amount_cents)}</p>
              <p><strong>Vencimento atual:</strong> {formatDate(editingDueDateInvoice.due_date)}</p>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (submitting) return;
              
              try {
                setSubmitting(true);
                await financialService.updateInvoiceDueDate(editingDueDateInvoice.id, newDueDate);
                toast.success('Vencimento atualizado com sucesso!');
                setShowDueDateModal(false);
                setEditingDueDateInvoice(null);
                // Recarregar faturas preservando filtros
                await loadInvoices();
              } catch (error: any) {
                console.error('Erro ao atualizar vencimento:', error);
                toast.error(error.response?.data?.message || 'Erro ao atualizar vencimento');
              } finally {
                setSubmitting(false);
              }
            }} className="payment-form">
              <div className="form-group">
                <label htmlFor="new_due_date">Novo Vencimento *</label>
                <input
                  type="date"
                  id="new_due_date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowDueDateModal(false)} disabled={submitting}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={submitting || !newDueDate}>
                  {submitting ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Level Edit Modal */}
      {showLevelModal && levelEditInvoice && (
        <div className="modal-overlay" onClick={() => setShowLevelModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Alterar Nível do Aluno</h2>
              <button type="button" className="modal-close" onClick={() => setShowLevelModal(false)}>×</button>
            </div>

            <div className="invoice-details">
              <p><strong>Aluno:</strong> {levelEditInvoice.student_name}</p>
              <p><strong>Nível atual:</strong>{' '}
                {levelEditInvoice.level_name ? (
                  <span
                    className="level-badge"
                    style={{ background: levelEditInvoice.level_color || '#6b7280' }}
                  >
                    {levelEditInvoice.level_name}
                  </span>
                ) : 'Nenhum'}
              </p>
            </div>

            <div className="payment-form">
              <div className="form-group">
                <label htmlFor="level-select">Novo Nível</label>
                <select
                  id="level-select"
                  value={selectedLevelId || ''}
                  onChange={(e) => setSelectedLevelId(e.target.value ? parseInt(e.target.value) : null)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                >
                  <option value="">Selecione um nível</option>
                  {levels.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.name}
                    </option>
                  ))}
                </select>
              </div>
              {selectedLevelId && selectedLevelId !== levelEditInvoice.level_id && (
                <div style={{ padding: '10px 14px', backgroundColor: '#fffbeb', border: '1px solid #f59e0b', borderRadius: '8px', fontSize: '0.85rem', color: '#92400e', marginTop: '8px' }}>
                  <strong>Atenção:</strong> Se o aluno estiver em turmas que não aceitam o novo nível, ele aparecerá como "fora do nível" na tela de Turmas.
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowLevelModal(false)} disabled={submitting}>
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleUpdateLevel}
                  disabled={submitting || !selectedLevelId || selectedLevelId === levelEditInvoice.level_id}
                >
                  {submitting ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
