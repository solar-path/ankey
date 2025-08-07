# Task list

0. concept
   - apply DRY
   - use bun (hashpassword, etc) and node (crypto.uuid, etc) methods
   - majority packages has been installed (need your recomendation on export pdf, excel and import excel - upload only new and changed records)
   - use \*.routes.ts (hono) to isolate close by logic methods.
   - SOX and SOC report compliance:
     - apply safe-delete approach
     - propose solution for saving logs in database (user do action a, value in table x changed, etc..)
     - ~~auth.setting.ts - setup ups authentication and provide authServices that might be called in routes~~
     - ~~rbac.settings.ts - setups role base access control: permission, role, roleUser and provide rbacService~~
   - ~~doa.setting.ts - setups delegeation of authories and provide doaService~~
   - ~~email.settings.ts - setup nodemail and templates~~

~~1. built multi-tenancy app where:~~ - ~~core - handle tenants: list all tenants, get number of users, estimates billing (per user per month -$25)~~ - ~~tenant is workspace with:~~ - ~~subdomain workspaceA.localhost, workspaceB.localhost~~ - ~~tenant-per-database isolation (postgresql)~~ - ~~reserve tenant routes:~~ - ~~shop.localhost - for online sales~~ - ~~hunt.localhist - for head hunting~~ - ~~edu.localhost - for education portal~~ - ~~swap.localhost - for exchanging e-papers~~ - ~~prepopulate core admin user (email: "itgroup.luck@gmail.com", password: "Mir@nd@32", two-factor authentication - via email )~~

~~2. when user registers (workspace, fullname, email, password) at core:~~ - ~~slugify workspace name to subdomain~~ - ~~create tenant database with name "workspaceA" (or slugified name)~~ - ~~migrate tenant database with schema from tenant~~ - ~~seed tenant database~~ - ~~email user readiness to use workspace (url)~~
~~3. no registration at tenant, only login.~~
~~4. tenant and core (both) has loginForm, forgotPasswordForm that shall be opened via QDrawer.~~
~~5. new users:~~ - ~~invited (form is populated, sends email),~~ - ~~fills letMeInForm (via QDrawer) - that later shall be approved~~
~~6. each hono action shall be threated as permission.~~
~~7. permissions shall be collected based on \*.routes.ts content and recorded to permision table and has sync button to update permisisons~~
~~8. roles is CRUD~~
~~9. assignment of roles to users is crud~~

~~10. store types and zod models in shared folder~~
~~11. use react-hook-form in frontend~~
~~12. use @ alias to fix imports~~
~~13. define in package.json commands to debug, generate and migrate (core and tenant) drizzle models~~ 14. Implement PDF/Excel export functionality for reports and user data. apply DRY principle (maybe do standalone service or "controller") 15. Create Excel import functionality to upload and sync new/changed records only 16. debug issues - do not create new files 17. where required always use lucide-react icons 18. core shall have publicly available pages: - index.tsx (update to resolve issues) - terms.mdx (draft content with respect to the current project) - privacy.mdx (draft content with respect to the current project) - cookies.mdx (draft content with respect to the current project) - learn, with: - md/mdx files that are guides and rendered - standalone layout: - left side - list of all _.mdx files - content - main - right side - table of content based on _.mdx file content - pricing.tsx - with hono controller. The key feature of pricing - application users might have access to fully functional tenant for 5 user for 1 week. CRUD - module (general - what would be implemented in tenant, accounting and reserved in core parts) - pricing plan per user per month - features - discount %, start, end. - etc - add what is usually required
layout for pages is drafted at /(public)/publicLayout.tsx - refactor to comply with tanstack-router requirements 18. core shall have protected page /dashboard 19. core shall have the following forms that are accessable via QDrawer (/src/components/QDrawer/_): - inquiryForm.tsx - modify to add attachments (review at /src/components/inquiry/_) - findInquiryForm.tsx (review at /src/components/inquiry/\*) - loginForm - registerForm - forgotPassword 19. all forms shall be supported with core controllers. 20. define formatOnSave for eslinter and prettier in vscode settings
