import { useState, useEffect } from 'react';
import { instructorService } from '../services/instructorService';
import { classService } from '../services/classService';
import type { Instructor, InstructorPermissions, CreateInstructorRequest, InstructorClass } from '../types/instructorTypes';
import type { Class } from '../types/classTypes';
import toast from 'react-hot-toast';
import '../styles/Instructors.css';

export default function Instructors() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showClassesModal, setShowClassesModal] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
  const [availablePermissions, setAvailablePermissions] = useState<Record<string, string>>({});

  // Form states
  const [formData, setFormData] = useState<CreateInstructorRequest>({
    full_name: '',
    email: '',
    permissions: {},
    send_email: true,
  });

  const [tempPermissions, setTempPermissions] = useState<InstructorPermissions>({});

  useEffect(() => {
    fetchInstructors();
    fetchAvailablePermissions();
    fetchClasses();
  }, []);

  const fetchInstructors = async () => {
    try {
      setIsLoading(true);
      const response = await instructorService.getInstructors();
      // Suporta ambos formatos: { success: true } e { status: 'success' }
      const isSuccess = (response as any).status === 'success' || (response as any).success === true;
      if (isSuccess && response.data) {
        setInstructors(response.data);
      }
    } catch (error: any) {
      console.error('Erro ao buscar instrutores:', error);
      toast.error(error.response?.data?.message || 'Erro ao carregar instrutores');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailablePermissions = async () => {
    try {
      const response = await instructorService.getAvailablePermissions();
      // Suporta ambos formatos: { success: true } e { status: 'success' }
      const isSuccess = (response as any).status === 'success' || (response as any).success === true;
      if (isSuccess && response.data) {
        setAvailablePermissions(response.data);
      }
    } catch (error) {
      console.error('Erro ao buscar permissões:', error);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await classService.getClasses({ status: 'ativa' });
      console.log('Resposta da API de turmas:', response); // Debug
      if (((response as any).status === 'success' || (response as any).success === true) && response.data) {
        console.log('Turmas carregadas:', response.data);
        setClasses(response.data);
      }
    } catch (error) {
      console.error('Erro ao buscar turmas:', error);
      toast.error('Erro ao carregar turmas');
    }
  };

  const handleCreateInstructor = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.full_name || !formData.email) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const response = await instructorService.createInstructor(formData);
      // Suporta ambos formatos: { success: true } e { status: 'success' }
      const isSuccess = (response as any).status === 'success' || (response as any).success === true;
      if (isSuccess) {
        toast.success('Instrutor criado com sucesso!');
        setShowCreateModal(false);
        setFormData({
          full_name: '',
          email: '',
          permissions: {},
          send_email: true,
        });
        fetchInstructors();
      }
    } catch (error: any) {
      console.error('Erro ao criar instrutor:', error);
      toast.error(error.response?.data?.message || 'Erro ao criar instrutor');
    }
  };

  const handleUpdatePermissions = async () => {
    if (!selectedInstructor) return;

    try {
      const response = await instructorService.updateInstructorPermissions(
        selectedInstructor.id,
        { permissions: tempPermissions }
      );
      // Suporta ambos formatos: { success: true } e { status: 'success' }
      const isSuccess = (response as any).status === 'success' || (response as any).success === true;
      if (isSuccess) {
        toast.success('Permissões atualizadas com sucesso!');
        setShowPermissionsModal(false);
        fetchInstructors();
      }
    } catch (error: any) {
      console.error('Erro ao atualizar permissões:', error);
      toast.error(error.response?.data?.message || 'Erro ao atualizar permissões');
    }
  };

  const handleRemoveInstructor = async (instructor: Instructor) => {
    if (!confirm(`Tem certeza que deseja remover o instrutor "${instructor.full_name}"? Isso removerá todas as atribuições de turmas.`)) {
      return;
    }

    try {
      await instructorService.removeInstructor(instructor.id);
      toast.success('Instrutor removido com sucesso!');
      fetchInstructors();
    } catch (error: any) {
      console.error('Erro ao remover instrutor:', error);
      toast.error(error.response?.data?.message || 'Erro ao remover instrutor');
    }
  };

  const openPermissionsModal = (instructor: Instructor) => {
    setSelectedInstructor(instructor);
    setTempPermissions(instructor.permissions || {});
    setShowPermissionsModal(true);
  };

  const openClassesModal = async (instructor: Instructor) => {
    try {
      const response = await instructorService.getInstructorById(instructor.id);
      // Suporta ambos formatos: { success: true } e { status: 'success' }
      const isSuccess = (response as any).status === 'success' || (response as any).success === true;
      if (isSuccess && response.data) {
        setSelectedInstructor(response.data);
        setShowClassesModal(true);
      }
    } catch (error: any) {
      console.error('Erro ao buscar detalhes do instrutor:', error);
      toast.error(error.response?.data?.message || 'Erro ao carregar detalhes');
    }
  };

  const handleAssignClass = async (classId: number) => {
    if (!selectedInstructor) return;

    try {
      await instructorService.assignClass(selectedInstructor.id, { class_id: classId });
      toast.success('Turma atribuída com sucesso!');

      // Refresh instructor details
      const response = await instructorService.getInstructorById(selectedInstructor.id);
      // Suporta ambos formatos: { success: true } e { status: 'success' }
      const isSuccess = (response as any).status === 'success' || (response as any).success === true;
      if (isSuccess && response.data) {
        setSelectedInstructor(response.data);
      }
      fetchInstructors();
    } catch (error: any) {
      console.error('Erro ao atribuir turma:', error);
      toast.error(error.response?.data?.message || 'Erro ao atribuir turma');
    }
  };

  const handleUnassignClass = async (classId: number) => {
    if (!selectedInstructor) return;

    if (!confirm('Tem certeza que deseja remover esta turma do instrutor?')) {
      return;
    }

    try {
      await instructorService.unassignClass(selectedInstructor.id, classId);
      toast.success('Turma removida com sucesso!');

      // Refresh instructor details
      const response = await instructorService.getInstructorById(selectedInstructor.id);
      // Suporta ambos formatos: { success: true } e { status: 'success' }
      const isSuccess = (response as any).status === 'success' || (response as any).success === true;
      if (isSuccess && response.data) {
        setSelectedInstructor(response.data);
      }
      fetchInstructors();
    } catch (error: any) {
      console.error('Erro ao remover turma:', error);
      toast.error(error.response?.data?.message || 'Erro ao remover turma');
    }
  };

  const togglePermission = (key: string) => {
    setTempPermissions(prev => ({
      ...prev,
      [key]: !prev[key as keyof InstructorPermissions]
    }));
  };

  const getWeekdayLabel = (weekday: string) => {
    const labels: Record<string, string> = {
      seg: 'Segunda',
      ter: 'Terça',
      qua: 'Quarta',
      qui: 'Quinta',
      sex: 'Sexta',
      sab: 'Sábado',
      dom: 'Domingo'
    };
    return labels[weekday] || weekday;
  };

  const getAssignedClassIds = () => {
    return selectedInstructor?.classes?.map(c => c.id) || [];
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="instructors-page">
      <div className="page-header">
        <h1>Gerenciar Instrutores</h1>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          + Novo Instrutor
        </button>
      </div>

      <div className="instructors-content">
        <div className="instructors-grid">
          {instructors.map((instructor) => (
            <div key={instructor.id} className="instructor-card">
              <div className="instructor-header">
                <h3>{instructor.full_name}</h3>
                <span className="badge badge-active">
                  {instructor.classes_count || 0} turmas
                </span>
              </div>

              <div className="instructor-email">{instructor.email}</div>

              <div className="instructor-permissions-summary">
                <strong>Permissões ativas:</strong>
                <div className="permissions-count">
                  {Object.values(instructor.permissions || {}).filter(Boolean).length} de {Object.keys(availablePermissions).length}
                </div>
              </div>

              <div className="instructor-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => openPermissionsModal(instructor)}
                >
                  Permissões
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => openClassesModal(instructor)}
                >
                  Turmas
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => handleRemoveInstructor(instructor)}
                >
                  Remover
                </button>
              </div>
            </div>
          ))}

          {instructors.length === 0 && (
            <div className="empty-state">
              <p>Nenhum instrutor cadastrado ainda.</p>
              <p>Clique em "+ Novo Instrutor" para começar.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Instructor Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Novo Instrutor</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateInstructor}>
              <div className="form-group">
                <label htmlFor="full_name">Nome Completo *</label>
                <input
                  id="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.send_email}
                    onChange={(e) => setFormData({ ...formData, send_email: e.target.checked })}
                  />
                  <span style={{ marginLeft: '8px' }}>Enviar email de boas-vindas</span>
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Criar Instrutor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && selectedInstructor && (
        <div className="modal-overlay" onClick={() => setShowPermissionsModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Permissões - {selectedInstructor.full_name}</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowPermissionsModal(false)}
              >
                ×
              </button>
            </div>

            <div className="permissions-list">
              {Object.entries(availablePermissions).map(([key, label]) => (
                <div key={key} className="permission-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={!!tempPermissions[key as keyof InstructorPermissions]}
                      onChange={() => togglePermission(key)}
                    />
                    <span>{label}</span>
                  </label>
                </div>
              ))}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowPermissionsModal(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleUpdatePermissions}
              >
                Salvar Permissões
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Classes Modal */}
      {showClassesModal && selectedInstructor && (
        <div className="modal-overlay" onClick={() => setShowClassesModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Turmas - {selectedInstructor.full_name}</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowClassesModal(false)}
              >
                ×
              </button>
            </div>

            <div className="classes-section">
              <h3>Turmas Atribuídas ({selectedInstructor.classes?.length || 0})</h3>
              <div className="classes-list">
                {selectedInstructor.classes && selectedInstructor.classes.length > 0 ? (
                  selectedInstructor.classes.map((classItem) => (
                    <div key={classItem.id} className="class-item assigned">
                      <div className="class-info">
                        <strong>{classItem.name || classItem.modality_name}</strong>
                        <span>{getWeekdayLabel(classItem.weekday)} - {classItem.start_time}</span>
                        {classItem.location && <span>{classItem.location}</span>}
                      </div>
                      <button
                        type="button"
                        className="btn-danger btn-sm"
                        onClick={() => handleUnassignClass(classItem.id)}
                      >
                        Remover
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="empty-message">Nenhuma turma atribuída ainda.</p>
                )}
              </div>
            </div>

            <div className="classes-section">
              <h3>Atribuir Novas Turmas</h3>
              <div className="classes-list">
                {classes
                  .filter((classItem) => !getAssignedClassIds().includes(classItem.id))
                  .map((classItem) => (
                    <div key={classItem.id} className="class-item available">
                      <div className="class-info">
                        <strong>{classItem.name || classItem.modality_name}</strong>
                        <span>{getWeekdayLabel(classItem.weekday)} - {classItem.start_time}</span>
                        {classItem.location && <span>{classItem.location}</span>}
                      </div>
                      <button
                        type="button"
                        className="btn-primary btn-sm"
                        onClick={() => handleAssignClass(classItem.id)}
                      >
                        Atribuir
                      </button>
                    </div>
                  ))}
                {classes.filter((classItem) => !getAssignedClassIds().includes(classItem.id)).length === 0 && (
                  <p className="empty-message">Todas as turmas já foram atribuídas.</p>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowClassesModal(false)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
