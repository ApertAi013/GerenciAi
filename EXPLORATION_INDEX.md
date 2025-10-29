# GerenciAi Codebase Exploration - Complete Index

This folder contains comprehensive documentation of the GerenciAi React project codebase structure and patterns.

## Documentation Files

### 1. **EXPLORATION_SUMMARY.md** (START HERE)
   - Executive summary of the entire project
   - Technology stack overview
   - Component inventory
   - Current functionality
   - Ready for Reports page
   - Recommended next steps

### 2. **CODEBASE_ANALYSIS.md**
   - Deep dive into folder structure
   - Component breakdown with line counts
   - Routing setup details
   - State management (Zustand) patterns
   - API/Services layer architecture
   - UI library (Chakra UI) configuration
   - Existing pages functionality
   - Type definitions
   - Available financial API endpoints

### 3. **QUICK_REFERENCE.md**
   - File locations for all important files
   - Routing quick map
   - Technology versions
   - Color palette reference
   - Common CSS classes
   - Development conventions

### 4. **CODE_SNIPPETS.md**
   - Ready-to-use code templates
   - Common page structure template
   - Service pattern examples
   - Type definitions examples
   - Card component patterns
   - Modal patterns
   - Table patterns
   - Grid layouts
   - Error handling patterns
   - Complete CSS skeleton

### 5. **ARCHITECTURE_DIAGRAM.md**
   - Data flow diagrams
   - Component tree structure
   - Service layer architecture
   - State management flows
   - Authentication flows
   - API request/response flows
   - Page component lifecycle
   - File organization logic
   - Integration plan for Reports page

---

## Quick Navigation

### For Understanding the Project
1. Read **EXPLORATION_SUMMARY.md** (15 min)
2. Review **ARCHITECTURE_DIAGRAM.md** (10 min)
3. Check **QUICK_REFERENCE.md** for specific details

### For Creating the Reports Page
1. Use **CODE_SNIPPETS.md** as templates
2. Reference **CODEBASE_ANALYSIS.md** section 9 for API endpoints
3. Follow patterns from **QUICK_REFERENCE.md** sections 1 & 2

### For Understanding Specific Components
1. Check **CODEBASE_ANALYSIS.md** section 2 for component list
2. View **QUICK_REFERENCE.md** section 1 for file locations
3. Use **ARCHITECTURE_DIAGRAM.md** for system context

---

## Key Files in Project

### Most Important Files to Reference
1. `/src/pages/Students.tsx` - Largest page with all patterns
2. `/src/services/studentService.ts` - Service pattern
3. `/src/store/authStore.ts` - State management
4. `/src/types/studentTypes.ts` - Type definitions
5. `/src/services/api.ts` - API configuration
6. `/src/App.tsx` - Routing setup

### Files to Modify (for Reports)
1. `/src/App.tsx` - Add Reports route
2. `/src/components/layout/Sidebar.tsx` - Update menu if needed

### Files to Create (for Reports)
1. `/src/pages/Reports.tsx` - Main page (500-700 lines)
2. `/src/services/reportService.ts` - API calls
3. `/src/types/reportTypes.ts` - TypeScript interfaces
4. `/src/styles/Reports.css` - Page styling

---

## Project Statistics

- **Total Source Files:** 25
- **Page Components:** 4 (Dashboard, Students, Classes, Login)
- **Service Files:** 4 (API base, Auth, Students, Classes)
- **Type Files:** 3 (Auth, Students, Classes)
- **CSS Files:** 8 (plus index.css)
- **Store Files:** 1 (Zustand)
- **Lines of Code (avg page):** 600-700 lines

---

## Technology Stack Summary

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.1.1 | UI Framework |
| TypeScript | 5.9.3 | Type Safety |
| React Router | 7.9.4 | Routing |
| Zustand | 5.0.8 | State Management |
| Axios | 1.13.0 | HTTP Client |
| Chakra UI | 3.28.0 | UI Library (installed, not used) |
| Vite | 7.1.7 | Build Tool |

