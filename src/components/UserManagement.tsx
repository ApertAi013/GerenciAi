import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faSearch,
  faFilter,
  faToggleOn,
  faToggleOff,
  faSpinner,
  faCheckCircle,
  faTimesCircle,
} from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import { monitoringService } from '../services/monitoringService';
import type { User, Feature } from '../types/monitoringTypes';
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
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('gestor');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [updatingFeature, setUpdatingFeature] = useState<{ userId: number; featureCode: string } | null>(null);

  useEffect(() => {
    loadFeatures();
    loadUsers();
  }, [pagination.page, roleFilter, statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== '') {
        loadUsers();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadFeatures = async () => {
    try {
      const response = await monitoringService.listFeatures();
      if (response.success) {
        setFeatures(response.data);
      }
    } catch (error: any) {
      console.error('Erro ao carregar features:', error);
      toast.error('Erro ao carregar features disponíveis');
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params: UsersListParams = {
        page: pagination.page,
        limit: pagination.limit,
        role: roleFilter,
        status: statusFilter,
      };

      if (searchTerm.trim()) {
        params.search = searchTerm;
      }

      const response = await monitoringService.listUsers(params);
      if (response.success) {
        setUsers(response.data.users);
        setPagination(response.data.pagination);
      }
    } catch (error: any) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar lista de usuários');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserFeature = async (userId: number, featureCode: string, currentlyEnabled: boolean) => {
    setUpdatingFeature({ userId, featureCode });

    try {
      // Get current user features
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const currentFeatures = user.premium_features || [];
      let updatedFeatures: string[];

      if (currentlyEnabled) {
        // Remove feature
        updatedFeatures = currentFeatures.filter(f => f !== featureCode);
      } else {
        // Add feature
        updatedFeatures = [...currentFeatures, featureCode];
      }

      const response = await monitoringService.updateUserFeatures(userId, {
        features: updatedFeatures,
      });

      if (response.success) {
        // Update local state
        setUsers(users.map(u =>
          u.id === userId
            ? { ...u, premium_features: updatedFeatures, hasPremium: updatedFeatures.length > 0 }
            : u
        ));

        toast.success(
          currentlyEnabled
            ? `Feature "${featureCode}" desabilitada para ${user.full_name}`
            : `Feature "${featureCode}" habilitada para ${user.full_name}`
        );
      }
    } catch (error: any) {
      console.error('Erro ao atualizar features:', error);
      toast.error('Erro ao atualizar features do usuário');
    } finally {
      setUpdatingFeature(null);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleSearch = () => {
    setPagination({ ...pagination, page: 1 });
    loadUsers();
  };

  const clearSearch = () => {
    setSearchTerm('');
    setPagination({ ...pagination, page: 1 });
    loadUsers();
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
            <FontAwesomeIcon icon={faUsers} /> Gerenciar Features Premium
          </h2>
          <p>Habilite ou desabilite features premium para seus usuários</p>
        </div>
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
              <div className="user-info">
                <div className="user-header">
                  <h3>{user.full_name}</h3>
                  <div className="user-badges">
                    <span className={`role-badge ${user.role}`}>{user.role}</span>
                    <span className={`status-badge ${user.status}`}>
                      {user.status === 'active' ? '● Ativo' : '○ Inativo'}
                    </span>
                    {user.hasPremium && (
                      <span className="premium-badge">
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

              <div className="features-section">
                <h4>Features Premium</h4>
                <div className="features-grid">
                  {features.map(feature => {
                    const isEnabled = user.premium_features?.includes(feature.feature_code) || false;
                    const isUpdating = updatingFeature?.userId === user.id &&
                                      updatingFeature?.featureCode === feature.feature_code;

                    return (
                      <div key={feature.feature_code} className="feature-toggle-item">
                        <div className="feature-info">
                          <span className="feature-name">{feature.feature_name}</span>
                          <span className="feature-desc">{feature.description}</span>
                        </div>
                        <button
                          className={`toggle-button ${isEnabled ? 'enabled' : 'disabled'}`}
                          onClick={() => toggleUserFeature(user.id, feature.feature_code, isEnabled)}
                          disabled={isUpdating}
                          title={isEnabled ? 'Clique para desabilitar' : 'Clique para habilitar'}
                        >
                          {isUpdating ? (
                            <FontAwesomeIcon icon={faSpinner} spin />
                          ) : (
                            <FontAwesomeIcon icon={isEnabled ? faToggleOn : faToggleOff} size="lg" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            ← Anterior
          </button>
          <span>
            Página {pagination.page} de {pagination.totalPages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
          >
            Próxima →
          </button>
        </div>
      )}

      {/* Summary */}
      <div className="summary-footer">
        <p>
          Mostrando {users.length} de {pagination.total} usuários
        </p>
      </div>
    </div>
  );
}
