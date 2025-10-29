# GerenciAi React Project - Complete Exploration Summary

## Executive Summary

This is a modern React 19 + TypeScript web application for managing an educational institution (GerenciAi). The project is currently in early stages with 4 main pages (Login, Dashboard, Students, Classes) and placeholder routes for Enrollments, Financial, and Reports modules.

**Key Stats:**
- Technology Stack: React 19.1, TypeScript, Vite, React Router 7, Zustand, Axios
- Total Pages: 4 functional (Dashboard, Students, Classes, Login)
- Services: 4 (Auth, Students, Classes, API base)
- Store: 1 (Auth store via Zustand)
- Component Size: Large page components (600-700 lines) with inline modal components
- Styling: Vanilla CSS (not Chakra UI components despite library being installed)
- Backend API: Cloud Run deployed Go service

---

## 1. FOLDER STRUCTURE

All source files are organized in `/Users/mateuscoelho/GerenciAi/src/` with the following structure:

```
src/
├── components/          # Reusable components
│   ├── appComponents/   # App-level components
│   ├── auth/            # Authentication components
│   └── layout/          # Layout wrapper components
├── pages/               # Full page components
│   ├── Dashboard.tsx
│   ├── Students.tsx
│   ├── Classes.tsx
│   └── Login.tsx
├── services/            # API service layer
│   ├── api.ts          # Axios instance & interceptors
│   ├── authService.ts
│   ├── classService.ts
│   └── studentService.ts
├── store/               # Zustand state management
│   └── authStore.ts
├── types/               # TypeScript interfaces
│   ├── authTypes.ts
│   ├── classTypes.ts
│   └── studentTypes.ts
├── styles/              # Global & page styles
│   ├── index.css
│   ├── Dashboard.css
│   ├── Students.css
│   ├── Classes.css
│   ├── Header.css
│   ├── Sidebar.css
│   ├── Login.css
│   ├── Loading.css
│   └── Layout.css
├── theme/               # Chakra UI theme config
│   └── theme.ts
├── network/             # Network utilities
│   └── fetchUrls.tsx
├── App.tsx              # Main router configuration
└── main.tsx             # React entry point
```

---

## 2. COMPONENT INVENTORY

### Layout Components
- **Layout.tsx** - Wrapper with Sidebar, Header, and Outlet
- **Sidebar.tsx** - Navigation menu with 6 menu items (emoji icons)
- **Header.tsx** - Top navigation bar with user info

### Page Components
- **Dashboard.tsx** - Stats cards showing metrics
  - Active students count
  - New students (30-day window)
  - Placeholder cards for classes and revenue
  - Notifications section
  
- **Students.tsx** - Full CRUD for students
  - Paginated table (20 items/page)
  - Search by name/email/CPF
  - Filter by status tabs
  - Inline modals: Create, View, Edit
  
- **Classes.tsx** - Full CRUD for classes
  - Grid layout of class cards
  - Modality management modal
  - Create class form modal
  
- **Login.tsx** - Authentication form

### Protected Routes
- **ProtectedRoute.tsx** - Middleware component that:
  - Checks authentication token
  - Fetches user data from API
  - Redirects to login if unauthorized

---

## 3. ROUTING CONFIGURATION

**File:** `/Users/mateuscoelho/GerenciAi/src/App.tsx`

**Route Map:**
```
GET /login                    → Login page (public, no layout)
GET /                         → Dashboard (protected, with layout)
GET /alunos                   → Students page (protected, with layout)
GET /turmas                   → Classes page (protected, with layout)
GET /matriculas               → Placeholder page (protected, with layout)
GET /financeiro               → Placeholder page (protected, with layout)
GET /relatorios               → Placeholder page (protected, with layout)
```

**Architecture:**
- BrowserRouter at root level
- ProtectedRoute wraps authenticated pages
- Layout wraps all protected page content
- Each page has unique URL and sidebar highlight

---

## 4. STATE MANAGEMENT (Zustand)

**File:** `/Users/mateuscoelho/GerenciAi/src/store/authStore.ts`

**Auth Store Interface:**
```typescript
{
  user: User | null                    // Current user object
  token: string | null                 // JWT token
  isAuthenticated: boolean             // Auth status
  isLoading: boolean                   // Loading indicator
  
  // Actions
  setUser(user: User): void
  setToken(token: string): void
  setAuth(user: User, token: string): void
  clearAuth(): void
  setLoading(loading: boolean): void
}
```

**Persistence:** Token stored in localStorage

**Usage Pattern:**
```typescript
const { user, token, isAuthenticated, isLoading } = useAuthStore();
```

**No Other Global State:** Pages use local useState for component-specific data

---

## 5. API & SERVICES LAYER

### Base Configuration
**File:** `/Users/mateuscoelho/GerenciAi/src/services/api.ts`

- **Base URL:** `https://gerenciai-backend-798546007335.us-east1.run.app`
- **HTTP Client:** Axios
- **Features:**
  - Automatic Bearer token injection on all requests
  - 401 response handler (redirects to login)
  - Standard header: Content-Type: application/json

