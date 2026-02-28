# UI Design Speclets - Build Canada Job Board

**Date:** February 27, 2026
**Status:** Approved
**Approach:** Multi-Page Discovery

## Overview

Multi-page job board design for Canadian startup job listings. Independent pages with search-first user journey, no authentication required, responsive-first design using existing ShadCN theme and color palette.

---

## Design Decisions Summary

- **Design Aesthetic:** Clean, professional using existing ShadCN theme (auburn/maritime primary colors)
- **Navigation:** Independent pages with URL-based state (no client state management)
- **Authentication:** None required - fully public access
- **User Journey:** Search-first: Landing → Search → Browse Results → Job Detail → Apply
- **Device Priority:** Responsive-first (equal mobile/desktop priority)
- **Search Features:** Keyword, location, job type, and company filters
- **Landing Page:** Balanced approach (50/50 split: value prop + stats/search)
- **Job Listings:** Core details + company info on cards
- **Company Profiles:** Basic info, metrics, open positions, activity indicators
- **Job Details:** Full posting, contextual info, apply CTA, related jobs
- **Header:** Standard (logo, nav links: Jobs, Companies, About)
- **Footer:** Full-featured (Build Canada info, GitHub repo, contributors, legal)

---

## Page Structure & Routing

### Route Map
```
/                          - Landing page with hero search
/jobs                      - Job search dashboard
/jobs/[id]                 - Individual job detail
/companies                 - Company directory
/company/[id]              - Company profile with jobs
```

### URL Query Parameters
- `/jobs?q=react&location=toronto&type=full-time&remote=true` - Search filters
- `/company/[id]?position=senior&department=engineering` - Job filters on company profile

### Navigation Flow
1. Landing page → Search bar → `/jobs` with query params
2. `/jobs` → Click company logo → `/company/[id]`
3. `/company/[id]` → Click job → `/jobs/[id]`
4. `/jobs/[id]` → Related jobs link → Back to `/jobs` with filtered query

### Global State
- Search query shared via URL params (no client state)
- No authentication
- Server-side data fetching on each page load

---

## Page 1: Landing Page (/)

### Hero Section (50/50 Balanced Layout)

**Left Side:**
- Headline: "Every Canadian Startup Job in One Place"
- Subheadline: "Discover opportunities at VC-backed, Canadian-owned and operated startups. No fake listings, no signup required."
- Search bar (prominent, centered):
  - Keyword input
  - Location dropdown (all provinces + Remote)
  - Search button (auburn primary)

**Right Side:**
- Live stats display:
  - "X jobs from Y Canadian startups"
  - "Last updated: [time ago]"
- Latest companies: 6-8 company logos in a grid (rotated)

### Content Sections (Below Hero)
- **Latest Jobs:** 4-6 job listing cards (same design as `/jobs` page)
- **Latest Companies:** 6-8 company profile cards (logos, industry, location)
- **About Build Canada:** Brief text explaining NGO mission
- **CTA Buttons:** "Search All Jobs" and "Browse Companies"

### Layout Specs
- Full-width hero with max-width content container (1200px)
- Featured sections in 2-3 column grids
- Responsive: stacks vertically on mobile, side-by-side on desktop

---

## Page 2: Header & Footer

### Header
- Logo (left): Build Canada text + maple leaf icon
- Navigation links (center): Jobs, Companies, About
- Background: Subtle gradient using auburn/maritime colors
- Responsive: Hamburger menu on mobile
- Search bar: NOT in header (only in landing hero and `/jobs`)

### Footer (4-Column Layout)
- **Build Canada:** About text, mission statement, NGO site link
- **Open Source:** GitHub repo link, contributors list, license
- **Resources:** Blog, API docs, Data Warehouse (future)
- **Legal:** Privacy Policy, Terms of Service, Contact

### Footer Bottom Bar
- Copyright text
- Social links: GitHub, LinkedIn, Twitter
- Background: nickel/steel colors
- Accents: auburn color

### Navigation Behavior
- Active page link: auburn accent highlight
- Hover states: maritime colors
- Links maintain search context where applicable

---

## Page 3: Job Search Dashboard (/jobs)

### Page Layout
- Sidebar (left, 300px fixed): Filters
- Main content (right, flexible): Job listings

### Sidebar Filters
- Search input (keyword)
- Location dropdown (all provinces + Remote)
- Job type checkboxes: Full-time, Part-time, Contract, Internship
- Company dropdown (autocomplete)
- Remote toggle (On/Off)
- Salary range slider (if data available)
- Seniority dropdown: Entry, Mid, Senior, Lead, Principal
- "Clear all filters" button
- Active filters summary with individual X to remove

### Job Listings
- View: Grid on desktop (2-3 columns), list on mobile
- Each card:
  - Company logo (40x40)
  - Job title (primary)
  - Company name (secondary, links to `/company/[id]`)
  - Location (city, province) + Remote badge
  - Job type badge
  - Posted date (e.g., "2 days ago")
- Cards link to `/jobs/[id]`

### Main Content Header
- Results count: "Showing X jobs"
- Sort dropdown: Relevance, Date Posted, Salary (if available)
- Grid/List view toggle (desktop only)

