import type { WidgetType } from '../../types/widgetTypes';
import StatsWidget from './StatsWidget';
import SchedulePreviewWidget from './SchedulePreviewWidget';
import FinancialPreviewWidget from './FinancialPreviewWidget';
import RecentStudentsWidget from './RecentStudentsWidget';
import NotificationsWidget from './NotificationsWidget';

interface WidgetRendererProps {
  type: WidgetType;
}

export default function WidgetRenderer({ type }: WidgetRendererProps) {
  switch (type) {
    case 'stats':
      return <StatsWidget />;
    case 'schedule-preview':
      return <SchedulePreviewWidget />;
    case 'financial-preview':
      return <FinancialPreviewWidget />;
    case 'recent-students':
      return <RecentStudentsWidget />;
    case 'notifications':
      return <NotificationsWidget />;
    case 'upcoming-classes':
      // TODO: Implement upcoming classes widget
      return <div style={{ padding: '20px', textAlign: 'center' }}>Em desenvolvimento</div>;
    case 'overdue-invoices':
      // TODO: Implement overdue invoices widget
      return <div style={{ padding: '20px', textAlign: 'center' }}>Em desenvolvimento</div>;
    default:
      return <div style={{ padding: '20px', textAlign: 'center' }}>Widget não encontrado</div>;
  }
}
