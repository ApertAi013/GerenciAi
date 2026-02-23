import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faSave, faLock, faEnvelope, faIdBadge, faCalendar } from '@fortawesome/free-solid-svg-icons';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import '../styles/Profile.css';

interface ProfileData {
  id: number;
  full_name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

export default function Profile() {
  const { user, setUser } = useAuthStore();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Edit form
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await authService.getProfile();
      if (response.status === 'success') {
        setProfile(response.data);
        setFullName(response.data.full_name);
        setEmail(response.data.email);
      }
    } catch (error) {
      toast.error('Erro ao carregar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    if (!email.trim()) {
      toast.error('Email é obrigatório');
      return;
    }

    setIsSaving(true);
    try {
      const response = await authService.updateProfile({ full_name: fullName.trim(), email: email.trim() });
      if (response.status === 'success') {
        toast.success('Perfil atualizado com sucesso');
        setProfile(response.data);
        // Update store
        if (user) {
          setUser({ ...user, full_name: fullName.trim(), email: email.trim() });
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast.error('Informe a senha atual');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error('Nova senha deve ter no mínimo 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await authService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      if (response.status === 'success') {
        toast.success('Senha alterada com sucesso');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao alterar senha');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'gestor': return 'Gestor';
      case 'instrutor': return 'Instrutor';
      case 'financeiro': return 'Financeiro';
      default: return role;
    }
  };

  if (isLoading) {
    return (
      <div className="profile-container">
        <div className="profile-loading">Carregando perfil...</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header-section">
        <div className="profile-avatar-large">
          {profile?.full_name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div>
          <h1>{profile?.full_name}</h1>
          <p className="profile-role-badge">{getRoleLabel(profile?.role || '')}</p>
        </div>
      </div>

      <div className="profile-grid">
        {/* Edit Profile */}
        <div className="profile-card">
          <h2><FontAwesomeIcon icon={faUser} /> Dados Pessoais</h2>

          <div className="profile-form-group">
            <label>Nome Completo</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Seu nome completo"
            />
          </div>

          <div className="profile-form-group">
            <label><FontAwesomeIcon icon={faEnvelope} /> Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
            />
          </div>

          <div className="profile-readonly-group">
            <div className="readonly-item">
              <FontAwesomeIcon icon={faIdBadge} />
              <span className="readonly-label">Perfil:</span>
              <span>{getRoleLabel(profile?.role || '')}</span>
            </div>
            <div className="readonly-item">
              <FontAwesomeIcon icon={faCalendar} />
              <span className="readonly-label">Membro desde:</span>
              <span>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR') : '-'}</span>
            </div>
          </div>

          <button
            className="profile-save-btn"
            onClick={handleSaveProfile}
            disabled={isSaving}
          >
            <FontAwesomeIcon icon={faSave} />
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>

        {/* Change Password */}
        <div className="profile-card">
          <h2><FontAwesomeIcon icon={faLock} /> Trocar Senha</h2>

          <div className="profile-form-group">
            <label>Senha Atual</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Digite sua senha atual"
            />
          </div>

          <div className="profile-form-group">
            <label>Nova Senha</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div className="profile-form-group">
            <label>Confirmar Nova Senha</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a nova senha"
            />
          </div>

          <button
            className="profile-save-btn"
            onClick={handleChangePassword}
            disabled={isChangingPassword}
          >
            <FontAwesomeIcon icon={faLock} />
            {isChangingPassword ? 'Alterando...' : 'Alterar Senha'}
          </button>
        </div>
      </div>
    </div>
  );
}
