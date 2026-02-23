import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faEnvelope,
  faPhone,
  faCakeCandles,
  faVenusMars,
  faIdCard,
  faCheckCircle,
  faTimesCircle,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { studentService } from '../services/studentService';
import type { Student } from '../types/studentTypes';
import '../styles/StudentPreviewModal.css';

interface StudentPreviewModalProps {
  studentId: number;
  onClose: () => void;
}

export default function StudentPreviewModal({
  studentId,
  onClose
}: StudentPreviewModalProps) {
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStudentDetails();
  }, [studentId]);

  const fetchStudentDetails = async () => {
    try {
      setIsLoading(true);
      const response = await studentService.getStudentById(studentId);

      if ((response as any).status === 'success' || (response as any).success === true) {
        setStudent(response.data);
      } else {
        setError('Erro ao carregar dados do aluno');
      }
    } catch (err: any) {
      console.error('Erro ao buscar aluno:', err);
      setError(err.response?.data?.message || 'Erro ao carregar dados do aluno');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo':
        return '#10b981';
      case 'inativo':
        return '#ef4444';
      case 'pendente':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'Ativo';
      case 'inativo':
        return 'Inativo';
      case 'pendente':
        return 'Pendente';
      default:
        return status;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="student-preview-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Perfil do Aluno</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {isLoading && (
          <div className="loading-container">
            <FontAwesomeIcon icon={faSpinner} spin size="2x" />
            <p>Carregando...</p>
          </div>
        )}

        {error && (
          <div className="error-message" style={{ margin: '1rem' }}>
            {error}
          </div>
        )}

        {!isLoading && !error && student && (
          <div className="student-preview-content">
            {/* Status Badge */}
            <div
              className="student-status-badge"
              style={{
                backgroundColor: getStatusColor(student.status),
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                fontWeight: 600,
                textAlign: 'center',
                marginBottom: '1.5rem'
              }}
            >
              <FontAwesomeIcon
                icon={student.status === 'ativo' ? faCheckCircle : faTimesCircle}
                style={{ marginRight: '0.5rem' }}
              />
              {getStatusLabel(student.status).toUpperCase()}
            </div>

            {/* Student Info Grid */}
            <div className="student-info-grid">
              <div className="info-item">
                <div className="info-label">
                  <FontAwesomeIcon icon={faUser} />
                  <span>Nome Completo</span>
                </div>
                <div className="info-value">{student.full_name || '-'}</div>
              </div>

              <div className="info-item">
                <div className="info-label">
                  <FontAwesomeIcon icon={faIdCard} />
                  <span>CPF</span>
                </div>
                <div className="info-value">{student.cpf || '-'}</div>
              </div>

              <div className="info-item">
                <div className="info-label">
                  <FontAwesomeIcon icon={faEnvelope} />
                  <span>Email</span>
                </div>
                <div className="info-value">{student.email || '-'}</div>
              </div>

              <div className="info-item">
                <div className="info-label">
                  <FontAwesomeIcon icon={faPhone} />
                  <span>Telefone</span>
                </div>
                <div className="info-value">{student.phone || '-'}</div>
              </div>

              <div className="info-item">
                <div className="info-label">
                  <FontAwesomeIcon icon={faCakeCandles} />
                  <span>Data de Nascimento</span>
                </div>
                <div className="info-value">{formatDate(student.birth_date)}</div>
              </div>

              <div className="info-item">
                <div className="info-label">
                  <FontAwesomeIcon icon={faVenusMars} />
                  <span>Sexo</span>
                </div>
                <div className="info-value">{student.sex || '-'}</div>
              </div>

              {(student.level_name || student.level) && (
                <div className="info-item">
                  <div className="info-label">
                    <span>📊</span>
                    <span>Nível</span>
                  </div>
                  <div className="info-value">{student.level_name || student.level}</div>
                </div>
              )}

              {student.responsible_name && (
                <div className="info-item">
                  <div className="info-label">
                    <span>👤</span>
                    <span>Responsável</span>
                  </div>
                  <div className="info-value">{student.responsible_name}</div>
                </div>
              )}

              {student.address && (
                <div className="info-item full-width">
                  <div className="info-label">
                    <span>📍</span>
                    <span>Endereço</span>
                  </div>
                  <div className="info-value">{student.address}</div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
