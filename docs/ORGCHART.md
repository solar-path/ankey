# Organizational Chart Module

Hierarchical organizational structure management with inline editing inspired by Asana.

## Overview

The OrgChart module provides a multi-level hierarchical structure for managing:
1. **OrgChart** - Top-level organizational chart document
2. **Department** - Organizational units with headcount limits
3. **Position** - Job positions within departments with salary ranges
4. **Appointment** - User assignments to positions

## Architecture

### Database Structure

All documents are stored in the **partitioned CouchDB database** `orgcharts` using partition key pattern:
```
company:{companyId}:orgchart_{id}
company:{companyId}:dept_{id}
company:{companyId}:pos_{id}
company:{companyId}:appt_{id}
```

### Hierarchy

```
OrgChart (level 0)
  ├─ Department (level 1)
  │   ├─ Position (level 2)
  │   │   └─ Appointment (level 3)
  │   └─ Position (level 2)
  │       └─ Appointment (level 3)
  └─ Department (level 1)
      └─ Sub-Department (level 2)
          └─ Position (level 3)
              └─ Appointment (level 4)
```

## Lifecycle & Status

### OrgChart Statuses

1. **draft** - Initial state, fully editable
2. **pending_approval** - Submitted for review, read-only
3. **approved** - Active and enforced, read-only
4. **revoked** - Replaced by newer version, read-only

### Temporal Validity

- `enforcedAt` - When orgchart becomes active (set on approval)
- `revokedAt` - When orgchart was revoked

## Permissions Matrix

| Entity | Draft | Pending/Approved/Revoked | Notes |
|--------|-------|-------------------------|-------|
| **OrgChart** | CRUD | cRud | d = status change only |
| **Department** | CRUD | cRUd | U = charter only |
| **Position** | CRUD | cRUd | U = job description only |
| **Appointment** | CRUD | CRUD | Always fully editable |

Legend:
- **CRUD** = Create, Read, Update, Delete allowed
- **cRud** = Only Read allowed
- **cRUd** = Read and limited Update allowed

## Auto-Creation Rules

### When creating Department:
Automatically creates:
- Position: `"Head of ${department.title}"`
- Appointment: `"Vacant"`

### When creating Position:
Automatically creates:
- Appointment: `"Vacant"`

## Cascade Delete Rules

- **Delete Department** → Deletes all Positions → Deletes all Appointments
- **Delete Position** → Deletes all Appointments
- **Delete Appointment** → No cascade

## Document Types

### OrgChart

```typescript
{
  _id: "company:ABC:orgchart_123",
  type: "orgchart",
  companyId: "ABC",
  title: "2024 Organizational Structure",
  description: "Q1 restructuring",
  status: "approved",
  enforcedAt: 1710000000000,
  revokedAt: null,
  approvedAt: 1709900000000,
  approvedBy: "user_456"
}
```

### Department

```typescript
{
  _id: "company:ABC:dept_789",
  type: "department",
  companyId: "ABC",
  orgChartId: "orgchart_123",
  parentDepartmentId: null, // or "dept_456" for nested
  title: "Engineering",
  code: "ENG-001",
  headcount: 50, // Max positions allowed
  charter: {
    mission: "Build great products",
    objectives: ["..."],
    responsibilities: ["..."],
    kpis: ["..."]
  },
  level: 1,
  sortOrder: 1710000000000
}
```

### Position

```typescript
{
  _id: "company:ABC:pos_101",
  type: "position",
  companyId: "ABC",
  orgChartId: "orgchart_123",
  departmentId: "dept_789",
  title: "Senior Software Engineer",
  code: "ENG-001-SSE",
  salaryMin: 100000,
  salaryMax: 150000,
  salaryCurrency: "USD",
  salaryFrequency: "annual",
  jobDescription: {
    summary: "...",
    responsibilities: ["..."],
    requirements: ["..."],
    qualifications: ["..."]
  },
  level: 2,
  sortOrder: 1710000000001
}
```

### Appointment

```typescript
{
  _id: "company:ABC:appt_202",
  type: "appointment",
  companyId: "ABC",
  orgChartId: "orgchart_123",
  departmentId: "dept_789",
  positionId: "pos_101",
  userId: "user_999", // or undefined if vacant
  isVacant: false,
  jobOffer: {
    salary: 120000,
    salaryCurrency: "USD",
    salaryFrequency: "annual",
    startDate: 1710500000000,
    benefits: ["..."],
    conditions: ["..."]
  },
  employmentContractSignedAt: 1710400000000,
  employmentStartedAt: 1710500000000,
  employmentEndedAt: null,
  terminationNoticeIssuedAt: null,
  level: 3,
  sortOrder: 1710000000002
}
```

## UI Components

### QTableHierarchical

Enhanced table component for hierarchical data with:
- **Expand/Collapse** - ChevronRight/ChevronDown icons
- **Indent** - Visual hierarchy with configurable indent size (default 24px)
- **Inline Editing** - Click-to-edit cells (Asana-style)
- **Add Child** - Plus button appears on hover
- **Row Actions** - Dropdown menu with context-specific actions
- **Search** - Filter across all levels

### Usage Example

```typescript
<QTableHierarchical
  columns={columns}
  data={orgChartRows}
  searchable
  defaultExpanded
  indentSize={32}
  inlineEdit={[
    {
      field: "title",
      type: "text",
      onSave: async (row, value) => {
        await updateDocument(row, { title: value });
      },
      canEdit: (row) => hasPermission(row),
    }
  ]}
  rowActions={[
    {
      label: "Add Department",
      icon: <Building2 />,
      onClick: (row) => createDepartment(row),
      show: (row) => row.type === "orgchart",
    }
  ]}
/>
```

