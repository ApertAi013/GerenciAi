# Quick Reference - GerenciAi Project

## File Locations Summary

### Pages
- Dashboard: `/Users/mateuscoelho/GerenciAi/src/pages/Dashboard.tsx`
- Students: `/Users/mateuscoelho/GerenciAi/src/pages/Students.tsx`
- Classes: `/Users/mateuscoelho/GerenciAi/src/pages/Classes.tsx`
- Login: `/Users/mateuscoelho/GerenciAi/src/pages/Login.tsx`

### Services
- API Config: `/Users/mateuscoelho/GerenciAi/src/services/api.ts`
- Auth Service: `/Users/mateuscoelho/GerenciAi/src/services/authService.ts`
- Student Service: `/Users/mateuscoelho/GerenciAi/src/services/studentService.ts`
- Class Service: `/Users/mateuscoelho/GerenciAi/src/services/classService.ts`

### State Management
- Auth Store: `/Users/mateuscoelho/GerenciAi/src/store/authStore.ts`

### Types
- Auth Types: `/Users/mateuscoelho/GerenciAi/src/types/authTypes.ts`
- Student Types: `/Users/mateuscoelho/GerenciAi/src/types/studentTypes.ts`
- Class Types: `/Users/mateuscoelho/GerenciAi/src/types/classTypes.ts`

### Layout & Components
- Layout: `/Users/mateuscoelho/GerenciAi/src/components/layout/Layout.tsx`
- Sidebar: `/Users/mateuscoelho/GerenciAi/src/components/layout/Sidebar.tsx`
- ProtectedRoute: `/Users/mateuscoelho/GerenciAi/src/components/auth/ProtectedRoute.tsx`

### Styling
- Global: `/Users/mateuscoelho/GerenciAi/src/styles/index.css`
- Dashboard CSS: `/Users/mateuscoelho/GerenciAi/src/styles/Dashboard.css`
- Students CSS: `/Users/mateuscoelho/GerenciAi/src/styles/Students.css`
- Classes CSS: `/Users/mateuscoelho/GerenciAi/src/styles/Classes.css`

### Main App Files
- App Router: `/Users/mateuscoelho/GerenciAi/src/App.tsx`
- Entry Point: `/Users/mateuscoelho/GerenciAi/src/main.tsx`
- Theme Config: `/Users/mateuscoelho/GerenciAi/src/theme/theme.ts`

### Documentation
- API Docs: `/Users/mateuscoelho/GerenciAi/API_DOCUMENTATION.md`
- Package Config: `/Users/mateuscoelho/GerenciAi/package.json`

---

## Routing Quick Map

```
Browser URL          Component              Page File
---------            ---------              ---------
/login              (no layout)            pages/Login.tsx
/                   Layout + Dashboard     pages/Dashboard.tsx
/alunos             Layout + Students      pages/Students.tsx
/turmas             Layout + Classes       pages/Classes.tsx
/matriculas         (placeholder)
/financeiro         (placeholder)
/relatorios         (placeholder)
```

---

## Key Technologies

| Technology | Version | Usage |
|-----------|---------|-------|
| React | 19.1.1 | UI Framework |
| TypeScript | 5.9.3 | Type Safety |
| Vite | 7.1.7 | Build Tool |
| React Router | 7.9.4 | Routing |
| Zustand | 5.0.8 | State Management |
| Axios | 1.13.0 | HTTP Client |
| Chakra UI | 3.28.0 | UI Library (installed, not heavily used) |

---

## Color Reference (From Theme)

### Brand Colors
- Primary Orange: `#FF9900`
- Orange 50: `#FFF5E6`
- Orange 100: `#FFE8CC`
- Orange 500: `#FF9900`
- Orange 600: `#CC7A00`
- Orange 700: `#995C00`

### Gray Scale
- Gray 50 (lightest): `#FAFAFA`
- Gray 100: `#F5F5F5`
- Gray 200: `#E5E5E5`
- Gray 500: `#737373`
- Gray 600: `#525252`
- Gray 900 (darkest): `#171717`

