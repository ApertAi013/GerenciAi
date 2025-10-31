import { useNavigate } from 'react-router-dom';
import type { ActionData, WhatsAppLink, ClassInfo, ScheduleConflict } from '../types/aiTypes';
import '../styles/SuggestionActionModal.css';

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
              className="btn-primary"
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
              className="btn-secondary"
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
              className="btn-secondary"
              onClick={() => handleClassNavigate(conflict.class1.id)}
            >
              Ver Turma 1
            </button>
            <button
              className="btn-secondary"
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
    switch (actionData.type) {
      case 'whatsapp_links':
        return renderWhatsAppLinks(actionData.links);
      case 'class_list':
        return renderClassList(actionData.classes, false);
      case 'low_occupancy_list':
        return renderClassList(actionData.classes, true);
      case 'conflicts_list':
        return renderConflictsList(actionData.conflicts);
      default:
        return <p>Tipo de ação desconhecido</p>;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{getTitleByType()}</h2>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body">{renderContent()}</div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
