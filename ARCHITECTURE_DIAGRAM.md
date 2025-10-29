# GerenciAi Architecture Diagram

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Application                        │
│                      (React 19.1 + TypeScript)                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌───────▼────────┐  ┌──▼──────────┐  ┌─▼──────────────┐
        │   App Router   │  │  Layout     │  │  ProtectedRoute│
        │  (React Router)│  │  (Sidebar,  │  │  (Auth Check)  │
        │                │  │   Header)   │  │                │
        └────────────────┘  └─────────────┘  └────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
    ┌───▼──────┐          ┌────▼────┐          ┌──────▼────┐
    │Dashboard │          │Students │          │  Classes  │
    │  Page    │          │  Page   │          │   Page    │
    └──────────┘          └─────────┘          └───────────┘
        │                      │                      │
        └──────────┬───────────┴──────────┬───────────┘
                   │                      │
          ┌────────▼──────────┐  ┌────────▼──────────┐
          │  useState (local   │  │  useAuthStore    │
          │  component state)  │  │  (Zustand)       │
          │  - data            │  │  - user          │
          │  - loading         │  │  - token         │
          │  - error           │  │  - isAuth        │
          └────────┬───────────┘  └────────┬─────────┘
                   │                       │
                   └───────────┬───────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Service Layer      │
                    │  (Axios)            │
                    └──────────┬──────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
    ┌───▼──────────┐   ┌──────▼──────┐    ┌─────────▼────┐
    │studentService│   │classService │    │authService   │
    │- getStudents │   │- getClasses │    │- login       │
    │- createX     │   │- createX    │    │- getMe       │
    │- updateX     │   │- updateX    │    │- logout      │
    │- deleteX     │   │- deleteX    │    │              │
    └───┬──────────┘   └──────┬──────┘    └──────┬───────┘
        │                     │                  │
        └─────────────────────┼──────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │  api.ts (Axios)    │
                    │  - Base URL        │
                    │  - Auth Interceptor│
                    │  - Error Handler   │
                    └─────────┬──────────┘
                              │
                    ┌─────────▼──────────┐
                    │   Backend API      │
                    │   (Go + Cloud Run) │
                    │                    │
                    │ /api/auth          │
                    │ /api/students      │
                    │ /api/classes       │
                    │ /api/reports       │
                    │ /api/invoices      │
                    └────────────────────┘
```

---

## Component Tree Structure

```
App
├── BrowserRouter
│   └── Routes
│       ├── /login
│       │   └── Login (public)
│       │
│       └── ProtectedRoute
│           └── Layout
│               ├── Sidebar (menu)
│               ├── Header (user info)
│               └── Outlet (page content)
│                   ├── Dashboard (/)
│                   ├── Students (/alunos)
│                   │   ├── CreateStudentModal
│                   │   ├── ViewStudentModal
│                   │   └── EditStudentModal
│                   ├── Classes (/turmas)
│                   │   ├── CreateClassModal
│                   │   └── ModalitiesModal
│                   ├── Enrollments (/matriculas) - placeholder
│                   ├── Financial (/financeiro) - placeholder
│                   └── Reports (/relatorios) - placeholder
```

---

## Service Layer Architecture

```
┌──────────────────────────────────────────┐
│         Pages (React Components)         │
└────────┬─────────────────────────────────┘
         │ import and use
         │
┌────────▼──────────────────────────────────┐
│      Service Layer (Exported Objects)     │
│                                           │
│  reportService: {                         │
│    getRevenueSummary(month)              │
│    getReceivedRevenue(start, end)        │
│    getOverdueStudents()                  │
│    getInvoices(params)                   │
│  }                                        │
│                                           │
│  studentService: {                        │
│    getStudents(params)                   │
│    getStudentById(id)                    │
│    createStudent(data)                   │
│    updateStudent(id, data)               │
│    deleteStudent(id)                     │
│  }                                        │
│                                           │
│  classService: {                          │
│    getClasses(params)                    │
│    getModalities()                       │
│    createClass(data)                     │
│    updateClass(id, data)                 │
│    createModality(data)                  │
│  }                                        │
│                                           │
│  authService: {                           │
│    login(credentials)                    │
│    getMe()                               │
│    saveToken(token)                      │
│    logout()                              │
│  }                                        │
└────────┬──────────────────────────────────┘
         │ use
         │
┌────────▼──────────────────────────────────┐
│      api.ts (Axios Instance)             │
│                                           │
│  Features:                                │
│  - Base URL configuration                │
│  - Request interceptor (adds token)      │
│  - Response interceptor (handles 401)    │
│  - Content-Type application/json         │
└────────┬──────────────────────────────────┘
         │ makes requests
         │