### Semantic
- Primary Text: `#262626`
- Secondary Text: `#737373`
- Muted Text: `#A3A3A3`
- Background Canvas: `#FAFAFA`
- Card Background: `white`

---

## Common CSS Classes

### Layout & Container
```css
.dashboard { max-width: 1400px; margin: 0 auto; }
.students-page { padding: 2rem; }
.classes-page { padding: 2rem; }
.reports-page { padding: 2rem; max-width: 1400px; }
```

### Cards & Sections
```css
.stat-card { background: white; padding: 1.5rem; border-radius: 12px; }
.class-card { background: white; padding: 1.5rem; border-radius: 12px; }
.report-card { background: white; padding: 1.5rem; border-radius: 12px; }
```

### Buttons
```css
.btn-primary { background: #FF9900; color: white; }
.btn-secondary { background: #E5E5E5; color: #262626; }
.btn-icon { background: transparent; border: none; }
```

### Status Badges
```css
.status-active { background: #10b981; color: white; }      /* Green */
.status-inactive { background: #ef4444; color: white; }    /* Red */
.status-pending { background: #f59e0b; color: white; }     /* Amber */
```

### Forms
```css
.form-group { margin-bottom: 1rem; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.error-message { color: #ef4444; margin-bottom: 1rem; }
```

### Loading
```css
.loading-container { display: flex; justify-content: center; align-items: center; }
.spinner { animation: spin 1s linear infinite; }
```

---

## Important Implementation Notes

1. **Token Management**
   - Automatically injected by axios interceptor
   - Stored in localStorage
   - 401 response redirects to /login

2. **Response Format**
   All APIs return: `{ success: boolean, message?: string, data: T[] }`

3. **State Pattern**
   - Use useState for local component state
   - Use useAuthStore() for auth-related state
   - No global state store for other data (yet)

4. **Error Handling**
   - Wrap API calls in try-catch
   - Display error.response?.data?.message in UI
   - Show loading spinner during requests

5. **Component Size**
   - Pages are large (~600-700 lines)
   - Modals are defined as inline functions within pages
   - No separate component files for modals

6. **Styling**
   - Uses vanilla CSS (not Chakra UI components)
   - CSS files match page names
   - Common classes: btn-*, status-*, .modal-*, .form-*

---

## Data Flow Pattern

```
User Action
    ↓
useState (local state update)
    ↓
Service Method (api call)
    ↓
Axios (automatic token injection)
    ↓
Backend API Response
    ↓
Handle response/error
    ↓
Update state with data
    ↓
Re-render component
```

---

## For Reports Page Creation

### Recommended File Structure
```
/src/
  pages/
    Reports.tsx              (Main component, 500-700 lines)
  services/
    reportService.ts         (API calls)
  types/
    reportTypes.ts           (Interfaces)
  styles/
    Reports.css              (Styling)
```

### Essential Interfaces to Define
```typescript
// reportTypes.ts
interface RevenueSummary {
  received: string;
  to_receive: string;
  overdue: string;
  total_expected: string;
}

interface RevenueData {
  total: string;
  count: number;
  period: { start: string; end: string };
}

interface OverdueStudent {
  student_id: number;
  student_name: string;
  total_overdue: string;
}

interface Invoice {
  id: number;
  student_name: string;
  reference_month: string;
  amount: string;
  status: 'aberta' | 'paga' | 'vencida' | 'cancelada';
}
```

### Report Service Methods to Implement
```typescript
export const reportService = {
  getRevenueSummary(month: string),
  getReceivedRevenue(startDate: string, endDate: string),
  getOverdueStudents(),
  getInvoices(params?: { status?: string; month?: string }),
  getStudentPaymentHistory(studentId: number),
}
```

### Charts/Visualizations to Consider
- Revenue bar chart (received vs pending vs overdue)
- Revenue trend line chart (over months)
- Invoice status pie chart
- Top overdue students table
- Payment method breakdown chart
- Monthly comparison chart

