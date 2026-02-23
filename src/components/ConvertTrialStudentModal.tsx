import { useState, useEffect } from 'react';
import { X, User, CreditCard, GraduationCap, CheckCircle, Calendar, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { trialStudentService } from '../services/trialStudentService';
import { planService } from '../services/planService';
import { classService } from '../services/classService';
import type { TrialStudent, UpgradeToRegularRequest } from '../types/trialStudentTypes';
import type { Plan } from '../types/enrollmentTypes';
import type { Class } from '../types/classTypes';
import '../styles/TrialStudents.css';

interface ConvertTrialStudentModalProps {
  trialStudent: TrialStudent;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'personal' | 'plan' | 'classes' | 'review';

export default function ConvertTrialStudentModal({
  trialStudent,
  onClose,
  onSuccess,
}: ConvertTrialStudentModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('personal');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<UpgradeToRegularRequest>({
    cpf: '',
    birth_date: '',
    sex: 'N/I',
    plan_id: 0,
    class_ids: [],
    start_date: new Date().toISOString().split('T')[0],
    due_day: 10,
    contract_type: 'mensal',
  });

  useEffect(() => {
    fetchPlans();
    fetchClasses();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await planService.getPlans();
      // Backend returns either success: boolean OR status: 'success'
      if (response.success || (response as any).status === 'success') {
        const planData = response.data || (response as any).data;
        if (Array.isArray(planData)) {
          setPlans(planData.filter((p) => p.status === 'ativo'));
        }
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Erro ao carregar planos');
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await classService.getClasses();
      // Backend returns either success: boolean OR status: 'success'
      if (response.success || (response as any).status === 'success') {
        const classData = response.data || (response as any).data;
        if (Array.isArray(classData)) {
          setClasses(classData.filter((c) => c.status === 'ativa'));
        }
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Erro ao carregar turmas');
    }
  };

  const selectedPlan = plans.find((p) => p.id === formData.plan_id);
  const selectedClasses = classes.filter((c) => formData.class_ids.includes(c.id));

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 'personal':
        return formData.cpf.length >= 11; // CPF é obrigatório
      case 'plan':
        return formData.plan_id > 0;
      case 'classes':
        return (
          formData.class_ids.length > 0 &&
          (!selectedPlan || formData.class_ids.length === selectedPlan.sessions_per_week)
        );
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!canProceedToNextStep()) {
      if (currentStep === 'personal') {
        toast.error('CPF é obrigatório para conversão');
      } else if (currentStep === 'plan') {
        toast.error('Selecione um plano');
      } else if (currentStep === 'classes') {
        toast.error(
          `Selecione ${selectedPlan?.sessions_per_week} turma(s) conforme o plano`
        );
      }
      return;
    }

    const steps: Step[] = ['personal', 'plan', 'classes', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps: Step[] = ['personal', 'plan', 'classes', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleSubmit = async () => {
    if (!canProceedToNextStep()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await trialStudentService.upgradeToRegular(
        trialStudent.id,
        formData
      );

      if (response.status === 'success') {
        toast.success('Aluno convertido com sucesso! Matrícula e fatura criadas.');
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      console.error('Error converting trial student:', error);
      toast.error(
        error.response?.data?.message || 'Erro ao converter aluno'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: 'personal', label: 'Dados Pessoais', icon: User },
      { key: 'plan', label: 'Plano', icon: CreditCard },
      { key: 'classes', label: 'Turmas', icon: GraduationCap },
      { key: 'review', label: 'Revisão', icon: CheckCircle },
    ];

    const currentIndex = steps.findIndex((s) => s.key === currentStep);

    return (
      <div className="trial-conversion-steps">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = step.key === currentStep;
          const isCompleted = index < currentIndex;

          return (
            <div
              key={step.key}
              className={`trial-conversion-step ${
                isActive ? 'active' : ''
              } ${isCompleted ? 'completed' : ''}`}
            >
              <div className="trial-conversion-step-circle">
                {isCompleted ? '✓' : <Icon size={20} />}
              </div>
              <span className="trial-conversion-step-label">{step.label}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderPersonalDataStep = () => (
    <div>
      <h3 style={{ marginBottom: '1.5rem', color: '#333' }}>
        Dados Pessoais Adicionais
      </h3>

      <div className="trial-form-group">
        <label htmlFor="cpf" className="required">
          CPF
        </label>
        <input
          id="cpf"
          type="text"
          placeholder="000.000.000-00"
          value={formData.cpf}
          onChange={(e) =>
            setFormData({ ...formData, cpf: e.target.value.replace(/\D/g, '') })
          }
          maxLength={14}
          required
        />
        <small>Obrigatório para criar a matrícula oficial</small>
      </div>

      <div className="trial-form-row">
        <div className="trial-form-group">
          <label htmlFor="birth_date">Data de Nascimento</label>
          <input
            id="birth_date"
            type="date"
            value={formData.birth_date}
            onChange={(e) =>
              setFormData({ ...formData, birth_date: e.target.value })
            }
          />
        </div>

        <div className="trial-form-group">
          <label htmlFor="sex">Sexo</label>
          <select
            id="sex"
            value={formData.sex}
            onChange={(e) =>
              setFormData({
                ...formData,
                sex: e.target.value as 'M' | 'F' | 'N/I',
              })
            }
          >
            <option value="M">Masculino</option>
            <option value="F">Feminino</option>
            <option value="N/I">Prefiro não informar</option>
          </select>
        </div>
      </div>

      <div
        style={{
          background: '#f8f9fa',
          padding: '1rem',
          borderRadius: '8px',
          marginTop: '1rem',
        }}
      >
        <strong>Dados do Aluno Experimental:</strong>
        <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.5rem' }}>
          <li>Nome: {trialStudent.full_name}</li>
          {trialStudent.phone && <li>Telefone: {trialStudent.phone}</li>}
          {trialStudent.email && <li>E-mail: {trialStudent.email}</li>}
          {trialStudent.level && <li>Nível: {trialStudent.level}</li>}
          {trialStudent.trial_classes_count !== undefined && (
            <li>Aulas experimentais: {trialStudent.trial_classes_count}</li>
          )}
        </ul>
      </div>
    </div>
  );

  const renderPlanStep = () => (
    <div>
      <h3 style={{ marginBottom: '1.5rem', color: '#333' }}>
        Selecione o Plano
      </h3>

      <div className="trial-form-row">
        <div className="trial-form-group">
          <label htmlFor="start_date" className="required">
            <Calendar size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />
            Data de Início
          </label>
          <input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) =>
              setFormData({ ...formData, start_date: e.target.value })
            }
            required
          />
        </div>

        <div className="trial-form-group">
          <label htmlFor="due_day">Dia de Vencimento</label>
          <select
            id="due_day"
            value={formData.due_day}
            onChange={(e) =>
              setFormData({
                ...formData,
                due_day: parseInt(e.target.value),
              })
            }
          >
            {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
              <option key={day} value={day}>
                Dia {day}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="trial-form-group">
        <label htmlFor="contract_type">Tipo de Contrato</label>
        <select
          id="contract_type"
          value={formData.contract_type}
          onChange={(e) =>
            setFormData({
              ...formData,
              contract_type: e.target.value as
                | 'mensal'
                | 'trimestral'
                | 'semestral'
                | 'anual',
            })
          }
        >
          <option value="mensal">Mensal</option>
          <option value="trimestral">Trimestral</option>
          <option value="semestral">Semestral</option>
          <option value="anual">Anual</option>
        </select>
      </div>

      <div className="trial-form-group">
        <label className="required">Plano</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {plans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => setFormData({ ...formData, plan_id: plan.id, class_ids: [] })}
              style={{
                border: `2px solid ${
                  formData.plan_id === plan.id ? '#667eea' : '#e0e0e0'
                }`,
                borderRadius: '12px',
                padding: '1rem',
                cursor: 'pointer',
                background:
                  formData.plan_id === plan.id ? '#f0f4ff' : 'white',
                transition: 'all 0.2s',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>
                    {plan.name}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
                    {plan.sessions_per_week}x por semana
                  </p>
                  {plan.description && (
                    <p
                      style={{
                        margin: '0.5rem 0 0 0',
                        fontSize: '0.875rem',
                        color: '#999',
                      }}
                    >
                      {plan.description}
                    </p>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      color: '#667eea',
                    }}
                  >
                    <DollarSign
                      size={20}
                      style={{ display: 'inline', marginRight: '0.25rem' }}
                    />
                    {(plan.price_cents / 100).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#999' }}>
                    por mês
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderClassesStep = () => {
    // Filter classes by student level if available
    const filteredClasses = trialStudent.level
      ? classes.filter((c) => {
          if (c.allowed_levels && c.allowed_levels.length > 0) {
            return c.allowed_levels.includes(trialStudent.level!);
          }
          return true;
        })
      : classes;

    return (
      <div>
        <h3 style={{ marginBottom: '1rem', color: '#333' }}>
          Selecione as Turmas
        </h3>

        {selectedPlan && (
          <div
            style={{
              background: '#e3f2fd',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              borderLeft: '4px solid #1976d2',
            }}
          >
            <strong>
              Selecione {selectedPlan.sessions_per_week} turma(s) conforme o
              plano {selectedPlan.name}
            </strong>
            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
              Selecionadas: {formData.class_ids.length} /{' '}
              {selectedPlan.sessions_per_week}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredClasses.map((classItem) => {
            const isSelected = formData.class_ids.includes(classItem.id);
            const canSelect =
              !selectedPlan ||
              isSelected ||
              formData.class_ids.length < selectedPlan.sessions_per_week;

            return (
              <div
                key={classItem.id}
                onClick={() => {
                  if (!canSelect && !isSelected) return;

                  setFormData({
                    ...formData,
                    class_ids: isSelected
                      ? formData.class_ids.filter((id) => id !== classItem.id)
                      : [...formData.class_ids, classItem.id],
                  });
                }}
                style={{
                  border: `2px solid ${
                    isSelected ? '#11998e' : '#e0e0e0'
                  }`,
                  borderRadius: '12px',
                  padding: '1rem',
                  cursor: canSelect || isSelected ? 'pointer' : 'not-allowed',
                  background: isSelected ? '#e6f7f1' : 'white',
                  opacity: canSelect || isSelected ? 1 : 0.5,
                  transition: 'all 0.2s',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>
                      {classItem.name}
                    </h4>
                    <div
                      style={{
                        fontSize: '0.875rem',
                        color: '#666',
                        display: 'flex',
                        gap: '1rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      {classItem.schedule && <span>📅 {classItem.schedule}</span>}
                      {classItem.allowed_levels && classItem.allowed_levels.length > 0 && (
                        <span>📊 Nível: {classItem.allowed_levels.join(', ')}</span>
                      )}
                      {classItem.instructor_name && (
                        <span>👤 {classItem.instructor_name}</span>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: '#11998e',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                      }}
                    >
                      ✓
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredClasses.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
            Nenhuma turma disponível
          </div>
        )}
      </div>
    );
  };

  const renderReviewStep = () => (
    <div>
      <h3 style={{ marginBottom: '1.5rem', color: '#333' }}>
        Revisar Conversão
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Personal Data */}
        <div
          style={{
            background: '#f8f9fa',
            padding: '1.5rem',
            borderRadius: '12px',
          }}
        >
          <h4 style={{ margin: '0 0 1rem 0', color: '#667eea' }}>
            <User size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Dados Pessoais
          </h4>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <div><strong>Nome:</strong> {trialStudent.full_name}</div>
            <div><strong>CPF:</strong> {formData.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</div>
            {formData.birth_date && (
              <div><strong>Data de Nascimento:</strong> {new Date(formData.birth_date).toLocaleDateString('pt-BR')}</div>
            )}
            <div><strong>Sexo:</strong> {formData.sex === 'M' ? 'Masculino' : formData.sex === 'F' ? 'Feminino' : 'Não informado'}</div>
            {trialStudent.phone && <div><strong>Telefone:</strong> {trialStudent.phone}</div>}
            {trialStudent.email && <div><strong>E-mail:</strong> {trialStudent.email}</div>}
          </div>
        </div>

        {/* Plan */}
        {selectedPlan && (
          <div
            style={{
              background: '#f8f9fa',
              padding: '1.5rem',
              borderRadius: '12px',
            }}
          >
            <h4 style={{ margin: '0 0 1rem 0', color: '#667eea' }}>
              <CreditCard size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
              Plano e Matrícula
            </h4>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <div><strong>Plano:</strong> {selectedPlan.name}</div>
              <div><strong>Valor Mensal:</strong> R$ {(selectedPlan.price_cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div><strong>Aulas por Semana:</strong> {selectedPlan.sessions_per_week}x</div>
              <div><strong>Data de Início:</strong> {new Date(formData.start_date).toLocaleDateString('pt-BR')}</div>
              <div><strong>Dia de Vencimento:</strong> {formData.due_day}</div>
              <div><strong>Tipo de Contrato:</strong> {formData.contract_type}</div>
            </div>
          </div>
        )}

        {/* Classes */}
        {selectedClasses.length > 0 && (
          <div
            style={{
              background: '#f8f9fa',
              padding: '1.5rem',
              borderRadius: '12px',
            }}
          >
            <h4 style={{ margin: '0 0 1rem 0', color: '#667eea' }}>
              <GraduationCap size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
              Turmas Selecionadas
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
              {selectedClasses.map((c) => (
                <li key={c.id} style={{ marginBottom: '0.5rem' }}>
                  <strong>{c.name}</strong>
                  {c.schedule && ` - ${c.schedule}`}
                  {c.instructor_name && ` (${c.instructor_name})`}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Warning */}
        <div
          style={{
            background: '#fff3cd',
            borderLeft: '4px solid #ffc107',
            padding: '1rem',
            borderRadius: '8px',
            fontSize: '0.875rem',
            color: '#856404',
          }}
        >
          <strong>⚠️ Atenção:</strong>
          <p style={{ margin: '0.5rem 0 0' }}>
            Ao confirmar a conversão, será criada uma matrícula oficial e a primeira fatura será gerada automaticamente.
            O aluno será marcado como convertido e não aparecerá mais na lista de alunos experimentais.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="trial-modal-overlay" onClick={onClose}>
      <div
        className="trial-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '800px' }}
      >
        <div className="trial-modal-header">
          <h2>
            Converter para Aluno Regular
          </h2>
          <button className="trial-modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="trial-modal-body">
          {renderStepIndicator()}

          <div style={{ marginTop: '2rem' }}>
            {currentStep === 'personal' && renderPersonalDataStep()}
            {currentStep === 'plan' && renderPlanStep()}
            {currentStep === 'classes' && renderClassesStep()}
            {currentStep === 'review' && renderReviewStep()}
          </div>
        </div>

        <div className="trial-modal-footer">
          {currentStep !== 'personal' && (
            <button
              type="button"
              className="btn-secondary"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              Voltar
            </button>
          )}
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          {currentStep !== 'review' ? (
            <button
              type="button"
              className="btn-primary"
              onClick={handleNext}
              disabled={!canProceedToNextStep()}
            >
              Próximo
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary"
              onClick={handleSubmit}
              disabled={isSubmitting || !canProceedToNextStep()}
            >
              {isSubmitting ? 'Convertendo...' : 'Confirmar Conversão'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
