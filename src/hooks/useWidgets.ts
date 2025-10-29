import { useState, useEffect } from 'react';
import type { Widget, WidgetType, WidgetConfig } from '../types/widgetTypes';

const STORAGE_KEY = 'dashboard_widgets';

// Configurações disponíveis de widgets
export const AVAILABLE_WIDGETS: WidgetConfig[] = [
  {
    type: 'stats',
    title: 'Estatísticas Rápidas',
    description: 'Visão geral de alunos, turmas e receita',
    icon: '📊',
    defaultSize: 'large',
    category: 'stats',
  },
  {
    type: 'schedule-preview',
    title: 'Agenda da Semana',
    description: 'Próximas aulas e horários',
    icon: '📅',
    defaultSize: 'medium',
    category: 'preview',
  },
  {
    type: 'financial-preview',
    title: 'Financeiro',
    description: 'Faturas a receber e inadimplência',
    icon: '💰',
    defaultSize: 'medium',
    category: 'preview',
  },
  {
    type: 'recent-students',
    title: 'Alunos Recentes',
    description: 'Últimos alunos cadastrados',
    icon: '👥',
    defaultSize: 'small',
    category: 'quick-access',
  },
  {
    type: 'upcoming-classes',
    title: 'Próximas Aulas',
    description: 'Aulas de hoje e amanhã',
    icon: '🏐',
    defaultSize: 'small',
    category: 'quick-access',
  },
  {
    type: 'overdue-invoices',
    title: 'Faturas Vencidas',
    description: 'Cobranças em atraso',
    icon: '⚠️',
    defaultSize: 'small',
    category: 'quick-access',
  },
  {
    type: 'notifications',
    title: 'Notificações',
    description: 'Alertas e avisos importantes',
    icon: '🔔',
    defaultSize: 'medium',
    category: 'quick-access',
  },
];

// Widgets padrão para novos usuários
const DEFAULT_WIDGETS: Widget[] = [
  {
    id: 'stats-1',
    type: 'stats',
    title: 'Estatísticas Rápidas',
    enabled: true,
    order: 0,
    size: 'large',
  },
  {
    id: 'schedule-1',
    type: 'schedule-preview',
    title: 'Agenda da Semana',
    enabled: true,
    order: 1,
    size: 'medium',
  },
  {
    id: 'financial-1',
    type: 'financial-preview',
    title: 'Financeiro',
    enabled: true,
    order: 2,
    size: 'medium',
  },
  {
    id: 'notifications-1',
    type: 'notifications',
    title: 'Notificações',
    enabled: true,
    order: 3,
    size: 'medium',
  },
];

export function useWidgets() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar widgets do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setWidgets(JSON.parse(stored));
      } else {
        setWidgets(DEFAULT_WIDGETS);
      }
    } catch (error) {
      console.error('Erro ao carregar widgets:', error);
      setWidgets(DEFAULT_WIDGETS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Salvar widgets no localStorage
  const saveWidgets = (newWidgets: Widget[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newWidgets));
      setWidgets(newWidgets);
    } catch (error) {
      console.error('Erro ao salvar widgets:', error);
    }
  };

  // Adicionar widget
  const addWidget = (type: WidgetType) => {
    const config = AVAILABLE_WIDGETS.find((w) => w.type === type);
    if (!config) return;

    const newWidget: Widget = {
      id: `${type}-${Date.now()}`,
      type,
      title: config.title,
      enabled: true,
      order: widgets.length,
      size: config.defaultSize,
    };

    saveWidgets([...widgets, newWidget]);
  };

  // Remover widget
  const removeWidget = (id: string) => {
    const updatedWidgets = widgets
      .filter((w) => w.id !== id)
      .map((w, index) => ({ ...w, order: index }));
    saveWidgets(updatedWidgets);
  };

  // Alternar visibilidade do widget
  const toggleWidget = (id: string) => {
    const updatedWidgets = widgets.map((w) =>
      w.id === id ? { ...w, enabled: !w.enabled } : w
    );
    saveWidgets(updatedWidgets);
  };

  // Reordenar widgets
  const reorderWidgets = (startIndex: number, endIndex: number) => {
    const result = Array.from(widgets);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    const reordered = result.map((w, index) => ({ ...w, order: index }));
    saveWidgets(reordered);
  };

  // Resetar para configuração padrão
  const resetToDefault = () => {
    saveWidgets(DEFAULT_WIDGETS);
  };

  // Obter widgets ativos e ordenados
  const activeWidgets = widgets
    .filter((w) => w.enabled)
    .sort((a, b) => a.order - b.order);

  return {
    widgets,
    activeWidgets,
    isLoading,
    addWidget,
    removeWidget,
    toggleWidget,
    reorderWidgets,
    resetToDefault,
  };
}
