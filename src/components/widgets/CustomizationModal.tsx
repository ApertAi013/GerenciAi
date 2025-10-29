import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPlus, faCheck } from '@fortawesome/free-solid-svg-icons';
import { AVAILABLE_WIDGETS } from '../../hooks/useWidgets';
import type { WidgetType, Widget } from '../../types/widgetTypes';

interface CustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  widgets: Widget[];
  onAddWidget: (type: WidgetType) => void;
  onRemoveWidget: (id: string) => void;
}

export default function CustomizationModal({
  isOpen,
  onClose,
  widgets,
  onAddWidget,
  onRemoveWidget,
}: CustomizationModalProps) {
  if (!isOpen) return null;

  const isWidgetActive = (type: WidgetType) => {
    return widgets.some((w) => w.type === type && w.enabled);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'stats': return '#667eea';
      case 'preview': return '#38f9d7';
      case 'quick-access': return '#f5576c';
      default: return '#999';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'stats': return 'Estatísticas';
      case 'preview': return 'Prévias';
      case 'quick-access': return 'Acesso Rápido';
      default: return category;
    }
  };

  const groupedWidgets = AVAILABLE_WIDGETS.reduce((acc, widget) => {
    if (!acc[widget.category]) {
      acc[widget.category] = [];
    }
    acc[widget.category].push(widget);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_WIDGETS>);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          maxWidth: '800px',
          width: '100%',
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '2px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>
            Personalizar Dashboard
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <p style={{ marginTop: 0, marginBottom: '24px', color: '#666' }}>
            Escolha os widgets que deseja exibir no seu dashboard. Você pode reorganizá-los arrastando.
          </p>

          {Object.entries(groupedWidgets).map(([category, categoryWidgets]) => (
            <div key={category} style={{ marginBottom: '32px' }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: 700,
                color: getCategoryColor(category),
                marginBottom: '16px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                {getCategoryLabel(category)}
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '16px',
              }}>
                {categoryWidgets.map((widget) => {
                  const active = isWidgetActive(widget.type);
                  const activeWidget = widgets.find((w) => w.type === widget.type);

                  return (
                    <div
                      key={widget.type}
                      style={{
                        padding: '16px',
                        border: active ? `2px solid ${getCategoryColor(category)}` : '2px solid #e0e0e0',
                        borderRadius: '12px',
                        background: active ? '#f8f9ff' : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onClick={() => {
                        if (active && activeWidget) {
                          onRemoveWidget(activeWidget.id);
                        } else {
                          onAddWidget(widget.type);
                        }
                      }}
                      onMouseEnter={(e) => {
                        if (!active) {
                          e.currentTarget.style.borderColor = '#999';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          e.currentTarget.style.borderColor = '#e0e0e0';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                        <div style={{ fontSize: '32px' }}>{widget.icon}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontWeight: 600,
                            fontSize: '15px',
                            marginBottom: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}>
                            {widget.title}
                            {active && (
                              <FontAwesomeIcon
                                icon={faCheck}
                                style={{ color: getCategoryColor(category), fontSize: '16px' }}
                              />
                            )}
                          </div>
                          <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                            {widget.description}
                          </div>
                          <div style={{
                            fontSize: '11px',
                            color: getCategoryColor(category),
                            fontWeight: 600,
                            textTransform: 'uppercase',
                          }}>
                            {widget.defaultSize === 'large' && 'Grande'}
                            {widget.defaultSize === 'medium' && 'Médio'}
                            {widget.defaultSize === 'small' && 'Pequeno'}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        style={{
                          width: '100%',
                          marginTop: '12px',
                          padding: '8px',
                          border: 'none',
                          borderRadius: '6px',
                          background: active ? getCategoryColor(category) : '#f0f0f0',
                          color: active ? 'white' : '#666',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (active && activeWidget) {
                            onRemoveWidget(activeWidget.id);
                          } else {
                            onAddWidget(widget.type);
                          }
                        }}
                      >
                        <FontAwesomeIcon icon={active ? faTimes : faPlus} style={{ marginRight: '6px' }} />
                        {active ? 'Remover' : 'Adicionar'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px 24px',
          borderTop: '2px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'flex-end',
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '12px 24px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#5568d3';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#667eea';
            }}
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}
