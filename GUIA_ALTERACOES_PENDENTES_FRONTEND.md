# Guia de Alterações Pendentes - Frontend

## ✅ Concluído

### 1. Níveis de Alunos
- ✅ Removidos níveis legados da listagem
- ✅ Níveis fixos implementados: Iniciante, Intermediário, Avançado
- ✅ Edição de níveis funcionando corretamente
- **Arquivo**: `src/pages/Students.tsx`

### 2. Erro de Aluno Já Cadastrado
- ✅ Já estava funcionando
- ✅ Mensagem de erro do backend é exibida automaticamente
- **Arquivo**: `src/pages/Students.tsx` (linha 544)

### 3. Erro de Modalidade Duplicada
- ✅ Já estava funcionando
- ✅ Mensagem de erro do backend é exibida automaticamente
- **Arquivo**: `src/pages/Modalities.tsx` (linha 187-191)

### 4. Preço de Plano Editável
- ✅ Campo já permite digitação manual
- ✅ Adicionado hint para deixar claro ao usuário
- **Arquivo**: `src/pages/Plans.tsx` (linha 289-291)

## 🔧 Pendente - Necessita Implementação

### 5. Múltiplos Horários ao Criar Turma

**Situação Atual**:
- O formulário permite criar turma com apenas 1 horário
- Campos: `weekday`, `start_time`, `end_time`

**Mudança Necessária**:
Permitir adicionar múltiplos horários para uma mesma turma.

**Implementação Sugerida**:

#### Opção A: Múltiplas Turmas (Mais Simples)
Criar uma turma para cada horário automaticamente:

```typescript
// No CreateClassModal.tsx

const [schedules, setSchedules] = useState([{
  weekday: '' as '' | 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom',
  start_time: '',
  end_time: ''
}]);

const addSchedule = () => {
  setSchedules([...schedules, { weekday: '', start_time: '', end_time: '' }]);
};

const removeSchedule = (index: number) => {
  setSchedules(schedules.filter((_, i) => i !== index));
};

// No submit, criar uma turma para cada horário
for (const schedule of schedules) {
  const payload = {
    modality_id: parseInt(formData.modality_id),
    weekday: schedule.weekday,
    start_time: schedule.start_time,
    end_time: schedule.end_time,
    name: formData.name,
    capacity: parseInt(formData.capacity),
    // ... outros campos
  };
  await classService.createClass(payload);
}
```

#### Opção B: Backend Suportar Múltiplos Horários
Se quiser uma turma com múltiplos horários, precisaria mudar o backend também.

**Arquivo**: `src/components/CreateClassModal.tsx`

---

### 6. Melhorar Seleção de Horário

**Mudança Necessária**:
- Substituir inputs de horário manual por time picker
- Adicionar duração pré-definida (30, 60, 90 minutos)
- Calcular automaticamente `end_time` baseado na duração

**Implementação Sugerida**:

```typescript
// Adicionar campo de duração
const [duration, setDuration] = useState<30 | 60 | 90>(60);

// Calcular end_time automaticamente
const calculateEndTime = (startTime: string, duration: number) => {
  if (!startTime) return '';
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + duration;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
};

// Atualizar end_time quando start_time ou duration mudar
useEffect(() => {
  if (formData.start_time) {
    const newEndTime = calculateEndTime(formData.start_time, duration);
    setFormData(prev => ({ ...prev, end_time: newEndTime }));
  }
}, [formData.start_time, duration]);

// No JSX:
<div className="form-group">
  <label>Duração da Aula</label>
  <div style={{ display: 'flex', gap: '0.5rem' }}>
    {[30, 60, 90].map(mins => (
      <button
        key={mins}
        type="button"
        className={duration === mins ? 'btn-primary' : 'btn-secondary'}
        onClick={() => setDuration(mins as 30 | 60 | 90)}
      >
        {mins} min
      </button>
    ))}
  </div>
</div>
```

**Arquivo**: `src/components/CreateClassModal.tsx`

---

### 7. Criar Turma ao Clicar na Agenda

**Situação Atual**:
A página Schedule.tsx exibe a grade horária mas não permite criar turmas ao clicar.

**Mudança Necessária**:
- Adicionar evento onClick nos slots vazios da agenda
- Abrir modal de criação de turma com horário pré-preenchido

**Implementação Sugerida**:

