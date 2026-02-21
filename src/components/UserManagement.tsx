import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faSearch,
  faFilter,
  faSpinner,
  faCheckCircle,
  faPlus,
  faEdit,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import { monitoringService } from '../services/monitoringService';
import type { User } from '../types/monitoringTypes';
import '../styles/UserManagement.css';

interface UsersListParams {
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
  search?: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('gestor');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const limit = 20;

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states para criação
  const [newUserForm, setNewUserForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'gestor' as 'admin' | 'gestor' | 'instrutor' | 'financeiro',
    status: 'active' as 'active' | 'inactive',
  });

  // Form states para edição
  const [editUserForm, setEditUserForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'gestor' as 'admin' | 'gestor' | 'instrutor' | 'financeiro',
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    loadUsers();
  }, [page, roleFilter, statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== '') {
        setPage(1);
        loadUsers();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params: UsersListParams = {
        page,
        limit,
        role: roleFilter,
        status: statusFilter,
      };

      if (searchTerm.trim()) {
        params.search = searchTerm;
      }

      const response = await monitoringService.listUsers(params);
      if ((response as any).status === 'success' || (response as any).success === true) {
        setUsers(response.data.users);
        setTotalUsers(response.data.pagination.total);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error: any) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar lista de usuários');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSearch = () => {
    setPage(1);
    loadUsers();
  };

  const clearSearch = () => {
    setSearchTerm('');
    setPage(1);
    loadUsers();
  };

  // ==================== CRUD FUNCTIONS ====================

  // Criar usuário
  const handleCreateUser = async () => {
    try {
      const response = await monitoringService.createUser(newUserForm);

      if ((response as any).status === 'success' || (response as any).success === true) {
        toast.success('Usuário criado com sucesso!');
        setShowCreateModal(false);
        setNewUserForm({
          full_name: '',
          email: '',
          password: '',
          role: 'gestor',
          status: 'active',
        });
        loadUsers(); // Recarregar lista
      } else {
        toast.error(response.message || 'Erro ao criar usuário');
      }
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      toast.error(error.response?.data?.message || 'Erro ao criar usuário');
    }
  };

  // Editar usuário
  const handleEditUser = async () => {
    if (!selectedUser) return;

    try {
      const updateData: any = {};

      if (editUserForm.full_name) updateData.full_name = editUserForm.full_name;
      if (editUserForm.email) updateData.email = editUserForm.email;
      if (editUserForm.password) updateData.password = editUserForm.password;
      if (editUserForm.role) updateData.role = editUserForm.role;
      if (editUserForm.status) updateData.status = editUserForm.status;

      const response = await monitoringService.updateUser(selectedUser.id, updateData);

      if ((response as any).status === 'success' || (response as any).success === true) {
        toast.success('Usuário atualizado com sucesso!');
        setShowEditModal(false);
        setSelectedUser(null);
        loadUsers(); // Recarregar lista
      } else {
        toast.error(response.message || 'Erro ao atualizar usuário');
      }
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      toast.error(error.response?.data?.message || 'Erro ao atualizar usuário');
    }
  };

  // Deletar usuário
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await monitoringService.deleteUser(selectedUser.id);

      if ((response as any).status === 'success' || (response as any).success === true) {
        toast.success('Usuário deletado com sucesso!');
        setShowDeleteModal(false);
        setSelectedUser(null);
        loadUsers(); // Recarregar lista
      } else {
        toast.error(response.message || 'Erro ao deletar usuário');
      }
    } catch (error: any) {
      console.error('Erro ao deletar usuário:', error);
      toast.error(error.response?.data?.message || 'Erro ao deletar usuário');
    }
  };

  // Abrir modal de edição
  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditUserForm({
      full_name: user.full_name,
      email: user.email,
      password: '', // Deixar vazio, só atualiza se preencher
      role: user.role,
      status: user.status,
    });
    setShowEditModal(true);
  };

  // Abrir modal de delete
  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  if (loading && users.length === 0) {
    return (
      <div className="user-management-container">
        <div className="loading-state">
          <FontAwesomeIcon icon={faSpinner} spin size="2x" />
          <p>Carregando usuários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management-container">
      {/* Header */}
      <div className="user-management-header">
        <div>
          <h2>
            <FontAwesomeIcon icon={faUsers} /> Gerenciar Usuários
          </h2>
          <p>Criar, editar e gerenciar usuários do sistema</p>
        </div>

        <button
          className="create-user-button"
          onClick={() => setShowCreateModal(true)}
        >
          <FontAwesomeIcon icon={faPlus} /> Novo Usuário
        </button>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <FontAwesomeIcon icon={faSearch} />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          {searchTerm && (
            <button className="clear-search" onClick={clearSearch}>
              ✕
            </button>
          )}
        </div>

        <div className="filter-group">
          <FontAwesomeIcon icon={faFilter} />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">Todas as Roles</option>
            <option value="gestor">Gestor</option>
            <option value="professor">Professor</option>
            <option value="aluno">Aluno</option>
            <option value="admin">Admin</option>
          </select>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Todos os Status</option>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>
        </div>
      </div>

      {/* Users List */}
      <div className="users-list">
        {users.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum usuário encontrado</p>
          </div>
        ) : (
          users.map(user => (
            <div key={user.id} className="user-card">
              <div className="user-info-management">
                <div className="user-header">
                  <h3>{user.full_name}</h3>
                  <div className="user-actions">
                    <button
                      className="action-btn edit-btn"
                      onClick={() => openEditModal(user)}
                      title="Editar usuário"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => openDeleteModal(user)}
                      title="Deletar usuário"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                  <div className="user-badges">
                    <span className={`role-badge ${user.role}`}>{user.role}</span>
                    <span className={`status-badge ${user.status}`}>
                      {user.status === 'active' ? '● Ativo' : '○ Inativo'}
                    </span>
                    {user.hasPremium && (
                      <span className="user-has-premium-badge">
                        <FontAwesomeIcon icon={faCheckCircle} /> Premium
                      </span>
                    )}
                  </div>
                </div>
                <p className="user-email">{user.email}</p>
                <p className="user-date">
                  Cadastrado em: {new Date(user.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>

              {user.hasPremium && user.premium_features && user.premium_features.length > 0 && (
                <div className="features-section">
                  <h4>Features Ativas</h4>
                  <div className="features-grid">
                    {user.premium_features.map((f: string) => (
                      <span key={f} className="user-has-premium-badge" style={{ marginRight: '0.35rem' }}>
                        <FontAwesomeIcon icon={faCheckCircle} /> {f.replace(':unlimited', '')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
          >
            ← Anterior
          </button>
          <span>
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
          >
            Próxima →
          </button>
        </div>
      )}

      {/* Summary */}
      <div className="summary-footer">
        <p>
          Mostrando {users.length} de {totalUsers} usuários
        </p>
      </div>

      {/* ==================== MODALS ==================== */}

      {/* Modal de Criar Usuário */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Criar Novo Usuário</h3>

            <div className="form-group">
              <label>Nome Completo *</label>
              <input
                type="text"
                value={newUserForm.full_name}
                onChange={(e) => setNewUserForm({ ...newUserForm, full_name: e.target.value })}
                placeholder="Nome completo do usuário"
              />
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="form-group">
              <label>Senha *</label>
              <input
                type="password"
                value={newUserForm.password}
                onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                placeholder="Senha do usuário"
              />
            </div>

            <div className="form-group">
              <label>Tipo de Usuário</label>
              <select
                value={newUserForm.role}
                onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as any })}
              >
                <option value="gestor">Gestor</option>
                <option value="instrutor">Instrutor</option>
                <option value="financeiro">Financeiro</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                value={newUserForm.status}
                onChange={(e) => setNewUserForm({ ...newUserForm, status: e.target.value as any })}
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>

            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowCreateModal(false)}
              >
                Cancelar
              </button>
              <button
                className="btn-primary"
                onClick={handleCreateUser}
                disabled={!newUserForm.full_name || !newUserForm.email || !newUserForm.password}
              >
                Criar Usuário
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Editar Usuário */}
      {showEditModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Editar Usuário: {selectedUser.full_name}</h3>

            <div className="form-group">
              <label>Nome Completo</label>
              <input
                type="text"
                value={editUserForm.full_name}
                onChange={(e) => setEditUserForm({ ...editUserForm, full_name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={editUserForm.email}
                onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Nova Senha (deixe vazio para não alterar)</label>
              <input
                type="password"
                value={editUserForm.password}
                onChange={(e) => setEditUserForm({ ...editUserForm, password: e.target.value })}
                placeholder="Deixe vazio para manter a senha atual"
              />
            </div>

            <div className="form-group">
              <label>Tipo de Usuário</label>
              <select
                value={editUserForm.role}
                onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value as any })}
              >
                <option value="gestor">Gestor</option>
                <option value="instrutor">Instrutor</option>
                <option value="financeiro">Financeiro</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                value={editUserForm.status}
                onChange={(e) => setEditUserForm({ ...editUserForm, status: e.target.value as any })}
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowEditModal(false)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleEditUser}>
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Deletar Usuário */}
      {showDeleteModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content modal-delete" onClick={(e) => e.stopPropagation()}>
            <h3>⚠️ Confirmar Exclusão</h3>

            <p>
              Tem certeza que deseja deletar o usuário <strong>{selectedUser.full_name}</strong>?
            </p>
            <p className="warning-text">
              Esta ação não pode ser desfeita. Todos os dados associados a este usuário serão permanentemente deletados.
            </p>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowDeleteModal(false)}>
                Cancelar
              </button>
              <button className="btn-danger" onClick={handleDeleteUser}>
                Deletar Usuário
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
