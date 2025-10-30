import { useState, useEffect } from 'react';
import type { Modality } from '../../types/classTypes';
import '../../styles/FilterDropdown.css';

interface FilterDropdownProps {
  modalities: Modality[];
  selectedModalities: number[];
  selectedLevels: string[];
  onFilterChange: (modalities: number[], levels: string[]) => void;
  onClose: () => void;
}

const LEVELS = [
  { value: 'iniciante', label: 'Iniciante' },
  { value: 'intermediario', label: 'Intermediário' },
  { value: 'avancado', label: 'Avançado' },
  { value: 'todos', label: 'Turmas sem nível' },
];

export default function FilterDropdown({
  modalities,
  selectedModalities,
  selectedLevels,
  onFilterChange,
  onClose,
}: FilterDropdownProps) {
  const [tempModalities, setTempModalities] = useState<number[]>(selectedModalities);
  const [tempLevels, setTempLevels] = useState<string[]>(selectedLevels);

  useEffect(() => {
    setTempModalities(selectedModalities);
    setTempLevels(selectedLevels);
  }, [selectedModalities, selectedLevels]);

  const allModalityIds = modalities.map(m => m.id);
  const allLevelValues = LEVELS.map(l => l.value);
  const allModalitiesSelected = allModalityIds.length > 0 && allModalityIds.every(id => tempModalities.includes(id));
  const allLevelsSelected = allLevelValues.every(val => tempLevels.includes(val));

  const toggleAllModalities = () => {
    if (allModalitiesSelected) {
      setTempModalities([]);
    } else {
      setTempModalities(allModalityIds);
    }
  };

  const toggleAllLevels = () => {
    if (allLevelsSelected) {
      setTempLevels([]);
    } else {
      setTempLevels(allLevelValues);
    }
  };

  const toggleModality = (modalityId: number) => {
    if (tempModalities.includes(modalityId)) {
      setTempModalities(tempModalities.filter(id => id !== modalityId));
    } else {
      setTempModalities([...tempModalities, modalityId]);
    }
  };

  const toggleLevel = (level: string) => {
    if (tempLevels.includes(level)) {
      setTempLevels(tempLevels.filter(l => l !== level));
    } else {
      setTempLevels([...tempLevels, level]);
    }
  };

  const handleApply = () => {
    onFilterChange(tempModalities, tempLevels);
    onClose();
  };

  const handleClear = () => {
    setTempModalities([]);
    setTempLevels([]);
    onFilterChange([], []);
    onClose();
  };

  const hasActiveFilters = tempModalities.length > 0 || tempLevels.length > 0;

  return (
    <div className="filter-dropdown-overlay" onClick={onClose}>
      <div className="filter-dropdown" onClick={(e) => e.stopPropagation()}>
        <div className="filter-dropdown-header">
          <h3>Filtrar Turmas</h3>
          <button type="button" className="filter-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="filter-dropdown-body">
          {/* Modalidades */}
          <div className="filter-section">
            <h4>Modalidade</h4>
            <div className="filter-options">
              <label className="filter-checkbox filter-checkbox-all">
                <input
                  type="checkbox"
                  checked={allModalitiesSelected}
                  onChange={toggleAllModalities}
                />
                <span style={{ fontWeight: 700 }}>Todas as modalidades</span>
              </label>
              <div style={{ height: '1px', background: 'var(--border-light)', margin: 'var(--spacing-xs) 0' }}></div>
              {modalities.map((modality) => (
                <label key={modality.id} className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={tempModalities.includes(modality.id)}
                    onChange={() => toggleModality(modality.id)}
                  />
                  <span>{modality.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Níveis */}
          <div className="filter-section">
            <h4>Nível</h4>
            <div className="filter-options">
              <label className="filter-checkbox filter-checkbox-all">
                <input
                  type="checkbox"
                  checked={allLevelsSelected}
                  onChange={toggleAllLevels}
                />
                <span style={{ fontWeight: 700 }}>Todos os níveis</span>
              </label>
              <div style={{ height: '1px', background: 'var(--border-light)', margin: 'var(--spacing-xs) 0' }}></div>
              {LEVELS.map((level) => (
                <label key={level.value} className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={tempLevels.includes(level.value)}
                    onChange={() => toggleLevel(level.value)}
                  />
                  <span>{level.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="filter-dropdown-footer">
          <button
            type="button"
            className="filter-btn filter-btn-clear"
            onClick={handleClear}
            disabled={!hasActiveFilters}
          >
            Limpar Filtros
          </button>
          <button
            type="button"
            className="filter-btn filter-btn-apply"
            onClick={handleApply}
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}
