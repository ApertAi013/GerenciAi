// WhatsApp Templates — localStorage-based multi-template system

const STORAGE_KEY = 'gerenciai_whatsapp_templates';

export interface WhatsAppTemplate {
  id: string;
  name: string;
  message: string;
}

export const DEFAULT_MESSAGE = `Olá [Nome], tudo bem?

Passando para lembrar do vencimento da sua mensalidade.

*Pix 48.609.350/0001-86*

Caso não for fazer aulas esse mês, favor nos informar!

Obrigado!`;

let migrated = false;

function migrate(): WhatsAppTemplate[] {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) {
    try {
      const parsed = JSON.parse(existing);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch { /* corrupt, continue migration */ }
  }

  // Read from old keys
  const oldPrefs = localStorage.getItem('whatsapp_payment_template');
  const oldGeneral = localStorage.getItem('gerenciai_whatsapp_template');
  const msg = oldPrefs || oldGeneral || DEFAULT_MESSAGE;

  const templates: WhatsAppTemplate[] = [{
    id: Date.now().toString(36),
    name: 'Cobrança',
    message: msg,
  }];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  localStorage.removeItem('whatsapp_payment_template');
  localStorage.removeItem('gerenciai_whatsapp_template');

  return templates;
}

export function getTemplates(): WhatsAppTemplate[] {
  if (!migrated) {
    migrated = true;
    return migrate();
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch { /* fall through */ }
  }

  // Fallback: create default
  const templates: WhatsAppTemplate[] = [{
    id: Date.now().toString(36),
    name: 'Cobrança',
    message: DEFAULT_MESSAGE,
  }];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  return templates;
}

export function saveTemplates(templates: WhatsAppTemplate[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

export function addTemplate(name: string, message: string): WhatsAppTemplate {
  const templates = getTemplates();
  const newTemplate: WhatsAppTemplate = {
    id: Date.now().toString(36),
    name,
    message,
  };
  templates.push(newTemplate);
  saveTemplates(templates);
  return newTemplate;
}

export function updateTemplate(id: string, updates: Partial<Pick<WhatsAppTemplate, 'name' | 'message'>>): void {
  const templates = getTemplates();
  const idx = templates.findIndex(t => t.id === id);
  if (idx >= 0) {
    if (updates.name !== undefined) templates[idx].name = updates.name;
    if (updates.message !== undefined) templates[idx].message = updates.message;
    saveTemplates(templates);
  }
}

export function deleteTemplate(id: string): boolean {
  const templates = getTemplates();
  if (templates.length <= 1) return false;
  const filtered = templates.filter(t => t.id !== id);
  saveTemplates(filtered);
  return true;
}

export function applyVariables(
  message: string,
  vars: {
    firstName: string;
    fullName: string;
    amount: string;
    dueDate: string;
    referenceMonth: string;
  }
): string {
  return message
    .replace(/\[Nome\]/g, vars.firstName)
    .replace(/\[NomeCompleto\]/g, vars.fullName)
    .replace(/\[Valor\]/g, vars.amount)
    .replace(/\[Vencimento\]/g, vars.dueDate)
    .replace(/\[Referencia\]/g, vars.referenceMonth);
}