## Generated Documents

PDF generation is implemented using **jsPDF** library with professional templates for all documents:

### 1. Department Charter
**Trigger**: Right-click on Department → "Generate PDF"

**Includes**:
- Department Information (name, code, headcount)
- Mission statement
- Objectives (bullet list)
- Responsibilities (bullet list)
- Key Performance Indicators (bullet list)
- Approval signatures section

**Filename**: `Department_Charter_{code}.pdf`

### 2. Job Description
**Trigger**: Right-click on Position → "Generate PDF"

**Includes**:
- Position Information (title, code, department)
- Compensation Range (min/max salary with frequency)
- Job Summary
- Key Responsibilities (bullet list)
- Requirements (bullet list)
- Qualifications (bullet list)
- Benefits (bullet list)
- Disclaimer text

**Filename**: `Job_Description_{code}.pdf`

### 3. Job Offer Letter
**Trigger**: Right-click on Appointment (non-vacant) → "Generate PDF"

**Includes**:
- Formal letter format with date
- Candidate name and address
- Position details
- Start date
- Compensation (salary with frequency)
- Benefits (bullet list)
- Terms and conditions (bullet list)
- Acceptance signature section

**Filename**: `Job_Offer_{position_code}.pdf`

### 4. Employment Contract
**Available via**: `PDFGeneratorFactory.generateEmploymentContract()`

**Includes**:
- Parties to Agreement (Employer + Employee)
- Position and Duties
- Compensation details
- Commencement Date
- Benefits enumeration
- Termination clause
- Confidentiality agreement
- Governing law
- Signature sections for both parties

**Filename**: `Employment_Contract_{employeeId}.pdf`

### 5. Termination Notice
**Available via**: `PDFGeneratorFactory.generateTerminationNotice()`

**Includes**:
- Formal letter format
- Employee identification
- Position information
- Termination date
- Reason for termination (optional)
- Final compensation details
- Company property return list
- Benefits continuation (COBRA)
- Confidentiality reminder
- Signature and acknowledgement sections

**Filename**: `Termination_Notice_{employeeId}.pdf`

### PDF Features

✅ Professional layout with headers and footers
✅ Company branding (name, logo, contact info)
✅ Auto page numbering
✅ Page breaks for long content
✅ Signature lines with date fields
✅ Bullet point formatting
✅ Currency formatting (Intl.NumberFormat)
✅ Legal disclaimers where appropriate

## API Service

### OrgChartService

```typescript
// OrgChart
OrgChartService.createOrgChart(companyId, userId, data)
OrgChartService.getCompanyOrgCharts(companyId)
OrgChartService.updateOrgChart(companyId, orgChartId, userId, updates)
OrgChartService.submitForApproval(companyId, orgChartId, userId)
OrgChartService.approve(companyId, orgChartId, userId)
OrgChartService.revoke(companyId, orgChartId, userId)

// Department
OrgChartService.createDepartment(companyId, userId, data)
OrgChartService.updateDepartment(companyId, departmentId, userId, updates)
OrgChartService.deleteDepartment(companyId, departmentId) // Cascade delete

// Position
OrgChartService.createPosition(companyId, userId, data)
OrgChartService.updatePosition(companyId, positionId, userId, updates)
OrgChartService.deletePosition(companyId, positionId) // Cascade delete

// Appointment
OrgChartService.createAppointment(companyId, userId, data)
OrgChartService.updateAppointment(companyId, appointmentId, userId, updates)
OrgChartService.deleteAppointment(companyId, appointmentId)

// Hierarchical view
OrgChartService.getOrgChartHierarchy(companyId, orgChartId)
```

## Files

```
src/modules/htr/orgchart/
├── orgchart.types.ts           # TypeScript types and interfaces
├── orgchart-service.ts         # Business logic and CouchDB operations
├── pdf-generator.service.ts    # PDF document generation (5 templates)
└── orgchartView.page.tsx       # UI page component

src/lib/ui/
└── QTableHierarchical.ui.tsx   # Hierarchical table component

docs/
└── ORGCHART.md                 # This documentation
```

## Dependencies

```json
{
  "jspdf": "^3.0.3",
  "jspdf-autotable": "^5.0.2"
}
```

## Key Features

✅ Hierarchical structure with unlimited nesting
✅ Inline editing (Asana-style)
✅ Cascade delete protection
✅ Auto-creation of head positions
✅ Temporal validity tracking
✅ Status-based permissions
✅ Partitioned CouchDB for data isolation
✅ Real-time search and filtering
✅ Expand/collapse navigation
✅ **Professional PDF generation for all 5 document types**
✅ **One-click PDF download from context menu**
✅ **Customizable company branding in PDFs**
✅ **Auto-formatted currency and dates**

## Roadmap

- [x] ~~PDF document generation~~ **COMPLETED**
- [ ] Approval workflow with notifications
- [ ] Department/Position templates
- [ ] Bulk import/export
- [ ] Org chart visualization (tree view)
- [ ] Historical version comparison
- [ ] Employment Contract PDF with e-signature integration
- [ ] Termination Notice PDF workflow
- [ ] PDF storage in CouchDB attachments
- [ ] Email PDF documents directly from app
