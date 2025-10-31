export type WidgetType =
  | 'stats'
  | 'schedule-preview'
  | 'financial-preview'
  | 'recent-students'
  | 'upcoming-classes'
  | 'overdue-invoices'
  | 'notifications'
  | 'ai-suggestions'
  | 'ai-stats';

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  enabled: boolean;
  order: number;
  size: 'small' | 'medium' | 'large';
}

export interface WidgetConfig {
  type: WidgetType;
  title: string;
  description: string;
  icon: string;
  defaultSize: 'small' | 'medium' | 'large';
  category: 'stats' | 'preview' | 'quick-access';
}