---

## Architecture Overview

**3-Layer Architecture:**
1. **Presentation Layer** (Pages + Components)
2. **Business Logic Layer** (Services + Store)
3. **Data Layer** (API + Axios)

**Key Patterns:**
- Component-per-page approach
- Service objects for API calls
- Zustand for global auth state
- useState for local component state
- Custom CSS (no Chakra components)
- Inline modals within pages

---

## How to Use This Documentation

### Scenario 1: "I'm new to this project"
```
Read in order:
1. EXPLORATION_SUMMARY.md (overview)
2. ARCHITECTURE_DIAGRAM.md (visual understanding)
3. QUICK_REFERENCE.md (specifics)
4. CODE_SNIPPETS.md (examples)
```

### Scenario 2: "I need to create the Reports page"
```
1. Read CODE_SNIPPETS.md section 1 (page template)
2. Read CODEBASE_ANALYSIS.md section 9 (available APIs)
3. Read CODE_SNIPPETS.md section 2 (service pattern)
4. Reference existing pages (Students.tsx, Classes.tsx)
5. Follow QUICK_REFERENCE.md patterns
```

### Scenario 3: "I need to understand authentication"
```
1. Read ARCHITECTURE_DIAGRAM.md section "Authentication Flow"
2. Check CODEBASE_ANALYSIS.md section 4 (Zustand store)
3. View /src/services/authService.ts
4. View /src/components/auth/ProtectedRoute.tsx
```

### Scenario 4: "I need to understand the API"
```
1. Read CODEBASE_ANALYSIS.md section 5 (API/Services)
2. Check CODE_SNIPPETS.md section 2 (service pattern)
3. View /src/services/api.ts (base config)
4. Read API_DOCUMENTATION.md (backend endpoints)
5. Review relevant service file (studentService, classService)
```

### Scenario 5: "I need to add a new feature"
```
1. Read CODE_SNIPPETS.md section 1 (page template)
2. Create service file following section 2 pattern
3. Create types file following section 3 pattern
4. Create page using provided template
5. Create CSS file following QUICK_REFERENCE.md
6. Update App.tsx routing
```

---

## Common Development Tasks

### Add a new page
Files needed:
- [ ] `/src/pages/PageName.tsx` (use CODE_SNIPPETS.md template)
- [ ] `/src/services/pageNameService.ts` (use CODE_SNIPPETS.md template)
- [ ] `/src/types/pageNameTypes.ts` (use CODE_SNIPPETS.md template)
- [ ] `/src/styles/PageName.css` (use CODE_SNIPPETS.md skeleton)
- [ ] Update `/src/App.tsx` to add route
- [ ] Update `/src/components/layout/Sidebar.tsx` if needed

### Fetch data from API
Steps:
1. Create method in service file (see CODE_SNIPPETS.md section 2)
2. Import service in page
3. Use useEffect to call on mount (see CODE_SNIPPETS.md section 1)
4. Handle loading/error states
5. Display data or empty state

### Add a modal
Steps:
1. Create state in page: `const [showModal, setShowModal] = useState(false)`
2. Add button to trigger: `onClick={() => setShowModal(true)}`
3. Add modal JSX (see CODE_SNIPPETS.md section 5)
4. Create modal component function (inline or separate)
5. Handle form submission

### Style a component
Steps:
1. Create/update CSS file (see CSS skeleton in CODE_SNIPPETS.md)
2. Use class names: `.page-name { ... }`
3. Follow existing color scheme (see QUICK_REFERENCE.md section 3)
4. Use common classes (see QUICK_REFERENCE.md section 4)

---

## Color Reference

**Brand Colors:**
- Primary Orange: `#FF9900`
- Orange shades: #FFF5E6 (50) to #331F00 (900)

