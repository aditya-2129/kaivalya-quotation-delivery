# Quotation Maker

> A comprehensive, full-stack quotation management system for machine shops, enabling engineers to create, manage, and export professional quotations with real-time cost calculations.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev)
[![Appwrite](https://img.shields.io/badge/Appwrite-23-f02e65?logo=appwrite)](https://appwrite.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38b2ac?logo=tailwindcss)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Usage Guide](#usage-guide)
- [Architecture & Design Patterns](#architecture--design-patterns)
- [Development](#development)
- [Deployment](#deployment)
- [API & Services](#api--services)
- [Troubleshooting](#troubleshooting)
- [Additional Documentation](#additional-documentation)
- [License](#license)

---

## Overview

**Quotation Maker** is a production-ready web application designed specifically for machine shops and manufacturing facilities. It streamlines the quotation process by:

- **Creating complex quotations** with 7-step wizard forms covering scope, materials, machining logic, and commercial adjustments
- **Managing quotation lifecycle** from draft to approval to completion with full audit trails
- **Maintaining inventory** of materials, labor rates, and bought-out parts with real-time cost calculations
- **Generating professional documents** in multiple formats (PDF variants, Excel workbooks) with company branding
- **Tracking business metrics** with revenue trends, cost breakdowns, and purchase order analytics

### Who Is This For?

- **Machine Shop Engineers** – Create and manage quotations efficiently
- **Project Managers** – Track quotation status and business metrics
- **Administrators** – Manage users, inventory, and system settings
- **Business Owners** – Monitor revenue trends and quotation metrics

### Key Differentiators

1. **Real-Time Cost Calculations** – Instantly see cost updates as you modify quotations
2. **Multi-Format Export** – Generate specialized PDFs (cost summary, material list, manufacturing process sheet, BOP list) or Excel workbooks
3. **Role-Based Access** – Admin and regular user roles with distinct permissions
4. **Professional Document Generation** – Branded, publication-ready PDFs and Excel exports

---

## Key Features

### 1. Core Quotation System

Create detailed quotations through a 7-section wizard form:

- **Section 1 - Scope & Identity**: Customer details, project information, dates, project images/CAD file uploads
- **Section 2 - BOM Registry**: Define parts/components list with images and design file references
- **Section 3 - Raw Material**: Select materials (steel grades, shapes) with automatic dimension/weight calculations
- **Section 4 - Machining Logic**: Add manufacturing processes (drilling, cutting, welding, assembly) with labor rates and time estimates
- **Section 5 - Brought-Out Parts**: Include purchased components (fasteners, subassemblies) from vendor library or manual entry
- **Section 6 - Commercial Adjustments**: Apply project-wide extras (packaging, transport, design costs, assembly fees)
- **Section 7 - Valuation Ledger**: Real-time cost breakdown sidebar with material costs, labor costs, markup slider, and final pricing

### 2. Quotation Lifecycle Management

- **Draft Quotations** – Create and edit quotations freely
- **Approval Workflow** – Submit quotations for approval; admins can approve, reject, or request modifications
- **Status Tracking** – Monitor quotation states: Draft → Approved → Completed/Rejected/Cancelled
- **Quotations List** – Search, filter, and paginate through all quotations with status indicators
- **Approved Quotations Dashboard** – View approved quotations with revenue metrics and filtering options

### 3. Inventory Management

**Materials Library**
- Add steel grades with base rates, density, and available shapes
- Search and filter materials
- Edit and delete material entries

**Labor Rates**
- Define process-specific rates: hourly, per-piece, per-hole, per-tap, per square cm
- Manage rates for drilling, cutting, welding, assembly, and custom processes

**BOP (Brought-Out Parts) Library**
- Maintain supplier information and part pricing
- Quick-add from library or manual entry in quotations
- Search and filter functionality

### 4. Business Intelligence & Analytics

**Dashboard**
- Total quotation count and customer count
- Month-over-month revenue trends (percentage change comparison)
- List of 5 most recent quotations
- Quick access to key metrics

**Approved Quotations Metrics**
- View revenue aggregated by engineer
- Date range filtering
- Revenue summaries

**Purchase Orders Tracking**
- Monitor active purchase orders
- Average order value and metrics

### 5. Document Generation & Export

**PDF Variants**
- **Full Quotation PDF**: Multi-page document with company branding, detailed tables, cost breakdown
- **Cost Summary PDF**: Single-page cost summary for quick review
- **Material Cost Report PDF**: Material-focused breakdown
- **Manufacturing Process Sheet PDF**: Process details and labor requirements
- **BOP List PDF**: Bought-out parts inventory

**Excel Export**
- Professional workbook with styled cells
- Multiple sheets for different data sections
- Formulas for automatic calculations
- Ready for business review and archival

### 6. User Management & Authentication

- **Email/Password Authentication** – Secure login with session management
- **Forgot Password / Reset Password** – Token-based password recovery via email
- **Role-Based Access Control**:
  - **Admin Users**: Create users, manage inventory, access user management panel, full system access
  - **Regular Users**: Create and manage quotations, view metrics, edit inventory items
- **User Profiles** – Linked to authentication system with email and role information
- **Route Protection** – Unauthorized access automatically redirected to login

### 7. File Management

- **Upload Project Assets** – Images, CAD files, inquiry documents
- **File Preview/Download** – Access stored files directly
- **Organized Storage** – Files organized by project in Appwrite storage buckets
- **Integration** – Files linked to quotations and accessible throughout the form

---

## Tech Stack

### Frontend & Framework
- **Next.js 16** – React framework with App Router for file-based routing
- **React 19** – UI component library with hooks and context
- **TypeScript 6** – Type-safe development
- **Tailwind CSS 4** – Utility-first CSS framework
- **Lucide React** – Icon library

### State Management
- **TanStack Query 5** – Server state management with automatic caching and invalidation
- **React Context API** – Application-wide authentication state
- **React Hooks** – Local component state management (useState, useCallback, etc.)

### Backend & BaaS
- **Appwrite 23** – Backend-as-a-Service for authentication, database, and file storage
- **Collections** – Structured data for customers, materials, rates, quotations, etc.
- **Buckets** – File storage for project images, CAD files, and documents
- **Authentication** – Email/password with JWT sessions

### Document Generation
- **jsPDF** – PDF generation from HTML/DOM
- **jsPDF-AutoTable** – Table rendering in PDFs
- **xlsx-js-style** – Excel workbook generation with cell styling

### Utilities
- **date-fns** – Date manipulation and formatting
- **react-hot-toast** – Toast notifications for user feedback
- **clsx + tailwind-merge** – Conditional class name utilities

### Development Tools
- **ESLint 9** – Code linting
- **Node.js** – JavaScript runtime (v18+ recommended)

---

## Project Structure

```
quotation-maker/
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── page.jsx                  # Dashboard home
│   │   ├── login/                    # Authentication pages
│   │   ├── forgot-password/
│   │   ├── reset-password/
│   │   ├── quotations-draft/         # Draft quotations list & form
│   │   ├── quotations-approved/      # Approved quotations dashboard
│   │   ├── confirmed-orders/         # Purchase orders tracking
│   │   ├── customers/                # Customer management
│   │   ├── materials/                # Materials inventory
│   │   ├── labor-rates/              # Labor rates management
│   │   ├── bop-library/              # BOP items library
│   │   ├── process-&-tooling/        # Process definitions
│   │   └── admin/
│   │       └── users/                # User management (admin only)
│   │
│   ├── features/                     # Domain-driven modules
│   │   ├── quotations/
│   │   │   ├── api/                  # Custom hooks (useQuotations, useApprovedQuotations, etc.)
│   │   │   ├── components/           # 7-section form panels
│   │   │   └── utils/                # calculations.js (cost logic)
│   │   ├── admin/
│   │   ├── customers/
│   │   ├── dashboard/
│   │   └── inventory/
│   │
│   ├── services/                     # Appwrite SDK wrappers
│   │   ├── auth.js                   # Authentication service
│   │   ├── users.js                  # User management
│   │   ├── customers.js              # Customer CRUD
│   │   ├── materials.js              # Materials CRUD
│   │   ├── rates.js                  # Labor rates CRUD
│   │   ├── quotations-draft.js       # Draft quotations CRUD
│   │   ├── quotations-approved.js    # Approved quotations CRUD
│   │   ├── purchase-orders.js        # Purchase orders queries
│   │   ├── dashboard.js              # Dashboard data aggregation
│   │   └── assets.js                 # File upload/download
│   │
│   ├── components/
│   │   ├── layout/                   # App layout components
│   │   │   ├── AuthGuard.jsx         # Route protection
│   │   │   ├── DashboardLayout.jsx   # Main app layout
│   │   │   ├── Header.jsx            # Top navigation
│   │   │   └── Sidebar.jsx           # Side navigation
│   │   ├── modals/                   # ~10 modal components
│   │   │   ├── ConfirmModal.jsx
│   │   │   ├── PreviewPDFModal.jsx
│   │   │   └── ...
│   │   └── ui/                       # Reusable design system
│   │       ├── Button.jsx
│   │       ├── Input.jsx
│   │       ├── Table.jsx
│   │       ├── Pagination.jsx
│   │       └── ...
│   │
│   ├── context/
│   │   └── AuthContext.jsx           # App-wide authentication state
│   │
│   ├── providers/
│   │   └── index.jsx                 # TanStack Query client setup
│   │
│   ├── lib/
│   │   └── appwrite.js               # Appwrite SDK initialization
│   │
│   ├── constants/
│   │   ├── appwrite.js               # Collection & bucket IDs
│   │   ├── ui.js                     # Theme, colors, spacing, z-indexes
│   │   └── pdfConstants.js           # Company branding for PDFs
│   │
│   ├── utils/
│   │   ├── format.js                 # formatCurrency (INR), formatDecimal
│   │   ├── generateQuotationPDF.js   # PDF generation logic
│   │   ├── generateCostSummaryPDF.js
│   │   ├── generateMaterialCostPDF.js
│   │   ├── generateProcessSheetPDF.js
│   │   ├── generateBOPListPDF.js
│   │   └── exportToExcel.js          # Excel export logic
│   │
│   └── hooks/
│       └── useAssets.js              # File upload/delete wrapper
│
├── public/                           # Static assets
├── package.json                      # Dependencies & scripts
├── next.config.mjs                   # Next.js configuration
├── tailwind.config.js                # Tailwind CSS theme
├── jsconfig.json                     # Path aliases (@/*)
├── tsconfig.json                     # TypeScript configuration
├── .env                              # Environment variables
├── .env.example                      # Environment variables template
├── eslint.config.mjs                 # ESLint configuration
├── postcss.config.mjs                # PostCSS setup
├── appwrite.config.json              # Appwrite collections & roles
├── CLAUDE.md                         # Comprehensive architectural guide
├── ARCHITECTURE.md                   # Module organization details
├── AGENTS.md                         # Critical breaking changes & coding rules
└── README.md                         # This file
```

**Key Directories Explained**

- **`app/`** – Next.js page components
- **`features/`** – Feature-based modules organized by domain
- **`services/`** – Low-level Appwrite SDK wrappers
- **`components/`** – Reusable UI components and layout components
- **`context/`** – React Context for global state (authentication)
- **`constants/`** – Configuration and constants (collection IDs, themes, branding)
- **`utils/`** – Utility functions (formatting, PDF generation, Excel export)

---

## Getting Started

### Prerequisites

- **Node.js** 18.17+ (check with `node --version`)
- **npm** or **yarn** package manager
- **Appwrite** instance (cloud or self-hosted) with a project set up
- **Git** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/quotation-maker.git
   cd quotation-maker
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your Appwrite credentials:
   ```env
   NEXT_PUBLIC_APPWRITE_ENDPOINT=https://your-appwrite-instance.com/v1
   NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_APPWRITE_API_KEY=your-api-key
   ```

4. **Configure Appwrite** (if using self-hosted)
   - Ensure collections are created according to `appwrite.config.json`
   - Set up authentication and file storage buckets
   - Configure roles and permissions for admin/user access

### Running the Application

#### Web Version (Development)
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Web Version (Production Build)
```bash
npm run build
npm run start
```

### First Login

1. Default login credentials (if seeded):
   - **Email**: `admin@example.com`
   - **Password**: (set during Appwrite setup)

2. Navigate to dashboard after login
3. Start creating quotations or managing inventory

---

## Configuration

### Environment Variables

Create a `.env` file in the root directory with these variables:

```env
# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://your-appwrite-instance.com/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
NEXT_PUBLIC_APPWRITE_API_KEY=your-api-key

# Optional: Application settings
NEXT_PUBLIC_APP_NAME=Quotation Maker
NEXT_PUBLIC_COMPANY_NAME=Your Company Name
```

**Variable Descriptions**

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_APPWRITE_ENDPOINT` | Appwrite API endpoint URL |
| `NEXT_PUBLIC_APPWRITE_PROJECT_ID` | Your Appwrite project ID |
| `NEXT_PUBLIC_APPWRITE_API_KEY` | Appwrite API key with collection access |
| `NEXT_PUBLIC_APP_NAME` | Application display name |
| `NEXT_PUBLIC_COMPANY_NAME` | Your company name (used in PDF branding) |

### Appwrite Collections Setup

The application uses the following Appwrite collections (defined in `appwrite.config.json`):

| Collection | Purpose |
|-----------|---------|
| `customers` | Customer information and contacts |
| `materials` | Steel grades, shapes, and pricing |
| `labor_rates` | Process-specific labor costs |
| `bop_items` | Bought-out parts and suppliers |
| `quotations_draft` | Draft quotations (editable) |
| `quotations_approved` | Approved quotations (locked) |
| `purchase_orders` | Tracked purchase orders |
| `users` | User accounts and roles |

See `appwrite.config.json` for detailed collection schema.

### Tailwind CSS Customization

Customize theme colors and spacing in `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#your-color',
      },
    },
  },
}
```

### PDF Branding

Customize PDF templates in `src/constants/pdfConstants.js`:
- Company logo and name
- Header/footer text
- Color scheme
- Font selections

---

## Usage Guide

### Creating a Quotation

1. **Navigate to "Create Quotation"** (from sidebar or dashboard)
2. **Fill out the 7 sections**:
   - **Scope & Identity**: Customer name, project title, dates, upload project images/CAD files
   - **BOM Registry**: Add parts with images and design references
   - **Raw Material**: Select material type, shape, and dimensions
   - **Machining Logic**: Add processes (drilling, cutting, etc.) with labor rates
   - **Brought-Out Parts**: Add fasteners, subassemblies from library or manual entry
   - **Commercial Adjustments**: Add packaging, transport, design, assembly costs
   - **Valuation Ledger**: Review cost breakdown; adjust markup with slider

3. **Save as Draft** – Auto-saves as you type
4. **Submit for Approval** – When ready, submit quotation
5. **Track Status** – View in quotations list until approved

### Managing Quotations

**Draft Quotations**
- Navigate to "Quotations - Draft"
- Search by customer, engineer, or project name
- Click to edit or view PDF preview
- Delete draft quotations (irreversible)

**Approved Quotations**
- View approved quotations with revenue metrics
- Filter by date range and engineer
- Access for reference or re-quotation

**Actions Available**
- **View PDF** – Quick PDF preview
- **Export PDF** – Download for sharing
- **Export Excel** – Detailed spreadsheet export
- **Edit** (draft only) – Modify draft quotations
- **Approve** (admin) – Mark as approved
- **Reject** (admin) – Send back for revision

### Inventory Management

**Materials**
1. Go to "Materials"
2. Click "Add Material"
3. Enter material name, base rate, density, available shapes
4. Save and use in quotations

**Labor Rates**
1. Go to "Labor Rates"
2. Select process type
3. Set rate (hourly, per-piece, per-hole, etc.)
4. Available in machining logic section

**BOP Items**
1. Go to "BOP Library"
2. Add supplier information and part details
3. Set base pricing
4. Quick-add in quotation brought-out parts section

### Generating Exports

**PDF Exports**
1. View approved quotation
2. Select from PDF variants:
   - Full Quotation (complete details)
   - Cost Summary (single page)
   - Material Cost Report
   - Manufacturing Process Sheet
   - BOP List (parts only)
3. Download or share

**Excel Export**
1. Select quotation
2. Click "Export to Excel"
3. Receives styled workbook with multiple sheets
4. Formulas auto-calculate updates

### Viewing Analytics

**Dashboard**
- Month-over-month revenue comparison
- Recent quotations summary
- Total metrics (quotations, customers, materials)

**Approved Quotations Metrics**
- Revenue by engineer
- Date range filtering
- Total approved revenue

**Purchase Orders**
- Track active orders
- Monitor average order value

### User Management (Admin Only)

**Create Users**
1. Go to "Admin → Users"
2. Click "Create User"
3. Enter email and set password
4. Assign role (Admin or Regular)
5. User receives email confirmation

**Reset Password**
1. User clicks "Forgot Password" on login
2. Enters email address
3. Receives reset link via email
4. Sets new password

---

## Architecture & Design Patterns

### Feature-Based Module Organization

The codebase is organized by feature/domain rather than by layer (components, hooks, utils). This promotes:
- **Encapsulation** – Each feature contains related logic
- **Scalability** – Easy to add/remove features
- **Maintainability** – Clear boundaries between features

Example: `features/quotations/` contains API hooks, components, and utilities specific to quotations.

### Service Layer Abstraction

Low-level Appwrite SDK wrappers in `services/` provide:
- **Decoupling** – UI components don't directly call Appwrite
- **Consistency** – Single source of truth for database operations
- **Error Handling** – Centralized error management

```javascript
// services/quotations-draft.js
export async function createQuotation(data) {
  const database = new Appwrite.Databases(client);
  return database.createDocument(
    DATABASE_ID,
    QUOTATIONS_DRAFT_ID,
    ID.unique(),
    data
  );
}
```

### TanStack Query for Server State

All server data is fetched via TanStack Query custom hooks:
- **Automatic Caching** – Queries are cached and reused
- **Background Refetch** – Stale data automatically refreshed
- **Invalidation** – Manual control over cache invalidation

```javascript
// features/quotations/api/useQuotations.js
export function useQuotations() {
  return useQuery({
    queryKey: ['quotations-draft'],
    queryFn: () => fetchQuotations(),
  });
}
```

### Form State Management

Single `formData` object in page component with spread updates:
```javascript
const [formData, setFormData] = useState({
  scope: {},
  materials: [],
  ...
});

// Update nested field
setFormData(prev => ({
  ...prev,
  scope: { ...prev.scope, customerName: value }
}));
```

### Pure Calculation Logic

`calculateQuotationTotals()` in `utils/calculations.js` is a pure function:
- No side effects or external dependencies
- Easy to test and reason about
- Reusable across web and desktop versions

```javascript
export function calculateQuotationTotals(formData) {
  const materialCost = calculateMaterialCost(formData.materials);
  const laborCost = calculateLaborCost(formData.machining);
  // ...
  return { materialCost, laborCost, totalCost };
}
```

### Error Handling

Consistent error handling across the app:
1. **Services** – Try/catch with error logging
2. **Hooks** – Propagate errors to components
3. **Components** – Display user-friendly error messages via toast

---

## Development

### Available Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run start` | Run production build locally |
| `npm run lint` | Run ESLint on codebase |

### Adding New Features

When adding a new feature:

1. **Create feature directory** under `src/features/your-feature/`
2. **Add API hooks** in `api/` subdirectory
3. **Create components** in `components/` subdirectory
4. **Add services** in `src/services/your-feature.js`
5. **Create pages** in `src/app/your-feature/`
6. **Update sidebar** in `components/layout/Sidebar.jsx`

### Code Style & Conventions

- **Component Naming** – PascalCase for components
- **Function Naming** – camelCase for functions and variables
- **File Organization** – Feature-based structure
- **Imports** – Use `@/` path alias (configured in `jsconfig.json`)
- **TypeScript** – Use for type safety (optional, but recommended)
- **Comments** – Only add for non-obvious logic

### Important Constraints

⚠️ **Critical Limitations**

1. **No Dynamic Route Segments** – Use search params (`?id=XYZ`) instead of `[id]` or `[slug]`
2. **Data Fetching** – Use services + TanStack Query; avoid getStaticProps/getServerSideProps

For detailed architectural constraints and patterns, see [CLAUDE.md](CLAUDE.md).

---

## Deployment

### Web Version

**Deployment Platforms**
- **Vercel** – Recommended; optimal for Next.js
- **Netlify** – Static site hosting
- **Self-Hosted** – Any Node.js server (nginx reverse proxy)

**Deployment Steps**
1. Build application: `npm run build`
2. Deploy to your hosting platform
3. Set environment variables on hosting platform
4. Configure Appwrite CORS to allow your domain

**Example: Vercel Deployment**
```bash
npm i -g vercel
vercel
```

### Environment Considerations

**Production Appwrite Setup**
1. Use cloud-hosted Appwrite or secure self-hosted instance
2. Enable HTTPS and proper authentication
3. Set CORS origins to your deployed domains
4. Implement API key rotation and security policies
5. Regular backups and disaster recovery

---

## API & Services

### Appwrite Integration

The application uses Appwrite as the backend, providing:

- **Authentication** – Email/password login with JWT sessions
- **Database** – Collections for all data (quotations, customers, inventory)
- **File Storage** – Buckets for project assets and documents
- **Permissions** – Role-based access control

### Authentication Flow

1. **Login** – User submits email/password
2. **Session Created** – Appwrite returns JWT token
3. **Stored in Context** – `AuthContext` holds user and auth state
4. **Protected Routes** – `AuthGuard` component prevents unauthorized access
5. **Logout** – Session deleted; user redirected to login

### Database Collections

**quotations_draft** (Draft quotations, fully editable)
- Includes all 7-section form data
- Status, dates, customer reference
- Engineering calculations and costs

**quotations_approved** (Approved quotations, locked)
- Archived approved quotations
- Change history and timestamps
- Revenue tracking

**customers** (Customer information)
- Contact details, location, contact person
- Used in scope & identity section

**materials** (Material inventory)
- Steel grades, shapes, base rates
- Density and cost information

**labor_rates** (Process labor rates)
- Drilling, cutting, welding rates
- Hourly and per-piece rates

**bop_items** (Bought-out parts library)
- Supplier information, part descriptions
- Base pricing for quick-add functionality

**users** (User accounts)
- Email, password hash, role
- Authentication and authorization

### File Storage

**inquiry_files** bucket
- Project images, CAD files, inquiry documents
- Organized by quotation ID
- Public or private access per item

See `appwrite.config.json` for complete schema definitions.

### Error Handling Strategy

The application implements a consistent error handling approach:

1. **Try/Catch in Services** – All async operations wrapped
2. **Graceful Fallbacks** – Errors don't crash the app
3. **User Notifications** – Toast messages for user-facing errors
4. **Logging** – Errors logged to console for debugging
5. **Loading States** – UI shows loading/error states during operations

---

## Troubleshooting

### Common Setup Issues

**Q: "Cannot find module '@/'" error**
- **A**: Ensure `jsconfig.json` has path alias configured: `"@/*": "./src/*"`

**Q: "Appwrite connection refused"**
- **A**: Check Appwrite endpoint URL and ensure service is running
- Verify firewall allows outbound connections to Appwrite

**Q: "Collection not found" error**
- **A**: Ensure all collections are created in Appwrite
- Run Appwrite migrations or manually create collections from `appwrite.config.json`

**Q: Environment variables not loading**
- **A**: Ensure `.env` file is in project root (not inside `src/`)
- Restart dev server after changing `.env`
- For `NEXT_PUBLIC_*` variables, they must be prefixed `NEXT_PUBLIC_`

### Appwrite Connection Problems

**Q: "Invalid API key" error**
- **A**: Verify API key in `.env` has correct permissions
- Check that API key is not expired
- Regenerate key from Appwrite console if needed

**Q: "CORS error" when accessing from web**
- **A**: Add your domain to Appwrite CORS whitelist in console
- Format: `http://localhost:3000` for dev, `https://yourdomain.com` for prod

**Q: Cannot upload files**
- **A**: Check bucket name matches `NEXT_PUBLIC_APPWRITE_BUCKET_ID`
- Verify bucket has correct permissions for authenticated users
- Check file size limits in Appwrite configuration

### PDF Generation Issues

**Q: "Image load error" in PDF**
- **A**: Ensure image URLs are accessible and properly formatted
- Use base64-encoded images for embedded content
- Check browser console for specific image URLs that failed

**Q: "Font not available" in PDF**
- **A**: PDF generation uses browser-available fonts
- Add custom fonts in `pdfConstants.js` if needed
- Use standard web-safe fonts for best compatibility

### Performance Optimization

**Q: Slow quotation creation**
- **A**: Check Appwrite query performance
- Review calculation logic in `utils/calculations.js`
- Use React DevTools Profiler to identify bottlenecks

**Q: Large PDF files**
- **A**: Reduce image resolution in project uploads
- Optimize images before upload (max 2MB recommended)
- Review PDF content; remove unnecessary details

---

## Additional Documentation

### Core Documentation Files

- **[CLAUDE.md](CLAUDE.md)** – Comprehensive architectural guide with detailed constraints, patterns, and implementation specifics
- **[ARCHITECTURE.md](ARCHITECTURE.md)** – Module organization and design patterns
- **[AGENTS.md](AGENTS.md)** – Critical breaking changes for Next.js 16 and coding rules

### External Resources

- **[Next.js Documentation](https://nextjs.org/docs)** – Framework documentation
- **[React Documentation](https://react.dev)** – React patterns and best practices
- **[Appwrite Documentation](https://appwrite.io/docs)** – Backend service setup
- **[Tailwind CSS Docs](https://tailwindcss.com/docs)** – CSS framework reference
- **[TanStack Query Documentation](https://tanstack.com/query)** – Server state management

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) file for details.

---

## Credits & Acknowledgments

**Built with**
- Next.js 16 and React 19
- Appwrite Backend-as-a-Service
- Tailwind CSS for styling
- TanStack Query for server state management

**Key Dependencies**
- jsPDF & jsPDF-AutoTable for PDF generation
- xlsx-js-style for Excel export
- Lucide React for icons
- date-fns for date utilities

---

## Support & Contact

For issues, questions, or contributions:

- **Report Issues** – GitHub Issues (if repository is public)
- **Email Support** – contact@yourdomain.com
- **Documentation** – Check [CLAUDE.md](CLAUDE.md) for detailed technical reference
- **Community** – Engage with team members and contributors

---

**Last Updated**: April 2026  
**Version**: 0.1.0  
**Maintained by**: Quotation Maker Team