### Service Pattern

Each service exports an object with methods that:
1. Call api.get/post/put/delete with proper types
2. Return typed responses
3. Handle errors naturally (thrown by axios)

**Available Services:**
1. **authService** - login(), getMe(), token management
2. **studentService** - CRUD for students
3. **classService** - CRUD for classes and modalities

### Response Format

Standard response structure:
```typescript
{
  success: boolean
  message?: string
  data: T | T[]
}
```

---

## 6. UI LIBRARY (Chakra UI)

**Status:** Installed but NOT actively used
- Version: 3.28.0
- Location: `/Users/mateuscoelho/GerenciAi/src/theme/theme.ts`

**Theme Configuration:**
- Brand color: Orange (#FF9900)
- Complete color scale defined (50-900)
- Semantic tokens configured (bg, text colors)
- All using default Chakra UI system

**Current Implementation:** Custom CSS
- All pages use vanilla CSS files
- Custom components (buttons, modals, cards)
- Consistent design with theme colors
- Ready to integrate Chakra components if needed

---

## 7. EXISTING FUNCTIONALITY

### Dashboard
- **Data Fetched:** Active students count, new students (30-day)
- **Displays:** Greeting by time of day, stats cards, empty notifications
- **Pattern:** useState + useEffect + useAuthStore

### Students
- **Features:**
  - 20-item pagination
  - Search by name, email, CPF
  - Status filtering (active/inactive/pending)
  - CRUD with inline modals
  - Age calculation from birth date
  - Status badges with color coding
  
- **API Used:**
  - GET /api/students (list with filters)
  - POST /api/students (create)
  - PUT /api/students/:id (update)
  - DELETE /api/students/:id (delete)

### Classes
- **Features:**
  - Grid display of class cards
  - Full class details shown
  - Modality management modal
  - Create class form
  
- **API Used:**
  - GET /api/classes (list)
  - GET /api/classes/modalities (list modalities)
  - POST /api/classes (create)
  - POST /api/classes/modalities (create modality)
  - PUT /api/classes/:id (update)
  - PUT /api/classes/modalities/:id (update)
  - DELETE /api/classes/:id (delete)
  - DELETE /api/classes/modalities/:id (delete)

---

## 8. TYPES & INTERFACES

### Core Types

**User (authTypes.ts)**
```typescript
{
  id: number
  full_name: string
  email: string
  role: 'admin' | 'gestor' | 'instrutor' | 'financeiro'
  status: string
}
```

**Student (studentTypes.ts)**
```typescript
{
  id: number
  full_name: string
  cpf: string
  email: string
  phone?: string
  birth_date?: string
  sex?: 'Masculino' | 'Feminino' | 'Outro' | 'N/I'
  status: 'ativo' | 'inativo' | 'pendente'
  created_at: string
}
```

**Class (classTypes.ts)**
```typescript
{
  id: number
  modality_id: number
  modality_name?: string
  name?: string
  weekday: 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom'
  start_time: string
  end_time?: string
  location?: string
  capacity: number
  level?: 'iniciante' | 'intermediario' | 'avancado' | 'todos'
  status: 'ativa' | 'suspensa' | 'cancelada'
  created_at?: string
}
```

---

## 9. FINANCIAL DATA & REPORTS API ENDPOINTS

### Available for Reports Page

**Revenue Reports:**
- `GET /api/reports/revenue/summary?month=YYYY-MM` - Monthly overview
- `GET /api/reports/revenue/received?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD` - Received revenue
- `GET /api/reports/revenue/to-receive?reference_month=YYYY-MM` - Pending revenue

**Overdue/Delinquency:**
- `GET /api/reports/overdue/all?min_days=N` - All overdue students
- `GET /api/reports/overdue/class/:class_id` - Overdue by class
- `GET /api/reports/overdue/modality/:modality_id` - Overdue by modality

**Invoice Management:**
- `GET /api/invoices?status=STATUS&reference_month=YYYY-MM` - List invoices
- `POST /api/invoices/generate` - Generate invoices for month
- `POST /api/invoices/payment` - Register payment
- `POST /api/invoices/update-overdue` - Update overdue status

**Student History:**
- `GET /api/reports/student/:id/payment-history` - Payment history

### Sample Response (Revenue Summary)
```json
{
  "success": true,
  "month": "2025-10",
  "summary": {
    "received": "R$ 5.400,00",      (formatted string)
    "to_receive": "R$ 2.700,00",
    "overdue": "R$ 810,00",
    "total_expected": "R$ 8.910,00"
  }
}
```

---

## 10. DESIGN & STYLING PATTERNS

### Color System
- **Primary:** Orange #FF9900 (brand)
- **Backgrounds:** White (cards), #FAFAFA (canvas)
- **Text:** #262626 (primary), #737373 (secondary), #A3A3A3 (muted)
- **Borders:** #E5E5E5
- **Status Green:** #10b981 (active)
- **Status Red:** #ef4444 (inactive/overdue)
- **Status Yellow:** #f59e0b (pending)

### Common CSS Classes
```
Layout:     .dashboard, .students-page, .classes-page, .reports-page
Headers:    .dashboard-header, .students-header, .reports-header
Cards:      .stat-card, .class-card, .report-card
Buttons:    .btn-primary, .btn-secondary, .btn-icon
Tables:     .students-table, .reports-table
Modals:     .modal-overlay, .modal-content, .modal-header
Forms:      .form-group, .form-row, .error-message
Status:     .status-badge, .status-active, .status-inactive, .status-pending
Loading:    .loading-container, .spinner
Empty:      .empty-state, .empty-icon, .empty-title
```

### Component Sizes & Spacing
- Container max-width: 1400px
- Page padding: 2rem
- Card padding: 1.5rem
- Card border-radius: 12px
- Gap between grid items: 1.5rem
- Pagination items per page: 20

---

## 11. DEVELOPMENT CONVENTIONS

### Page Structure
```
Import section
  ↓
Component function with useState declarations
  ↓
useEffect hooks for data fetching
  ↓
Helper functions (formatters, handlers)
  ↓
Loading state JSX
  ↓
Main page JSX
  ↓
Inline modal components (function definitions)
```

### Error Handling Pattern
```typescript
try {
  setError('');
  const response = await service.method();
  setData(response.data);
} catch (error: any) {
  setError(error.response?.data?.message || 'Generic error');
} finally {
  setIsLoading(false);
}
```

### Modal Pattern
```typescript
{showModal && (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      {/* Modal content */}
    </div>
  </div>
)}
```

### Component Sizing
- Pages are large (600-700 lines) with multiple inline modals
- Modals are internal functions, not separate components
- No HOCs or context providers (except ProtectedRoute)

---

## 12. READY FOR REPORTS PAGE

### What's Ready to Use
1. **Routing:** Route structure in place (/financeiro and /relatorios available)
2. **Service Layer:** API client fully configured with interceptors
3. **State Management:** Zustand auth store ready
4. **Layout:** Sidebar auto-includes any new route
5. **Styling:** CSS framework established with common classes
6. **API Endpoints:** All financial/report endpoints documented

### What Needs to Be Created
```
/src/pages/Reports.tsx              (500-700 line component)
/src/services/reportService.ts      (API calls)
/src/types/reportTypes.ts           (TypeScript interfaces)
/src/styles/Reports.css             (Page styling)
```

### Reports Page Can Include
- Revenue summary cards (received, pending, overdue, expected)
- Date range filters
- Invoice status breakdown
- Overdue students list/table
- Payment method statistics
- Monthly trend charts (if charting library added)
- Export functionality (if backend supports)

---

## KEY FILES TO REFERENCE

When creating the Reports page, reference these files for patterns:

1. **Pages Pattern:** `/Users/mateuscoelho/GerenciAi/src/pages/Students.tsx` (largest, most features)
2. **Service Pattern:** `/Users/mateuscoelho/GerenciAi/src/services/studentService.ts` (CRUD pattern)
3. **Zustand Pattern:** `/Users/mateuscoelho/GerenciAi/src/store/authStore.ts` (state management)
4. **Type Pattern:** `/Users/mateuscoelho/GerenciAi/src/types/studentTypes.ts` (interface structure)
5. **CSS Pattern:** `/Users/mateuscoelho/GerenciAi/src/styles/Students.css` (layout styling)
6. **API Config:** `/Users/mateuscoelho/GerenciAi/src/services/api.ts` (request/response handling)

---

## NEXT STEPS FOR REPORTS IMPLEMENTATION

1. Create `/src/services/reportService.ts` with all report API methods
2. Create `/src/types/reportTypes.ts` with all response interfaces
3. Create `/src/pages/Reports.tsx` main component (600+ lines)
4. Create `/src/styles/Reports.css` with all styling
5. Update `/src/App.tsx` to route /relatorios to Reports component
6. Update `/src/components/layout/Sidebar.tsx` icon/label if needed
7. Test all API endpoints with real data
8. Add filtering and export features as needed

---

## TECHNOLOGY STACK SUMMARY

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **UI Framework** | React | 19.1.1 | Component rendering |
| **Language** | TypeScript | 5.9.3 | Type safety |
| **Build Tool** | Vite | 7.1.7 | Fast bundling |
| **Routing** | React Router | 7.9.4 | Page navigation |
| **State** | Zustand | 5.0.8 | Auth state management |
| **HTTP** | Axios | 1.13.0 | API requests |
| **UI Library** | Chakra UI | 3.28.0 | Components (installed, not used) |
| **Backend** | Go (API) | - | Cloud Run service |

---

## PROJECT STATUS

**Completed:**
- Authentication flow (login, token management)
- Dashboard with basic metrics
- Full CRUD for Students
- Full CRUD for Classes
- Responsive layout with sidebar
- Type-safe API integration
- Protected routes

**To Do:**
- Financial Reports page (with charts)
- Enrollment management
- Advanced financial features
- User management
- Permissions/roles enforcement

**Code Quality:**
- TypeScript for type safety
- Consistent patterns across pages
- Error handling implemented
- Loading states managed
- Responsive design (CSS media queries)

