import { create } from 'zustand';

interface QuickEditState {
  isOpen: boolean;
  studentId: number | null;
  openQuickEdit: (studentId: number) => void;
  closeQuickEdit: () => void;
}

export const useQuickEditStore = create<QuickEditState>((set) => ({
  isOpen: false,
  studentId: null,
  openQuickEdit: (studentId) => set({ isOpen: true, studentId }),
  closeQuickEdit: () => set({ isOpen: false, studentId: null }),
}));
