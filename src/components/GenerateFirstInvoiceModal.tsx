import { useState } from 'react';
import { X, Calendar, Calculator, Receipt, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { enrollmentService } from '../services/enrollmentService';
import '../styles/Enrollments.css';
import '../styles/ModernModal.css';

interface GenerateFirstInvoiceModalProps {
  enrollmentId: number;
  studentName: string;
  planPrice: number; // em centavos
  dueDay: number;
  discountType: 'none' | 'fixed' | 'percentage';
  discountValue: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function GenerateFirstInvoiceModal({
  enrollmentId,
  studentName,
  planPrice,
  dueDay,
  discountType,
  discountValue,
  onClose,
  onSuccess,
}: GenerateFirstInvoiceModalProps) {
  console.log('GenerateFirstInvoiceModal MONTANDO - props:', { enrollmentId, studentName, planPrice, dueDay, discountType, discountValue });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<'full' | 'proportional' | null>(null);

  // Debug: verificar se está sendo renderizado
  if (!enrollmentId) {
    console.error('GenerateFirstInvoiceModal - enrollmentId is falsy:', enrollmentId);
  }

  // Calcular valores
  const today = new Date();
  const currentDay = today.getDate();

  // Calcular próxima data de vencimento
  let nextDueDate: Date;
  if (currentDay <= dueDay) {
    nextDueDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
  } else {
    nextDueDate = new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
  }

  // Calcular dias até o vencimento
  const daysUntilDue = Math.ceil((nextDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Calcular valor proporcional
  const dailyRate = planPrice / 30;
  const proportionalAmount = Math.round(dailyRate * daysUntilDue);

  // Calcular descontos
  const calculateDiscount = (amount: number) => {
    if (discountType === 'none') return 0;
    if (discountType === 'fixed') {
      // Para proporcional, desconto também é proporcional
      if (amount === proportionalAmount) {
        return Math.round((discountValue / 30) * daysUntilDue);
      }
      return discountValue;
    }
    if (discountType === 'percentage') {
      return Math.round((amount * discountValue) / 100);
    }
    return 0;
  };

  const fullDiscount = calculateDiscount(planPrice);
  const proportionalDiscount = calculateDiscount(proportionalAmount);

  const fullFinal = Math.max(0, planPrice - fullDiscount);
  const proportionalFinal = Math.max(0, proportionalAmount - proportionalDiscount);

  // Formatação
  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR');
  };

  const handleSubmit = async () => {
    if (!selectedType) {
      toast.error('Selecione o tipo de fatura');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await enrollmentService.generateFirstInvoice({
        enrollment_id: enrollmentId,
        invoice_type: selectedType,
      });

      if (response.success) {
        toast.success(response.message);
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || 'Erro ao gerar fatura');
      }
    } catch (error: any) {
      console.error('Error generating invoice:', error);
      toast.error(error.response?.data?.message || 'Erro ao gerar fatura');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    toast('Fatura não gerada. Será criada no próximo fechamento mensal.', {
      icon: '📝',
      duration: 4000,
    });
    onSuccess();
    onClose();
  };

  console.log('GenerateFirstInvoiceModal - prestes a renderizar JSX');

  return (
    <div className="mm-overlay" style={{ zIndex: 9999 }}>
      <div className="mm-modal mm-modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mm-header">
          <h2><Receipt size={20} /> Gerar Primeira Fatura</h2>
          <button type="button" className="mm-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="mm-content">
          <div className="info-box" style={{
            backgroundColor: '#f0f9ff',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            border: '1px solid #bae6fd'
          }}>
            <p style={{ margin: 0, color: '#0369a1' }}>
              <strong>{studentName}</strong> foi matriculado(a) com sucesso!
            </p>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: '#0284c7' }}>
              Como deseja gerar a primeira fatura?
            </p>
          </div>

          <div className="invoice-options" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Opção 1: Fatura Cheia */}
            <div
              className={`invoice-option ${selectedType === 'full' ? 'selected' : ''}`}
              onClick={() => setSelectedType('full')}
              style={{
                padding: '1.25rem',
                border: selectedType === 'full' ? '2px solid #10b981' : '2px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: selectedType === 'full' ? '#f0fdf4' : '#fff',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <Calendar size={20} color={selectedType === 'full' ? '#10b981' : '#6b7280'} />
                <strong style={{ fontSize: '1.1rem' }}>Fatura Cheia - Vencimento Hoje</strong>
              </div>
              <div style={{ marginLeft: '2rem', color: '#4b5563', fontSize: '0.9rem' }}>
                <p style={{ margin: '0.25rem 0' }}>
                  Valor: {fullDiscount > 0 && (
                    <span style={{ textDecoration: 'line-through', color: '#9ca3af', marginRight: '0.5rem' }}>
                      {formatPrice(planPrice)}
                    </span>
                  )}
                  <strong style={{ color: '#059669' }}>{formatPrice(fullFinal)}</strong>
                </p>
                <p style={{ margin: '0.25rem 0', color: '#6b7280' }}>
                  Vencimento: <strong>{formatDate(today)}</strong>
                </p>
              </div>
            </div>

            {/* Opção 2: Fatura Proporcional */}
            <div
              className={`invoice-option ${selectedType === 'proportional' ? 'selected' : ''}`}
              onClick={() => setSelectedType('proportional')}
              style={{
                padding: '1.25rem',
                border: selectedType === 'proportional' ? '2px solid #10b981' : '2px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: selectedType === 'proportional' ? '#f0fdf4' : '#fff',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <Calculator size={20} color={selectedType === 'proportional' ? '#10b981' : '#6b7280'} />
                <strong style={{ fontSize: '1.1rem' }}>Fatura Proporcional</strong>
              </div>
              <div style={{ marginLeft: '2rem', color: '#4b5563', fontSize: '0.9rem' }}>
                <p style={{ margin: '0.25rem 0' }}>
                  Valor proporcional ({daysUntilDue} dias): {proportionalDiscount > 0 && (
                    <span style={{ textDecoration: 'line-through', color: '#9ca3af', marginRight: '0.5rem' }}>
                      {formatPrice(proportionalAmount)}
                    </span>
                  )}
                  <strong style={{ color: '#059669' }}>{formatPrice(proportionalFinal)}</strong>
                </p>
                <p style={{ margin: '0.25rem 0', color: '#6b7280' }}>
                  Vencimento: <strong>{formatDate(nextDueDate)}</strong> (dia {dueDay})
                </p>
                <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: '#9ca3af' }}>
                  Cálculo: {formatPrice(planPrice)} ÷ 30 × {daysUntilDue} dias
                </p>
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
            marginTop: '1rem',
            padding: '0.75rem',
            backgroundColor: '#fefce8',
            borderRadius: '6px',
            border: '1px solid #fde047'
          }}>
            <AlertCircle size={16} color="#ca8a04" style={{ flexShrink: 0, marginTop: '2px' }} />
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#854d0e' }}>
              Faturas seguintes serão geradas automaticamente no dia 31 de cada mês.
            </p>
          </div>
        </div>

        <div className="mm-footer" style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          <button
            type="button"
            className="mm-btn mm-btn-secondary"
            onClick={handleSkip}
            disabled={isSubmitting}
          >
            Pular (gerar no fechamento)
          </button>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="mm-btn mm-btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="mm-btn mm-btn-primary"
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedType}
            >
              {isSubmitting ? 'Gerando...' : 'Gerar Fatura'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
