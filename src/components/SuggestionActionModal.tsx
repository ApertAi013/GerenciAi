import { useNavigate } from 'react-router-dom';
import type { ActionData, WhatsAppLink, ClassInfo, ScheduleConflict } from '../types/aiTypes';
import '../styles/SuggestionActionModal.css';
import '../styles/ModernModal.css';

interface SuggestionActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionData: ActionData | null;
  suggestionType: string;
}

export default function SuggestionActionModal({
  isOpen,
  onClose,
  actionData,
  suggestionType,
}: SuggestionActionModalProps) {
  const navigate = useNavigate();

  if (!isOpen || !actionData) return null;

  // Log para debug
  console.log('SuggestionActionModal - actionData:', actionData);
  console.log('SuggestionActionModal - suggestionType:', suggestionType);

  const getTitleByType = () => {
    switch (suggestionType) {
      case 'payment_reminder':
        return 'Enviar Lembretes de Pagamento';
      case 'available_slots':
        return 'Turmas com Vagas Disponíveis';
      case 'low_occupancy':
        return 'Turmas com Baixa Ocupação';
      case 'inactive_students':
        return 'Reativar Alunos Inativos';
      case 'schedule_conflict':
        return 'Conflitos de Horário Detectados';
      default:
        return 'Ação';
    }
  };

  const handleWhatsAppClick = (link: string) => {
    window.open(link, '_blank');
  };

  const handleClassNavigate = (classId: number) => {
    navigate(`/classes/${classId}`);
    onClose();
  };

  const renderWhatsAppLinks = (links: WhatsAppLink[]) => (
    <div className="modal-items-list">
      {links.map((link, index) => (
        <div key={index} className="modal-item">
          <div className="item-info">
            <h3>{link.student_name}</h3>
            {link.phone && <p className="phone">{link.phone}</p>}
            {link.due_date && (
              <p className="detail">
                Vencimento: {link.due_date}
                {link.amount && ` - R$ ${(link.amount / 100).toFixed(2)}`}
              </p>
            )}
            {link.days_inactive && (
              <p className="detail">{link.days_inactive} dias sem atividade</p>
            )}
          </div>
          <div className="item-actions">
            <button
              className="mm-btn mm-btn-primary"
              onClick={() => handleWhatsAppClick(link.whatsapp_link)}
            >
              Enviar no WhatsApp
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderClassList = (classes: ClassInfo[], showOccupancy: boolean = false) => (
    <div className="modal-items-list">
      {classes.map((cls) => (
        <div key={cls.id} className="modal-item">
          <div className="item-info">
            <h3>{cls.name}</h3>
            {cls.weekday && cls.time && (
              <p className="detail">
                {cls.weekday} às {cls.time}
              </p>
            )}
            {showOccupancy ? (
              <>
                <p className="info">
                  {cls.enrolled} de {cls.max} alunos ({cls.occupancy_rate?.toFixed(1)}% de ocupação)
                </p>
                {cls.occupancy_rate !== undefined && (
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${cls.occupancy_rate}%` }}
                    />
                  </div>
                )}
              </>
            ) : (
              <p className="info">
                {cls.available_slots} vaga(s) disponível(is)
              </p>
            )}
          </div>
          <div className="item-actions">
            <button
              className="mm-btn mm-btn-secondary"
              onClick={() => handleClassNavigate(cls.id)}
            >
              Ver Turma
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderConflictsList = (conflicts: ScheduleConflict[]) => (
    <div className="modal-items-list">
      {conflicts.map((conflict, index) => (
        <div key={index} className="modal-item">
          <div className="item-info">
            <h3>
              {conflict.class1.name} vs {conflict.class2.name}
            </h3>
            <p className="detail">Conflito na {conflict.weekday}</p>
          </div>
          <div className="item-actions">
            <button
              className="mm-btn mm-btn-secondary"
              onClick={() => handleClassNavigate(conflict.class1.id)}
            >
              Ver Turma 1
            </button>
            <button
              className="mm-btn mm-btn-secondary"
              onClick={() => handleClassNavigate(conflict.class2.id)}
            >
              Ver Turma 2
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderContent = () => {
    try {
      console.log('Renderizando conteúdo para tipo:', actionData.type);

      switch (actionData.type) {
        case 'whatsapp_links':
          if (!actionData.links || !Array.isArray(actionData.links)) {
            console.error('Links inválidos:', actionData.links);
            return <p>Nenhum link de WhatsApp disponível</p>;
          }
          return renderWhatsAppLinks(actionData.links);

        case 'class_list':
          if (!actionData.classes || !Array.isArray(actionData.classes)) {
            console.error('Classes inválidas:', actionData.classes);
            return <p>Nenhuma turma disponível</p>;
          }
          return renderClassList(actionData.classes, false);

        case 'low_occupancy_list':
          if (!actionData.classes || !Array.isArray(actionData.classes)) {
            console.error('Classes inválidas:', actionData.classes);
            return <p>Nenhuma turma disponível</p>;
          }
          return renderClassList(actionData.classes, true);

        case 'conflicts_list':
          if (!actionData.conflicts || !Array.isArray(actionData.conflicts)) {
            console.error('Conflitos inválidos:', actionData.conflicts);
            return <p>Nenhum conflito detectado</p>;
          }
          return renderConflictsList(actionData.conflicts);

        default:
          console.error('Tipo de ação desconhecido:', actionData.type);
          return <p>Tipo de ação desconhecido: {actionData.type}</p>;
      }
    } catch (error) {
      console.error('Erro ao renderizar conteúdo do modal:', error);
      return (
        <div style={{ padding: '20px', textAlign: 'center', color: '#ef4444' }}>
          <p>Erro ao carregar ação</p>
          <p style={{ fontSize: '14px', color: '#737373' }}>
            Por favor, tente novamente ou entre em contato com o suporte.
          </p>
        </div>
      );
    }
  };

  return (
    <div className="mm-overlay" onClick={onClose}>
      <div className="mm-modal mm-modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mm-header">
          <h2>{getTitleByType()}</h2>
          <button type="button" className="mm-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="mm-content">{renderContent()}</div>

        <div className="mm-footer">
          <button className="mm-btn mm-btn-secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
