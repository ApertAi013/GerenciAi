# Instruções para Implementar CRUD de Usuários no Frontend

## ✅ Backend Pronto!

O backend já foi implementado e deployado com sucesso (revision gerenciai-backend-00165-xt8).

### Endpoints Disponíveis:

#### 1. Criar Usuário
```
POST /api/admin/monitoring/users
Headers: { Authorization: Bearer <token> }
Body: {
  "full_name": "Nome Completo",
  "email": "email@exemplo.com",
  "password": "senha123",
  "role": "gestor",              // opcional: 'admin', 'gestor', 'instrutor', 'financeiro'
  "status": "active",             // opcional: 'active' ou 'inactive'
  "premium_features": []          // opcional: array de features com :unlimited
}
```

#### 2. Atualizar Usuário
```
PUT /api/admin/monitoring/users/:userId
Headers: { Authorization: Bearer <token> }
Body: {
  "full_name": "Novo Nome",      // opcional
  "email": "novo@email.com",     // opcional
  "password": "novaSenha123",    // opcional
  "role": "gestor",              // opcional
  "status": "active"             // opcional
}
```

#### 3. Deletar Usuário
```
DELETE /api/admin/monitoring/users/:userId
Headers: { Authorization: Bearer <token> }
```

#### 4. Listar Usuários (já existia)
```
GET /api/admin/monitoring/users/list?page=1&limit=20&role=gestor&status=active&search=thiago
```

#### 5. Detalhes do Usuário (já existia)
```
GET /api/admin/monitoring/users/:userId
```

---

## 📝 Implementação Frontend

### Passo 1: Adicionar Métodos ao monitoringService

Abra `/Users/mateuscoelho/GerenciAi/src/services/monitoringService.ts`

Adicione os seguintes métodos:

```typescript
// Criar novo usuário
createUser: async (userData: {
  full_name: string;
  email: string;
  password: string;
  role?: 'admin' | 'gestor' | 'instrutor' | 'financeiro';
  status?: 'active' | 'inactive';
  premium_features?: string[];
}) => {
  const response = await axios.post(
    `${API_BASE_URL}/api/admin/monitoring/users`,
    userData,
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    }
  );
  return response.data;
},

// Atualizar usuário
updateUser: async (userId: number, userData: {
  full_name?: string;
  email?: string;
  password?: string;
  role?: 'admin' | 'gestor' | 'instrutor' | 'financeiro';
  status?: 'active' | 'inactive';
}) => {
  const response = await axios.put(
    `${API_BASE_URL}/api/admin/monitoring/users/${userId}`,
    userData,
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    }
  );
  return response.data;
},

// Deletar usuário
deleteUser: async (userId: number) => {
  const response = await axios.delete(
    `${API_BASE_URL}/api/admin/monitoring/users/${userId}`,
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    }
  );
  return response.data;
},
```

---

### Passo 2: Modificar UserManagement.tsx

Abra `/Users/mateuscoelho/GerenciAi/src/components/UserManagement.tsx`

#### 2.1. Adicionar Estados para Modals

```typescript
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
```

#### 2.2. Adicionar Funções de CRUD

```typescript
// Criar usuário
const handleCreateUser = async () => {
  try {
    const response = await monitoringService.createUser(newUserForm);

    if (response.success) {
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
    const response = await monitoringService.updateUser(
      selectedUser.id,
      editUserForm
    );

    if (response.success) {
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

    if (response.success) {
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
```

#### 2.3. Adicionar Botão "Novo Usuário" no Header

Dentro do `<div className="user-management-header">`, adicione:

```tsx
<div className="user-management-header">
  <div>
    <h2>
      <FontAwesomeIcon icon={faUsers} /> Gerenciar Features Premium
    </h2>
    <p>Habilite ou desabilite features premium para seus usuários</p>
  </div>

  {/* ADICIONAR ESTE BOTÃO */}
  <button
    className="create-user-button"
    onClick={() => setShowCreateModal(true)}
  >
    <FontAwesomeIcon icon={faPlus} /> Novo Usuário
  </button>
</div>
```

#### 2.4. Adicionar Botões de Editar/Deletar em Cada User Card

Dentro do `<div className="user-card">`, adicione botões de ação:

```tsx
<div className="user-card">
  <div className="user-info">
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
      {/* Resto do código... */}
    </div>
  </div>
</div>
```

#### 2.5. Criar os Modais

No final do componente, antes do último `</div>`, adicione:

```tsx
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
```

---

### Passo 3: Adicionar Estilos CSS

Abra `/Users/mateuscoelho/GerenciAi/src/styles/UserManagement.css`

Adicione no final:

```css
/* Botão Novo Usuário */
.user-management-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.create-user-button {
  background: #22c55e;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s;
}

.create-user-button:hover {
  background: #16a34a;
}

/* Botões de Ação no User Card */
.user-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.action-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  background: transparent;
}

.edit-btn {
  color: #3b82f6;
}

.edit-btn:hover {
  background: #eff6ff;
}

.delete-btn {
  color: #ef4444;
}

.delete-btn:hover {
  background: #fef2f2;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 32px;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h3 {
  margin-bottom: 24px;
  color: #171717;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #262626;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  font-size: 14px;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #3b82f6;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.btn-cancel {
  padding: 10px 20px;
  background: #f5f5f5;
  color: #262626;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.btn-cancel:hover {
  background: #e5e5e5;
}

.btn-primary {
  padding: 10px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-primary:disabled {
  background: #93c5fd;
  cursor: not-allowed;
}

.btn-danger {
  padding: 10px 20px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.btn-danger:hover {
  background: #dc2626;
}

.modal-delete .warning-text {
  color: #dc2626;
  font-size: 14px;
  margin-top: 12px;
}
```

---

### Passo 4: Adicionar Ícones no Import

No topo do `UserManagement.tsx`, adicione os novos ícones:

```typescript
import {
  faUsers,
  faSearch,
  faFilter,
  faSpinner,
  faCheckCircle,
  faTimesCircle,
  faPlus,      // ADICIONAR
  faEdit,      // ADICIONAR
  faTrash,     // ADICIONAR
} from '@fortawesome/free-solid-svg-icons';
```

---

## 🎯 Resultado Final

Com essas mudanças, você terá:

1. ✅ Botão "Novo Usuário" no header
2. ✅ Modal para criar novos usuários (gestores, instrutores, etc.)
3. ✅ Botões de editar/deletar em cada card de usuário
4. ✅ Modal para editar dados do usuário
5. ✅ Modal de confirmação para deletar usuário
6. ✅ Integração completa com o backend

---

## 🚀 Como Testar

1. Faça as alterações acima no frontend
2. Rode `npm run build`
3. Faça commit e push para o GitHub
4. Aguarde o deploy automático (~2 minutos)
5. Acesse o Gerenciador como admin
6. Clique em "Novo Usuário"
7. Crie um gestor de teste
8. Teste editar e deletar

---

## 📋 Checklist

- [ ] Adicionar métodos no monitoringService.ts
- [ ] Adicionar estados dos modais em UserManagement.tsx
- [ ] Adicionar funções handleCreateUser, handleEditUser, handleDeleteUser
- [ ] Adicionar botão "Novo Usuário" no header
- [ ] Adicionar botões editar/deletar nos cards
- [ ] Adicionar os 3 modais (criar, editar, deletar)
- [ ] Adicionar estilos CSS
- [ ] Adicionar ícones no import
- [ ] Build, commit e push
- [ ] Testar no ambiente de produção

---

**Qualquer dúvida, me chame que eu te ajudo!** 🚀
