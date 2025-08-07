# Task list
0. concept
    - apply DRY
    - use bun (hashpassword, etc) and node (crypto.uuid, etc) methods 
    - majority packages has been installed (need your recomendation on export pdf, excel and import excel - upload only new and changed records)
    - use *.routes.ts (hono) to isolate close by logic methods.
    - SOX and SOC report compliance: 
        - apply safe-delete approach
        - propose solution for saving logs in database (user do action a, value in table x changed, etc..)
        - ~~auth.setting.ts - setup ups authentication and provide authServices that might be called in routes~~
        - ~~rbac.settings.ts - setups role base access control: permission, role, roleUser and provide rbacService~~
    - ~~doa.setting.ts - setups delegeation of authories and provide doaService~~
    - ~~email.settings.ts - setup nodemail and templates~~

~~1. built multi-tenancy app where:~~
    - ~~core - handle tenants: list all tenants, get number of users, estimates billing (per user per month -$25)~~
    - ~~tenant is workspace with:~~
        - ~~subdomain workspaceA.localhost, workspaceB.localhost~~
        - ~~tenant-per-database isolation (postgresql)~~
    - ~~reserve tenant routes:~~
        - ~~shop.localhost - for online sales~~
        - ~~hunt.localhist - for head hunting~~
        - ~~edu.localhost - for education portal~~
        - ~~swap.localhost - for exchanging e-papers~~
    - ~~prepopulate core admin user (email: "itgroup.luck@gmail.com", password: "Mir@nd@32", two-factor authentication - via email )~~

~~2. when user registers (workspace, fullname, email, password) at core:~~
    - ~~slugify workspace name to subdomain~~
    - ~~create tenant database with name "workspaceA" (or slugified name)~~
    - ~~migrate tenant database with schema from tenant~~
    - ~~seed tenant database~~
    - ~~email user readiness to use workspace (url)~~
~~3. no registration at tenant, only login.~~
~~4. tenant and core (both) has loginForm, forgotPasswordForm that shall be opened via QDrawer.~~
~~5. new users:~~
    - ~~invited (form is populated, sends email),~~
    - ~~fills letMeInForm (via QDrawer) - that later shall be approved~~
~~6. each hono action shall be threated as permission.~~
~~7. permissions shall be collected based on *.routes.ts content and recorded to permision table and has sync button to update permisisons~~
~~8. roles is CRUD~~
~~9. assignment of roles to users is crud~~

~~10. store types and zod models in shared folder~~
~~11. use react-hook-form in frontend~~
~~12. use @ alias to fix imports~~
13. define in package.json commands to debug, generate and migrate (core and tenant) drizzle models
14. Implement PDF/Excel export functionality for reports and user data
15. Create Excel import functionality to upload and sync new/changed records only 
16. debug issues - do not create new files