# Feature Flags - Sistema de Controle de Funcionalidades

Este documento descreve como o sistema de feature flags funciona no GerenciAi e como configurar novas features.

## 🎯 Visão Geral

O sistema de feature flags permite habilitar ou desabilitar funcionalidades específicas do sistema de forma granular, controlando o acesso por usuário.

## 🔧 Como Funciona

### Frontend
- **Hook `useFeatureAccess`**: Verifica se o usuário tem acesso a uma feature específica
- **Componente `FeatureProtectedRoute`**: Protege rotas baseado em feature flags
- **Sidebar**: Oculta itens de menu automaticamente se a feature não estiver ativa

### Backend
A feature flag deve ser configurada no banco de dados com os seguintes campos:
- `feature_code`: Código único da feature (ex: 'data_migration')
- `feature_name`: Nome amigável da feature
- `description`: Descrição da feature
- `is_active`: Se a feature está globalmente ativa ou não
- `free_monthly_limit`: Limite mensal para usuários free (0 = sem acesso)

## 🚀 Configuração da Feature de Migração de Dados

### 1. Adicionar Feature no Backend

Execute o seguinte SQL no banco de dados:

```sql
-- Adicionar a feature de migração de dados
INSERT INTO premium_features (
  feature_code,
  feature_name,
  description,
  free_monthly_limit,
  is_active
) VALUES (
  'data_migration',
  'Migração de Dados',
  'Permite importar dados de sistemas anteriores via CSV',
  0,  -- Usuários free não têm acesso
  false  -- Feature INATIVA por padrão
);
```

### 2. Ativar a Feature (quando pronto para produção)

```sql
-- Ativar a feature globalmente
UPDATE premium_features
SET is_active = true
WHERE feature_code = 'data_migration';
```

### 3. Conceder Acesso a Usuários Específicos

Via API ou SQL:

```sql
-- Conceder acesso ilimitado a um usuário específico
INSERT INTO user_premium_access (
  user_id,
  feature_code,
  is_unlimited
) VALUES (
  1,  -- ID do usuário
  'data_migration',
  true  -- Acesso ilimitado
);
```

Ou via API:
```bash
POST /api/premium-features/admin/grant
{
  "userId": 1,
  "featureCode": "data_migration",
  "isUnlimited": true
}
```

## 📋 Adicionar Novas Features

Para adicionar uma nova feature protegida por flag:

### 1. Backend
Adicione a feature no banco de dados conforme o exemplo acima.

### 2. Frontend

#### No menu (Sidebar.tsx):
```typescript
const menuItems: MenuItem[] = [
  // ... outras rotas
  {
    path: '/nova-rota',
    label: 'Nova Feature',
    icon: faIcon,
    featureCode: 'codigo_da_feature'  // Adicione o feature code
  },
];
```

#### Na rota (App.tsx):
```typescript
<Route
  path="/nova-rota"
  element={
    <FeatureProtectedRoute featureCode="codigo_da_feature">
      <NovoComponente />
    </FeatureProtectedRoute>
  }
/>
```

## 🔍 Verificação Manual

Para verificar se um usuário tem acesso a uma feature:

```typescript
import { useFeatureAccess } from '../hooks/useFeatureAccess';

function MeuComponente() {
  const { hasAccess, isLoading } = useFeatureAccess('data_migration');

  if (isLoading) return <Loading />;
  if (!hasAccess) return <SemAcesso />;

  return <ComponenteProtegido />;
}
```

## 🎨 Estado Atual

### Feature: Data Migration (`data_migration`)
- **Status**: INATIVA (is_active = false)
- **Menu**: Oculto automaticamente quando inativa
- **Rota**: Protegida e redireciona para home se usuário tentar acessar
- **Acesso Free**: Nenhum (free_monthly_limit = 0)

Para ativar:
1. Configure a feature no backend conforme instruções acima
2. Ative a feature (`is_active = true`)
3. Conceda acesso aos usuários desejados
4. O frontend detectará automaticamente e exibirá o menu

## 📝 Notas Importantes

- Features inativas NÃO aparecem no menu, mesmo para admins
- A verificação de acesso combina: `is_active` (feature) + `hasAccess` (usuário)
- Use `isUnlimited = true` para acesso sem limites de uso
- O hook `useFeatureAccess` faz cache para evitar múltiplas requisições
