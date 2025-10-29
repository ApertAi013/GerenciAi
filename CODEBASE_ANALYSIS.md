# GerenciAi React Project - Codebase Structure Analysis

## Project Overview
- **Name:** GerenciAi
- **Type:** React 19.1 + TypeScript
- **Build Tool:** Vite
- **UI Library:** Chakra UI 3.28.0
- **State Management:** Zustand 5.0.8
- **Routing:** React Router 7.9.4
- **HTTP Client:** Axios 1.13.0
- **Styling:** Custom CSS + Chakra UI

---

## 1. FOLDER STRUCTURE

```
/Users/mateuscoelho/GerenciAi/src/
├── components/
│   ├── appComponents/
│   │   ├── AuthProvider.tsx
│   │   └── Header.tsx
│   ├── auth/
│   │   └── ProtectedRoute.tsx
│   └── layout/
│       ├── Header.tsx
│       ├── Layout.tsx
│       └── Sidebar.tsx
├── pages/
│   ├── Classes.tsx          (Turmas - full page with modals)
│   ├── Dashboard.tsx        (Dashboard with stats cards)
│   ├── Login.tsx            (Authentication)
│   └── Students.tsx         (Alunos - full CRUD with modals)
├── services/
│   ├── api.ts               (Axios config with interceptors)
│   ├── authService.ts       (Auth endpoints)
│   ├── classService.ts      (Classes/Modalities endpoints)
│   └── studentService.ts    (Students endpoints)
├── store/
│   └── authStore.ts         (Zustand auth state management)
├── types/
│   ├── authTypes.ts
│   ├── classTypes.ts
│   └── studentTypes.ts
├── styles/
│   ├── Classes.css
│   ├── Dashboard.css
│   ├── Header.css
│   ├── Layout.css
│   ├── Loading.css
│   ├── Login.css
│   ├── Sidebar.css
│   ├── Students.css
│   └── index.css
├── theme/
│   └── theme.ts             (Chakra UI custom theme)
├── network/
│   └── fetchUrls.tsx
├── App.tsx                  (Main routing setup)
└── main.tsx                 (Entry point)
```

---

## 2. EXISTING COMPONENTS

### Layout Components
- **Layout.tsx** - Main layout with Sidebar, Header, and Outlet for page content
- **Sidebar.tsx** - Navigation menu with emoji icons and active state
- **Header.tsx** - Top header with user info

### Protected Routes
- **ProtectedRoute.tsx** - Verifies authentication, redirects to login if unauthorized

### Pages
- **Dashboard.tsx** - Displays stats cards (active students, new students, etc.)
- **Students.tsx** - Full CRUD for students with modals for create/view/edit
- **Classes.tsx** - Full CRUD for classes with modals and modality management
- **Login.tsx** - Authentication page

---

## 3. ROUTING SETUP

### Route Structure (App.tsx)
```
/login                    → Login page (public)
/                         → Dashboard (protected)
/alunos                   → Students (protected)
/turmas                   → Classes (protected)
/matriculas               → Placeholder (protected)
/financeiro               → Placeholder (protected) [READY FOR REPORTS]
/relatorios               → Placeholder (protected) [READY FOR REPORTS]
```

**Key Points:**
- Uses React Router 7 with BrowserRouter
- ProtectedRoute wraps all authenticated pages
- Layout wrapper includes Sidebar and Header for all protected routes

---

## 4. STATE MANAGEMENT (Zustand)

### authStore.ts
Location: `/Users/mateuscoelho/GerenciAi/src/store/authStore.ts`

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}
```

**Usage Pattern:**
```typescript
const { user, token, isAuthenticated, isLoading } = useAuthStore();
```

**Token Persistence:** Stored in localStorage

---

## 5. API/SERVICES LAYER

### Base API Configuration (services/api.ts)
```typescript
const API_BASE_URL = 'https://gerenciai-backend-798546007335.us-east1.run.app'