---

## Page 4: Company Directory (/companies)

### Page Layout
- Sidebar (left, 300px fixed): Filters
- Main content (right, flexible): Company cards grid

### Sidebar Filters
- Search input (company name)
- Industry dropdown: SaaS, Fintech, Healthtech, etc.
- Location dropdown: province/city
- Funding stage dropdown: Pre-seed, Seed, Series A, Series B+
- Team size dropdown: 1-10, 11-50, 51-200, 201+
- Year founded range slider
- "Clear all filters" button
- Active filters summary

### Company Cards
- Grid: 3-4 columns (desktop), 2 (tablet), 1 (mobile)
- Each card:
  - Company logo (80x80, centered top)
  - Company name (primary, links to `/company/[id]`)
  - Industry label (small, muted)
  - Location (city, province)
  - Funding stage badge
  - "X open positions" count (link to company profile)
- Hover effect: Subtle lift with auburn border

### Main Content Header
- Results count: "Showing X Canadian startups"
- Sort dropdown: Recently Posted Jobs, Alphabetical, Newest Companies

---

## Page 5: Job Detail Page (/jobs/[id])

### Page Layout
- Breadcrumb: Home > Jobs > [Company Name] > [Job Title]
- Main content: Centered, max-width 900px

### Header Section
- Job title (H1, large)
- Company name (H2, links to `/company/[id]`) with logo
- Location + Remote badge (if applicable)
- Job type badge + Seniority badge
- Posted date
- Primary CTA: "Apply Now" button (links to original ATS URL)

### Job Details Section
- Full job description (from original posting)
- Responsibilities (bullet list or sections)
- Requirements/Qualifications
- Benefits (if available)
- Application deadline (if available)

### Context Card (sidebar or bottom)
- Company info card:
  - Company logo + name (link to company profile)
  - Industry + Location
  - Funding stage + Year founded
  - Team size
  - "View all X jobs at [Company]" link

### Related Jobs Section
- "Similar roles at other companies"
- 4-6 job cards (same design as `/jobs` listings)
- Filter criteria: similar skills, same location, same seniority

### Back Navigation
- "← Back to job search" link (preserves search query if from `/jobs`)

---

## Page 6: Company Profile Page (/company/[id])

### Page Layout
- Breadcrumb: Home > Companies > [Company Name]
- Header: Company branding section
- Two-column below header: Company info (left) + Open positions (right)

### Header Section
- Company logo (100x100, prominent)
- Company name (H1)
- One-line tagline/description (if available)
- "View on [Company Website]" button (external)
- "Careers Page" button (external link to ATS)

### Left Column - Company Info
- About section: Company description
- Details grid:
  - Industry
  - Location (city, province)
  - Funding stage
  - Year founded
  - Team size
  - Website link
- Latest posting date: "Last posted a job [time ago]"
- Similar companies: 3-4 company cards

### Right Column - Open Positions
- Tabs: All Jobs, Engineering, Product, Design, Marketing, Other
- Job filter: Search by keyword
- Job listings (cards, no company logo - implied)
- Sort dropdown: Most Recent, Alphabetical
- Empty state: "This company isn't hiring right now" + "Follow for updates" (future)

### Back Navigation
- "← Back to companies" link

---

## Design System Integration

### Color Usage
- **Primary Actions:** auburn-800 (buttons, links)
- **Links:** maritime-700 (default), maritime-800 (hover)
- **Backgrounds:** linen-100 (main), linen-50 (cards)
- **Text:** charcoal-1000 (primary), charcoal-800 (muted)
- **Borders:** charcoal-200
- **Accents:** nickel-100, steel-200 for secondary elements

### Typography
- **Font:** Geist Sans (primary), Geist Mono (code/data)
- **Headings:** H1 (job/company titles), H2 (sections)
- **Body:** Readable, professional

### Component Guidelines
- Buttons: Rounded-full, consistent padding
- Cards: Subtle borders, hover lift effects
- Badges: Small, pill-shaped for job types/locations
- Forms: Clean inputs with clear labels

### Responsive Breakpoints
- Mobile: Stacked vertical layouts
- Tablet: 2-column grids
- Desktop: 3-4 column grids, sidebars enabled

---

## Accessibility Considerations

- Semantic HTML (proper heading hierarchy, landmarks)
- Focus states on all interactive elements
- ARIA labels for screen readers
- Keyboard navigation support
- Color contrast compliance (WCAG AA)
- Alt text for company logos

---

## Performance Considerations

- Server-side rendering for all pages
- Image optimization for company logos
- Lazy loading for long job/company lists
- Minimal client-side JavaScript
- Efficient pagination (avoid loading all results at once)

---

## Future Enhancements (Out of Scope)

- User accounts for saving jobs/alerts
- Advanced salary filters with ranges
- Job application tracking
- Email notifications for new jobs
- Analytics dashboard for job seekers
- Company comparison features
- Mobile app

---

## Approval

✅ Design approved by user on February 27, 2026
✅ All sections validated
✅ Ready for implementation planning