┌────────▼──────────────────────────────────┐
│   Backend API (Google Cloud Run)         │
│                                           │
│   Base: gerenciai-backend-*.run.app      │
│   Protocol: HTTPS                        │
│   Auth: Bearer Token (JWT)               │
└──────────────────────────────────────────┘
```

---

## State Management Flow

```
┌─────────────────────────────────────────┐
│     Zustand Store (authStore.ts)        │
│                                         │
│  State:                                 │
│  ├─ user: User | null                  │
│  ├─ token: string | null               │
│  ├─ isAuthenticated: boolean           │
│  └─ isLoading: boolean                 │
│                                         │
│  Actions:                               │
│  ├─ setUser(user)                      │
│  ├─ setToken(token)                    │
│  ├─ setAuth(user, token)               │
│  ├─ clearAuth()                        │
│  └─ setLoading(loading)                │
└─────────────────┬───────────────────────┘
                  │
                  │ localStorage.getItem/setItem
                  │
        ┌─────────▼──────────┐
        │  Browser Storage   │
        │  (localStorage)    │
        │                    │
        │  key: "token"      │
        │  value: JWT string │
        └────────────────────┘

┌─────────────────────────────────────────┐
│   Component Local State (useState)      │
│   (No global store used)                │
│                                         │
│  Each page has:                         │
│  - data: T[]                           │
│  - isLoading: boolean                  │
│  - error: string                       │
│  - filters: object                     │
│  - showModal: boolean                  │
│  - etc.                                 │
└─────────────────────────────────────────┘
```

---

## Authentication Flow

```
1. User Visits App
   │
   └─→ App.tsx
       └─→ Routes
           └─→ ProtectedRoute (checks auth)

2. ProtectedRoute Component:
   │
   ├─ Check: localStorage token exists?
   │  │
   │  ├─ YES: Load user data from API
   │  │       (authService.getMe())
   │  │       │
   │  │       ├─ Success: Set user in store
   │  │       │          Render page
   │  │       │
   │  │       └─ 401 Error: Clear token
   │  │                     Redirect to /login
   │  │
   │  └─ NO: Redirect to /login immediately

3. Login Page:
   │
   ├─ User submits credentials
   │  │
   │  ├─ Call authService.login(email, password)
   │  │  │
   │  │  ├─ Success: Store token and user
   │  │  │           Redirect to /
   │  │  │
   │  │  └─ Error: Show error message
   │  │
   │  └─ Auto-redirects once authenticated

4. Protected Pages:
   │
   ├─ Wrapped in Layout component
   ├─ Sidebar shows active route
   ├─ Header shows user info
   └─ All API calls auto-include token
      (via axios interceptor)

5. Token Expiration:
   │
   ├─ API returns 401
   │  │
   │  ├─ Axios response interceptor catches it
   │  ├─ Removes token from localStorage
   │  ├─ Redirects to /login
   │  └─ User must login again
```

---

## API Request/Response Flow

```
Component
  │
  ├─ Call: reportService.getRevenueSummary(month)
  │
  └─→ Service (reportService.ts)
      │
      ├─ api.get('/api/reports/revenue/summary', { params: { month } })
      │
      └─→ Axios (api.ts)
          │
          ├─ Request Interceptor:
          │  ├─ Get token from localStorage
          │  └─ Add to header: Authorization: Bearer TOKEN
          │
          └─→ HTTP Request to Backend
              │
              ├─ POST/GET/PUT/DELETE
              ├─ URL: https://gerenciai-backend-*.run.app/api/...
              └─ Headers: { Authorization: Bearer TOKEN, ... }

Backend
  │
  ├─ Process request
  ├─ Validate token
  └─ Return response

Axios Response
  │
  ├─ Response Interceptor:
  │  │
  │  ├─ Status 200-299: Return data as-is
  │  │
  │  └─ Status 401: 
  │     ├─ Remove token from localStorage
  │     └─ Redirect to /login
  │
  └─→ Return to Service

Service
  │
  ├─ Return response.data
  │
  └─→ Return to Component

Component
  │
  ├─ Try/Catch:
  │  ├─ Success: Update state with data
  │  └─ Error: Display error message
  │
  └─ Set isLoading = false
```

---

## Page Component Lifecycle

```
Mount Component
  │
  ├─ useState declarations
  │  ├─ data: T[]
  │  ├─ isLoading: boolean
  │  ├─ error: string
  │  └─ filters: object
  │
  └─ useEffect hook:
     │
     ├─ Dependency: [filters]
     │
     └─→ Call fetchData():
         │
         ├─ setIsLoading(true)
         │
         ├─ Try:
         │  │
         │  ├─ const response = await service.getData(filters)
         │  ├─ setData(response.data)
         │  └─ setError('')
         │
         ├─ Catch (error):
         │  └─ setError(error.response?.data?.message)
         │
         └─ Finally:
            └─ setIsLoading(false)