// Features:
- Axios instance with automatic token injection
- Request interceptor adds Bearer token from localStorage
- Response interceptor handles 401 errors (redirects to login)
```

### Service Pattern
Each service follows this pattern:
```typescript
export const serviceX = {
  async getAll(params?: any): Promise<ResponseType> {
    const response = await api.get<ResponseType>('/api/endpoint', { params });
    return response.data;
  },
  
  async create(data: RequestType): Promise<ResponseType> {
    const response = await api.post<ResponseType>('/api/endpoint', data);
    return response.data;
  },
  
  // ... other methods
}
```

### Available Services
1. **authService.ts** - Login, getMe, token management
2. **studentService.ts** - CRUD for students
3. **classService.ts** - CRUD for classes and modalities

### Response Format (Standard)
```typescript
interface StandardResponse<T> {
  success: boolean;
  message?: string;
  data: T[];
}
```

---

## 6. UI LIBRARY (Chakra UI)

### Theme Configuration (theme/theme.ts)
Location: `/Users/mateuscoelho/GerenciAi/src/theme/theme.ts`

**Color Palette:**
- **Brand (Orange):** #FF9900 (primary color)
- **Gray scale:** From #FAFAFA (50) to #171717 (900)
- **Semantic tokens:** bg.canvas, bg.surface, text.primary, text.secondary, etc.

**Font:** System UI sans-serif

**NOT CURRENTLY IN USE:** Chakra UI is installed but components use custom CSS instead
- All pages use custom CSS (Students.css, Classes.css, Dashboard.css)
- Custom modals and forms with CSS styling
- No Chakra UI components currently in use (ready to add)

### Current Styling Pattern (CSS)
- Global: `index.css`
- Per-page: Named CSS files (e.g., `Students.css`, `Dashboard.css`)
- Classes used: `.btn-primary`, `.btn-secondary`, `.modal-overlay`, `.status-badge`, etc.

---

## 7. EXISTING PAGES & DASHBOARD

### Dashboard (pages/Dashboard.tsx)
**Features:**
- Greeting message based on time of day
- Stats cards showing:
  - Active students count
  - New students (last 30 days)
  - Active classes placeholder
  - Monthly revenue placeholder
- Empty notifications section
- Uses studentService to fetch data

**Pattern:**
- useState for local state
- useEffect for data fetching
- useAuthStore for user info
- Conditional loading spinner

### Students Page (pages/Students.tsx)
**Features:**
- Paginated table (20 items/page)
- Search by name, email, CPF
- Filter by status (all, active, inactive, pending)
- CRUD operations:
  - Create modal with form validation
  - View modal for details
  - Edit modal for updates
  - Delete with confirmation
- Status badges with color coding
- Dropdown menu for actions

**Components (Inline Modals):**
- CreateStudentModal
- ViewStudentModal
- EditStudentModal

### Classes Page (pages/Classes.tsx)
**Features:**
- Grid layout for class cards
- Full class information display
- Modality management modal
- Create class modal with form
- Status indicators
- Action buttons for edit/delete

**Components (Inline Modals):**
- CreateClassModal
- ModalitiesModal

---

## 8. TYPES/INTERFACES

### authTypes.ts
```typescript
interface User {
  id: number;
  full_name: string;
  email: string;
  role: 'admin' | 'gestor' | 'instrutor' | 'financeiro';
  status: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  data: { token: string; user: User };
}
```

### studentTypes.ts
```typescript
interface Student {
  id: number;
  full_name: string;
  cpf: string;
  email: string;
  phone?: string;
  birth_date?: string;
  sex?: 'Masculino' | 'Feminino' | 'Outro' | 'N/I';
  status: 'ativo' | 'inativo' | 'pendente';
  created_at: string;
}
```

### classTypes.ts
```typescript
interface Class {
  id: number;
  modality_id: number;
  modality_name?: string;
  name?: string;
  weekday: 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom';
  start_time: string;
  end_time?: string;
  location?: string;
  capacity: number;
  level?: 'iniciante' | 'intermediario' | 'avancado' | 'todos';
  status: 'ativa' | 'suspensa' | 'cancelada';
  created_at?: string;
}
```

---

## 9. AVAILABLE API ENDPOINTS FOR REPORTS

### Financial/Reports Endpoints (From API Documentation)

**Revenue Reports:**
- `GET /api/reports/revenue/received` - Received revenue by date range
- `GET /api/reports/revenue/to-receive` - Pending revenue by month
- `GET /api/reports/revenue/summary` - Monthly financial summary

**Overdue/Delinquency Reports:**
- `GET /api/reports/overdue/class/:class_id` - Overdue students by class
- `GET /api/reports/overdue/modality/:modality_id` - Overdue students by modality
- `GET /api/reports/overdue/all` - All overdue students (optional min_days filter)

**Student Payment History:**
- `GET /api/reports/student/:student_id/payment-history` - Payment history for a student

**Invoice Management:**
- `GET /api/invoices` - List invoices (with status, month, student filters)
- `POST /api/invoices/generate` - Generate invoices for a month
- `POST /api/invoices/payment` - Register payment
- `POST /api/invoices/update-overdue` - Update overdue invoice statuses

### Response Examples

**Revenue Summary Response:**
```json
{
  "success": true,
  "month": "2025-10",
  "summary": {
    "received_cents": 540000,
    "received": "R$ 5.400,00",
    "to_receive_cents": 270000,
    "to_receive": "R$ 2.700,00",
    "overdue_cents": 81000,
    "overdue": "R$ 810,00",
    "total_expected_cents": 891000,
    "total_expected": "R$ 8.910,00"
  }
}
```

**Revenue Received Response:**
```json
{
  "success": true,
  "period": {
    "start": "2025-10-01",
    "end": "2025-10-31"
  },
  "total_cents": 540000,
  "total": "R$ 5.400,00",
  "count": 20
}
```

---

## 10. PATTERNS TO FOLLOW FOR REPORTS PAGE

### File Structure Pattern
```
src/pages/Reports.tsx              (Main page component)
src/services/reportService.ts      (All report API calls)
src/types/reportTypes.ts           (Type definitions)
src/styles/Reports.css             (Page styling)
```

### Component Structure Pattern
1. **Page Wrapper**: Max-width container, padding
2. **Header Section**: Title and action buttons
3. **Cards/Sections**: 
   - Grid or flex layout
   - White background, border, shadow
   - Hover effects
4. **Modals**: Overlay pattern for filters/details

### State Management Pattern
```typescript
const [data, setData] = useState<DataType[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [dateRange, setDateRange] = useState({...});
const [selectedFilters, setSelectedFilters] = useState({...});

useEffect(() => {
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await reportService.fetchData(filters);
      setData(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  fetchData();
}, [dateRange, selectedFilters]);
```

### CSS Pattern
```css
.reports-page {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.reports-header {
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
}

.report-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #E5E5E5;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
}

.report-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}
```

### Service Pattern for Reports
```typescript
export const reportService = {
  async getRevenueSummary(month: string): Promise<RevenueSummaryResponse> {
    const response = await api.get<RevenueSummaryResponse>(
      '/api/reports/revenue/summary',
      { params: { month } }
    );
    return response.data;
  },
  
  async getReceivedRevenue(startDate: string, endDate: string) {
    const response = await api.get('/api/reports/revenue/received', {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  },
  
  // ... other methods
}
```

### Button Classes Available
- `.btn-primary` - Orange branded button
- `.btn-secondary` - Gray secondary button
- `.btn-icon` - Icon-only button

### Status Badge Classes
- `.status-badge` - Base class
- `.status-active` / `.status-ativo` - Green
- `.status-inactive` / `.status-inativo` - Red
- `.status-pending` / `.status-pendente` - Yellow
- `.status-paid` / `.status-paga` - Green
- `.status-overdue` / `.status-vencida` - Red
- `.status-open` / `.status-aberta` - Blue

### Loading Pattern
```tsx
if (isLoading) {
  return (
    <div className="loading-container">
      <div className="spinner"></div>
    </div>
  );
}
```

### Empty State Pattern
```tsx
<div className="empty-state">
  <div className="empty-icon">📊</div>
  <p className="empty-title">No data available</p>
  <p className="empty-subtitle">Try adjusting your filters</p>
</div>
```

---

## 11. KEY DEVELOPMENT TIPS

### Authentication
- Token is automatically injected by axios interceptor
- Use `useAuthStore()` to check if user is authenticated
- Protected routes via ProtectedRoute component

### Data Fetching
- Always wrap in try-catch
- Handle loading and error states
- Set loading before request, clear after finally block

### Forms
- Use uncontrolled inputs with useState
- Validate before submit
- Show error messages in UI
- Disable submit button while submitting

### Modals
- Use className="modal-overlay" for backdrop
- Use onClick={(e) => e.stopPropagation()} to prevent closing on content click
- Include close button with ✕ emoji

### Date Formatting
```typescript
// Format to display: toLocaleDateString('pt-BR')
new Date(date).toLocaleDateString('pt-BR')

// Format for API: YYYY-MM-DD
date.toISOString().split('T')[0]
```

### Currency Display
- API returns cents (amount_cents) and formatted string (amount)
- Display the formatted string (e.g., "R$ 270,00")
- Use amount_cents for calculations

### Styling Classes Used
- Container: `.dashboard`, `.students-page`, `.classes-page`
- Header: `.dashboard-header`, `.students-header`, `.classes-header`
- Cards: `.stat-card`, `.class-card`, `.report-card`
- Buttons: `.btn-primary`, `.btn-secondary`, `.btn-icon`
- Tables/Lists: `.students-table`, `.filter-tabs`, `.pagination`
- Modals: `.modal-overlay`, `.modal-content`, `.modal-header`, `.modal-actions`
- Forms: `.form-group`, `.form-row`, `.error-message`
- Status: `.status-badge`, `.status-active`, `.status-inactive`, etc.

---

## Summary for Reports Page Implementation

**What to Create:**
1. `/src/pages/Reports.tsx` - Main reports page with charts/cards
2. `/src/services/reportService.ts` - Service for report endpoints
3. `/src/types/reportTypes.ts` - Type definitions for reports
4. `/src/styles/Reports.css` - Custom styles

**Key Data Points to Display:**
- Monthly revenue summary (received, pending, overdue, expected)
- Revenue received over date range
- Overdue accounts by class/modality
- Invoice status breakdown
- Payment method breakdown

**Available APIs to Use:**
- `/api/reports/revenue/summary` - Monthly overview
- `/api/reports/revenue/received` - Received revenue by date
- `/api/reports/overdue/all` - All delinquent accounts
- `/api/invoices` - List invoices with filters

**Best Practices to Follow:**
- Follow the useState/useEffect pattern from existing pages
- Use custom CSS (not Chakra components)
- Handle loading states with spinner
- Show empty states when no data
- Use date pickers for date range filters
- Display currency with "R$ " prefix
- Use status badges for invoice/payment status