**Status Colors:**
- Active/Success: `#10b981` (green)
- Inactive/Danger: `#ef4444` (red)
- Pending/Warning: `#f59e0b` (amber)

**Text Colors:**
- Primary: `#262626`
- Secondary: `#737373`
- Muted: `#A3A3A3`

**Background Colors:**
- Canvas: `#FAFAFA`
- Surface: `white`
- Border: `#E5E5E5`

See QUICK_REFERENCE.md section 3 for complete palette

---

## Common Pitfalls & Solutions

### Pitfall 1: Token not sent with API requests
- **Solution:** Already handled by axios interceptor in api.ts
- **Check:** localStorage.getItem('token') working?

### Pitfall 2: Component not re-rendering after data fetch
- **Solution:** Ensure useState is set in finally block
- **Pattern:** See CODE_SNIPPETS.md section 1

### Pitfall 3: Modal closing unexpectedly
- **Solution:** Use `onClick={(e) => e.stopPropagation()}` on modal content
- **Pattern:** See CODE_SNIPPETS.md section 5

### Pitfall 4: Type errors with API responses
- **Solution:** Create proper type definitions first
- **Pattern:** See CODE_SNIPPETS.md section 3

### Pitfall 5: Page doesn't show in sidebar
- **Solution:** Add menu item to /src/components/layout/Sidebar.tsx
- **Reference:** QUICK_REFERENCE.md section 1

---

## API Endpoints Available

### For Reports (Ready to Use)
- `GET /api/reports/revenue/summary` - Monthly overview
- `GET /api/reports/revenue/received` - Received revenue
- `GET /api/reports/overdue/all` - Overdue students
- `GET /api/invoices` - List invoices

See CODEBASE_ANALYSIS.md section 9 for complete list

---

## Next Steps

1. **Read EXPLORATION_SUMMARY.md** for overview
2. **Review ARCHITECTURE_DIAGRAM.md** for system understanding
3. **Plan your feature/page** based on requirements
4. **Create files using CODE_SNIPPETS.md** templates
5. **Test with API documentation**
6. **Reference existing pages** for similar patterns
7. **Update App.tsx and Sidebar** to integrate new page

---

## File Locations Quick Links

All files are located in `/Users/mateuscoelho/GerenciAi/`

**Documentation (in project root):**
- EXPLORATION_SUMMARY.md
- CODEBASE_ANALYSIS.md
- QUICK_REFERENCE.md
- CODE_SNIPPETS.md
- ARCHITECTURE_DIAGRAM.md
- API_DOCUMENTATION.md
- README.md

**Source Code (in /src):**
- pages/ - Page components
- services/ - API services
- components/ - Layout components
- types/ - TypeScript definitions
- store/ - Zustand stores
- styles/ - CSS files
- theme/ - Chakra theme config

---

## Questions Answered by Each Document

### EXPLORATION_SUMMARY.md
- What is this project about?
- What technologies are used?
- How is the project structured?
- What pages exist?
- What's ready to build next?

### CODEBASE_ANALYSIS.md
- Where is each file located?
- How do components work together?
- What patterns are used?
- How does state management work?
- What API endpoints are available?

### QUICK_REFERENCE.md
- Where is file X located?
- What CSS classes exist?
- What colors should I use?
- What are the common conventions?
- What technologies and versions?

### CODE_SNIPPETS.md
- How do I create a new page?
- How do I write a service method?
- How do I create a modal?
- How do I style a component?
- How do I handle errors?

### ARCHITECTURE_DIAGRAM.md
- How does data flow through the app?
- What is the component tree?
- How does authentication work?
- How do API requests work?
- What is the system architecture?

---

## Getting Help

If you're stuck, check:
1. The relevant documentation file above
2. The existing implementation (Students.tsx, Classes.tsx)
3. API_DOCUMENTATION.md for backend details
4. Code patterns in CODE_SNIPPETS.md

---

Last Updated: October 28, 2025
Documentation Version: 1.0
Project Version: 0.0.0

