import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faSave, faLock, faEnvelope, faIdBadge, faCalendar, faBuilding, faCamera } from '@fortawesome/free-solid-svg-icons';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import ImageCropModal from '../components/ImageCropModal';
import '../styles/Profile.css';

interface ProfileData {
  id: number;
  full_name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  display_name?: string;
  business_description?: string;
  logo_url?: string;
}

export default function Profile() {
  const { user, setUser } = useAuthStore();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Edit form
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Business profile form
  const [displayName, setDisplayName] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [isSavingBusiness, setIsSavingBusiness] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

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
        setDisplayName(response.data.display_name || '');
        setBusinessDescription(response.data.business_description || '');
        setLogoUrl(response.data.logo_url || '');
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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setCropImageSrc(reader.result as string);
    reader.readAsDataURL(file);
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const handleCroppedImage = async (blob: Blob) => {
    setCropImageSrc(null);
    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('image', new File([blob], 'logo.jpg', { type: 'image/jpeg' }));
      const response = await api.post('/api/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = response.data?.data?.url;
      if (url) {
        setLogoUrl(url);
        const saveResponse = await authService.updateProfile({ logo_url: url });
        if (saveResponse.status === 'success') {
          toast.success('Logo atualizada com sucesso');
          setProfile(saveResponse.data);
          if (user) {
            setUser({ ...user, logo_url: url });
          }
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao enviar imagem');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!window.confirm('Remover a logo?')) return;
    try {
      const response = await authService.updateProfile({ logo_url: '' });
      if (response.status === 'success') {
        setLogoUrl('');
        setProfile(response.data);
        if (user) {
          setUser({ ...user, logo_url: undefined });
        }
        toast.success('Logo removida');
      }
    } catch {
      toast.error('Erro ao remover logo');
    }
  };

  const handleSaveBusiness = async () => {
    setIsSavingBusiness(true);
    try {
      const response = await authService.updateProfile({
        display_name: displayName.trim(),
        business_description: businessDescription.trim(),
      });
      if (response.status === 'success') {
        toast.success('Informações do negócio atualizadas');
        setProfile(response.data);
        if (user) {
          setUser({ ...user, display_name: displayName.trim() || undefined, business_description: businessDescription.trim() || undefined });
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar');
    } finally {
      setIsSavingBusiness(false);
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
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="profile-avatar-large profile-avatar-img" />
        ) : (
          <div className="profile-avatar-large">
            {profile?.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
        )}
        <div>
          <h1>{profile?.display_name || profile?.full_name}</h1>
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

        {/* Business Profile */}
        <div className="profile-card profile-card-business">
          <h2><FontAwesomeIcon icon={faBuilding} /> Meu Negócio</h2>
          <p className="profile-business-hint">
            Estas informações aparecem nos links públicos de agendamento e locação.
          </p>

          <div className="profile-logo-section">
            <div
              className="profile-logo-circle"
              onClick={() => logoInputRef.current?.click()}
              title="Clique para enviar logo"
            >
              {isUploadingLogo ? (
                <div className="profile-logo-spinner" />
              ) : logoUrl ? (
                <img src={logoUrl} alt="Logo" />
              ) : (
                <div className="profile-logo-placeholder">
                  <FontAwesomeIcon icon={faCamera} />
                  <span>Enviar Logo</span>
                </div>
              )}
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: 'none' }}
              onChange={handleLogoUpload}
            />
            {logoUrl && (
              <button className="profile-remove-logo" onClick={handleRemoveLogo}>
                Remover logo
              </button>
            )}
          </div>

          <div className="profile-form-group">
            <label>Nome de Exibição</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ex: Arena Beach Tennis"
            />
            <small className="profile-field-hint">Se vazio, será usado seu nome pessoal</small>
          </div>

          <div className="profile-form-group">
            <label>Descrição</label>
            <textarea
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value.slice(0, 300))}
              placeholder="Breve descrição do seu negócio..."
              rows={3}
            />
            <small className="profile-field-hint">{businessDescription.length}/300 caracteres</small>
          </div>

          <button
            className="profile-save-btn"
            onClick={handleSaveBusiness}
            disabled={isSavingBusiness}
          >
            <FontAwesomeIcon icon={faSave} />
            {isSavingBusiness ? 'Salvando...' : 'Salvar Negócio'}
          </button>
        </div>
      </div>

      {cropImageSrc && (
        <ImageCropModal
          imageSrc={cropImageSrc}
          onCropComplete={handleCroppedImage}
          onClose={() => setCropImageSrc(null)}
          cropShape="round"
          aspect={1}
        />
      )}
    </div>
  );
}
