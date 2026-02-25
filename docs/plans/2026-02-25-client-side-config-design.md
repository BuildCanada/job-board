# Client-Side Configuration Design

**Date:** 2026-02-25  
**Status:** Approved

## Overview

Configure client-side with Next.js 16, Tailwind CSS v4, and Zustand for state management.

## Already Configured

- **Next.js 16** - App Router ✓
- **Tailwind CSS v4** - With custom theme ✓
- **Design tokens** - Fonts and colors from `@/styles/colours` ✓

## To Add

### 1. Install Zustand

```bash
bun add zustand
```

### 2. Store Structure

```
src/lib/stores/
├── useJobFiltersStore.ts    - Job search, pagination, filters
└── useAdminStore.ts         - Admin dashboard state
```

### 3. Job Filters Store

```typescript
interface JobFiltersState {
  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Filters
  province: string | null;
  remoteOk: boolean;
  jobType: string | null;
  setFilters: (filters: Partial<JobFiltersState>) => void;
  resetFilters: () => void;
  
  // Pagination
  page: number;
  setPage: (page: number) => void;
  perPage: number;
}
```

### 4. Admin Store

```typescript
interface AdminState {
  // Active tab
  activeTab: "sources" | "organizations" | "jobs";
  setActiveTab: (tab: AdminState["activeTab"]) => void;
  
  // Selected item for detail view
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  
  // Bulk selection
  selectedIds: Set<string>;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
}
```

## Files to Create

- `src/lib/stores/useJobFiltersStore.ts`
- `src/lib/stores/useAdminStore.ts`