Render:
  │
  ├─ If isLoading: Show spinner
  │
  ├─ If error: Show error message
  │
  ├─ If data.length === 0: Show empty state
  │
  └─ Else: Render data in grid/table/cards
     │
     └─ User interactions:
        ├─ Click button → setState
        ├─ Form submit → call API → refetch
        └─ Filter change → useEffect triggers
```

---

## File Organization Logic

```
Component Logic
  │
  ├─ Layout / Styling
  │  └─→ styles/*.css (one per page)
  │
  ├─ Data Types
  │  └─→ types/*.ts (one per domain)
  │
  ├─ API Calls
  │  └─→ services/*.ts (one per domain)
  │
  ├─ Page Rendering
  │  └─→ pages/*.tsx (one per page)
  │
  ├─ Global State
  │  └─→ store/*.ts (auth only)
  │
  └─ Routing
     └─→ App.tsx (single file)
```

---

## Reports Page Integration Plan

```
Current App Structure:
┌─────────────────────────────────┐
│ App.tsx (Routes)                │
├─────────────────────────────────┤
│ Routes (protected & public):    │
│  /login → Login                 │
│  /       → Dashboard            │
│  /alunos → Students             │
│  /turmas → Classes              │
│  /relatorios → ??? PLACEHOLDER  │
└─────────────────────────────────┘

After Reports Implementation:
┌──────────────────────────────────────┐
│ App.tsx (Routes)                     │
├──────────────────────────────────────┤
│ Update Route:                        │
│  /relatorios → Reports (NEW)         │
└──────────────────────────────────────┘
                │
                ├─→ reports/                (new)
                │   ├─ pages/Reports.tsx         (new)
                │   ├─ services/
                │   │   └─ reportService.ts     (new)
                │   ├─ types/
                │   │   └─ reportTypes.ts       (new)
                │   └─ styles/
                │       └─ Reports.css          (new)
                │
                └─→ All existing files unchanged
                    (Reports page uses same patterns)
```

---

## Security & Authentication

```
┌────────────────────────────────┐
│   Token Management             │
├────────────────────────────────┤
│                                │
│ 1. Login:                      │
│    POST /api/auth/login        │
│    ↓                           │
│    Receive token in response   │
│    ↓                           │
│    Store in localStorage       │
│    ↓                           │
│    Zustand store updated       │
│                                │
│ 2. API Requests:               │
│    Every request includes:     │
│    Authorization: Bearer TOKEN │
│    (via interceptor)           │
│                                │
│ 3. Token Expiration:           │
│    API returns 401             │
│    ↓                           │
│    Interceptor catches         │
│    ↓                           │
│    Clear localStorage          │
│    ↓                           │
│    Redirect to /login          │
│                                │
│ 4. Logout:                     │
│    authService.logout()        │
│    ↓                           │
│    Clear localStorage          │
│    ↓                           │
│    Clear Zustand store         │
│    ↓                           │
│    Redirect to /login          │
│                                │
└────────────────────────────────┘
```

---

## Common Error Handling

```
Try:
  const response = await reportService.getRevenueSummary(month);
  setData(response.data);
  setError('');

Catch (error: any):
  // Error from API response
  const message = error.response?.data?.message;
  
  // Specific error handling
  if (error.response?.status === 401) {
    // Token expired - already handled by interceptor
  }
  if (error.response?.status === 403) {
    // No permission
  }
  if (error.response?.status === 404) {
    // Not found
  }
  if (!error.response) {
    // Network error
  }
  
  setError(message || 'Erro ao carregar dados');
  console.error('Full error:', error);

Finally:
  setIsLoading(false);
```

---

## Performance & Caching Strategy

```
Current Implementation:
├─ No data caching
├─ No request deduplication
├─ No pagination (manual 20-item limit)
├─ No lazy loading
└─ Fresh fetch on filter change

Opportunities for Reports:
├─ Cache revenue summary by month
├─ Cache invoice list by filter combo
├─ Lazy load overdue details
├─ Pagination for large datasets
└─ Request debouncing on filter changes
```

---

## Responsive Design

```
Breakpoint: 768px
├─ Desktop (768px+)
│  ├─ Sidebar fixed
│  ├─ Multi-column grids
│  ├─ Full-width tables
│  └─ Modals: 70% width
│
└─ Mobile (<768px)
   ├─ Hamburger menu (not implemented yet)
   ├─ Single column layouts
   ├─ Scrollable tables
   └─ Modals: 95% width
```

