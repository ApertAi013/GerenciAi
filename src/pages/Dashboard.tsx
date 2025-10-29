import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faGripVertical } from '@fortawesome/free-solid-svg-icons';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuthStore } from '../store/authStore';
import { useWidgets } from '../hooks/useWidgets';
import WidgetRenderer from '../components/widgets/WidgetRenderer';
import CustomizationModal from '../components/widgets/CustomizationModal';
import type { Widget } from '../types/widgetTypes';
import '../styles/Dashboard.css';

interface SortableWidgetProps {
  widget: Widget;
}

function SortableWidget({ widget }: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getWidgetHeight = () => {
    switch (widget.size) {
      case 'small': return '250px';
      case 'medium': return '350px';
      case 'large': return '450px';
      default: return '350px';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="widget-container"
    >
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        height: getWidgetHeight(),
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}>
        <div
          {...attributes}
          {...listeners}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            cursor: 'grab',
            color: '#999',
            fontSize: '16px',
            padding: '8px',
            zIndex: 10,
          }}
          title="Arrastar para reordenar"
        >
          <FontAwesomeIcon icon={faGripVertical} />
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <WidgetRenderer type={widget.type} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const { activeWidgets, isLoading, addWidget, removeWidget, reorderWidgets, widgets } = useWidgets();
  const [isCustomizing, setIsCustomizing] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = activeWidgets.findIndex((w) => w.id === active.id);
      const newIndex = activeWidgets.findIndex((w) => w.id === over.id);
      reorderWidgets(oldIndex, newIndex);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header com botão de personalização */}
      <div className="dashboard-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
      }}>
        <div>
          <h1>{getGreeting()}, {user?.full_name?.split(' ')[0]}.</h1>
          <p>Aqui está um resumo do seu sistema hoje.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsCustomizing(true)}
          style={{
            padding: '12px 24px',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#5568d3';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#667eea';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <FontAwesomeIcon icon={faCog} />
          Personalizar
        </button>
      </div>

      {/* Widgets com drag and drop */}
      {activeWidgets.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <h3 style={{ marginBottom: '8px', color: '#333' }}>Nenhum widget adicionado</h3>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            Clique em "Personalizar" para adicionar widgets ao seu dashboard
          </p>
          <button
            type="button"
            onClick={() => setIsCustomizing(true)}
            style={{
              padding: '12px 24px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <FontAwesomeIcon icon={faCog} style={{ marginRight: '8px' }} />
            Adicionar Widgets
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={activeWidgets.map((w) => w.id)}
            strategy={verticalListSortingStrategy}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '20px',
            }}>
              {activeWidgets.map((widget) => (
                <SortableWidget key={widget.id} widget={widget} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Modal de personalização */}
      <CustomizationModal
        isOpen={isCustomizing}
        onClose={() => setIsCustomizing(false)}
        widgets={widgets}
        onAddWidget={addWidget}
        onRemoveWidget={removeWidget}
      />
    </div>
  );
}