```typescript
// Em Schedule.tsx

// Adicionar estado para controlar modal
const [showCreateModal, setShowCreateModal] = useState(false);
const [prefilledData, setPrefilledData] = useState<{
  weekday: string;
  start_time: string;
} | null>(null);

// Função para detectar clique em slot vazio
const handleSlotClick = (weekday: string, hour: number) => {
  const startTime = `${String(hour).padStart(2, '0')}:00`;
  setPrefilledData({ weekday, start_time: startTime });
  setShowCreateModal(true);
};

// No render da grade horária, adicionar onClick nos slots vazios
{!hasClassAtTime(weekday, hour) && (
  <div
    className="empty-slot"
    onClick={() => handleSlotClick(weekday, hour)}
    style={{ cursor: 'pointer' }}
    title="Clique para criar turma"
  >
    +
  </div>
)}

// Adicionar o modal
{showCreateModal && (
  <CreateClassModal
    modalities={modalities}
    onClose={() => {
      setShowCreateModal(false);
      setPrefilledData(null);
    }}
    onSuccess={() => {
      setShowCreateModal(false);
      setPrefilledData(null);
      fetchClasses();
    }}
    prefilledData={prefilledData}
  />
)}
```

**E no CreateClassModal.tsx**, aceitar `prefilledData`:

```typescript
interface CreateClassModalProps {
  modalities: Modality[];
  onClose: () => void;
  onSuccess: () => void;
  editClass?: Class;
  prefilledData?: { weekday: string; start_time: string } | null;
}

// No useEffect, preencher com prefilledData se fornecido
useEffect(() => {
  if (prefilledData) {
    setFormData(prev => ({
      ...prev,
      weekday: prefilledData.weekday as any,
      start_time: prefilledData.start_time
    }));
  }
}, [prefilledData]);
```

**Arquivos**:
- `src/pages/Schedule.tsx`
- `src/components/CreateClassModal.tsx`

---

## 📝 Resumo de Prioridades

### Alta Prioridade
1. ✅ Níveis de alunos (CONCLUÍDO)
2. ✅ Erros de duplicação (CONCLUÍDO)
3. ✅ Preço editável (CONCLUÍDO)
4. 🔧 **Múltiplos horários para turmas** (implementar Opção A)

### Média Prioridade
5. 🔧 **Duração pré-definida** (30/60/90 min)
6. 🔧 **Criar turma ao clicar na agenda**

## 🚀 Próximos Passos

### Para Múltiplos Horários (Mais Urgente)
1. Abrir `src/components/CreateClassModal.tsx`
2. Adicionar array de schedules ao estado
3. Criar UI para adicionar/remover horários
4. No submit, criar uma turma para cada horário

### Para Duração Pré-definida
1. No mesmo arquivo, adicionar campo `duration`
2. Adicionar botões de seleção (30/60/90 min)
3. Calcular `end_time` automaticamente

### Para Criar ao Clicar na Agenda
1. Abrir `src/pages/Schedule.tsx`
2. Adicionar estado do modal e dados pré-preenchidos
3. Adicionar onClick nos slots vazios
4. Passar dados para CreateClassModal

## 🔍 Arquivos Principais

- **Students**: `/Users/mateuscoelho/GerenciAi/src/pages/Students.tsx`
- **Plans**: `/Users/mateuscoelho/GerenciAi/src/pages/Plans.tsx`
- **Classes**: `/Users/mateuscoelho/GerenciAi/src/pages/Classes.tsx`
- **CreateClassModal**: `/Users/mateuscoelho/GerenciAi/src/components/CreateClassModal.tsx`
- **Schedule**: `/Users/mateuscoelho/GerenciAi/src/pages/Schedule.tsx`
- **Modalities**: `/Users/mateuscoelho/GerenciAi/src/pages/Modalities.tsx`

## ⚠️ Importante - Executar Migration no Backend

Antes de testar as alterações de níveis de alunos, execute a migration no banco de dados:

```bash
# No diretório do backend
cd /Users/mateuscoelho/Desktop/GerenciAi/backend

# Conectar ao Cloud SQL e executar:
gcloud sql connect gerenciai-mysql --user=root --project gerenciai-476500

# Depois executar o SQL:
USE gerenciai_db;

ALTER TABLE students
ADD COLUMN level ENUM('iniciante', 'intermediario', 'avancado') DEFAULT 'iniciante'
AFTER sex;

ALTER TABLE students ADD INDEX idx_level (level);

UPDATE students SET level = 'iniciante' WHERE level IS NULL;
```

Ou usar o script criado: `backend/add-level-column.js` (se conseguir instalar dependências).
