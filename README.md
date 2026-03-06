# PharmaSOP AI

PharmaSOP AI is a responsive SaaS-style web application MVP for creating GMP-compliant Standard Operating Procedures (SOPs) for pharmaceutical operations.

## Key capabilities

- Authentication (register/login/logout) with user-isolated SOP libraries.
- Dashboard with quick actions: create SOP, templates, recent SOPs, library, and account settings.
- SOP generation wizard with required pharmaceutical metadata fields.
- Automatic SOP numbering in the format `DepartmentCode/SOP/SerialNumber`.
- SOP drafting with mandatory regulatory structure:
  1. Purpose
  2. Scope
  3. Responsibilities
  4. Accountability
  5. Definitions and Abbreviations
  6. Procedure
  7. Safety Precautions
  8. Records and Forms
  9. References
  10. Annexures
  11. Revision History
- Built-in responsibility matrix table.
- Rich text editor for post-generation refinement (headings, lists, tables, annexure insertion).
- SOP template library for common pharma SOP categories.
- Personal document library with search, edit, duplicate, and delete.
- Export actions for PDF (print workflow) and DOCX download.
- Responsive interface for desktop, tablet, and mobile.

## Tech stack

- HTML5
- CSS3 (responsive SaaS design)
- Vanilla JavaScript
- LocalStorage for MVP persistence

## Run locally

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.
