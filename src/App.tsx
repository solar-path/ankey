import { Route, Switch, useLocation } from "wouter";
import { I18nextProvider } from "react-i18next";
import i18n from "./lib/i18n";
import PublicLayout from "./routes/public.layout";
import HomePage from "./routes/home.page";
import LearnPage from "./routes/learn.page";
import OffersPage from "./modules/pricing/offers.page";
import ContactPage from "./modules/inquiry/contactUs.page";
import TrackInquiryPage from "./modules/inquiry/trackInquiry.page";
import NotFoundPage from "./routes/404.page";
import PrivateLayout from "./routes/private.layout";
import { CompanyDashboardPage } from "./modules/company/companyDashboard.page";
import CompanyMembersPage from "./modules/company/companyMembers.page";
import CompanyPage from "./modules/company/company.page";
import CompanySettingsPage from "./modules/company/companySettings.page";
import AccountPage from "./modules/auth/account/account.page";
import SignInPage from "./modules/auth/signin.page";
import SignUpPage from "./modules/auth/signup.page";
import ForgotPasswordPage from "./modules/auth/forgotPassword.page";
import VerifyAccountPage from "./modules/auth/verifyAccount.page";
import OrgChartListPage from "./modules/htr/orgchart/orgchartList.page";
import OrgChartViewPage from "./modules/htr/orgchart/orgchartView.page";
import UserManagementPage from "./modules/auth/user/user.page";
import InviteUserPage from "./modules/auth/user/invite.user.page";
import AcceptInvitePage from "./modules/auth/user/acceptInvite.page";
import AddressBookPage from "./modules/company/employee-address-book/addressBook.page";
import TasksPage from "./modules/task/tasks.page";
import TaskDetailPage from "./modules/task/taskDetail.page";
import TaskFormPage from "./modules/task/taskForm.page";
import OrgChartApprovalTaskPage from "./modules/task/orgchartApprovalTask.page";
import ApprovalTaskPage from "./modules/task/approvalTask.page";
import DOAPage from "./modules/doa/doa.page";
import DOADetailPage from "./modules/doa/doaDetail.page";
import { AuditLogsPage } from "./modules/audit/pages/AuditLogsPage";
import { Toaster } from "sonner";
import { AuthProvider } from "./lib/auth-context";
import { CompanyProvider } from "./lib/company-context";
import { TaskProvider } from "./lib/task-context";

function App() {
  const [location] = useLocation();

  // Define public and private routes
  const publicRoutes = [
    "/",
    "/learn",
    "/offers",
    "/contact",
    "/track-inquiry",
    "/auth/signin",
    "/auth/signup",
    "/auth/forgot-password",
    "/auth/verify-account",
    "/auth/accept-invitation",
  ];

  // Private routes are protected by PrivateLayout component
  // All non-public routes will be rendered in PrivateLayout, which handles auth checks

  // Determine if the current route is public
  // Any route not in publicRoutes will be treated as private and rendered in PrivateLayout
  const isPublicRoute = publicRoutes.some((route) => {
    if (location === route) return true;
    if (location.startsWith(route + "?")) return true;
    if (location.startsWith(route + "/")) return true; // Support sub-routes
    return false;
  });

  return (
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <CompanyProvider>
          <TaskProvider>
            {isPublicRoute ? (
              <PublicLayout>
                <Switch>
                  <Route path="/" component={HomePage} />
                  <Route path="/learn" component={LearnPage} />
                  <Route path="/offers" component={OffersPage} />
                  <Route path="/contact" component={ContactPage} />
                  <Route path="/track-inquiry" component={TrackInquiryPage} />
                  <Route path="/auth/signin" component={SignInPage} />
                  <Route path="/auth/signup" component={SignUpPage} />
                  <Route
                    path="/auth/forgot-password"
                    component={ForgotPasswordPage}
                  />
                  <Route
                    path="/auth/verify-account"
                    component={VerifyAccountPage}
                  />
                  <Route
                    path="/auth/accept-invitation"
                    component={AcceptInvitePage}
                  />
                  <Route component={NotFoundPage} />
                </Switch>
              </PublicLayout>
            ) : (
              <PrivateLayout>
                <Switch>
                  <Route path="/dashboard" component={CompanyDashboardPage} />
                  <Route path="/company/new" component={CompanyPage} />
                  <Route path="/company/settings" component={CompanySettingsPage} />
                  <Route path="/company/:id" component={CompanyPage} />
                  <Route path="/company/:id/members" component={CompanyMembersPage} />
                  <Route path="/address-book" component={AddressBookPage} />
                  <Route path="/orgchart/:id" component={OrgChartViewPage} />
                  <Route path="/orgchart" component={OrgChartListPage} />
                  <Route path="/doa/matrix/new" component={DOADetailPage} />
                  <Route path="/doa/matrix/:matrixId" component={DOADetailPage} />
                  <Route path="/doa" component={DOAPage} />
                  <Route path="/task/approval/:taskId" component={ApprovalTaskPage} />
                  <Route path="/task/orgchart/:taskId" component={OrgChartApprovalTaskPage} />
                  <Route path="/task/new" component={TaskFormPage} />
                  <Route path="/task/edit/:id" component={TaskFormPage} />
                  <Route path="/task/:taskId" component={TaskDetailPage} />
                  <Route path="/task" component={TasksPage} />
                  <Route path="/users/invite" component={InviteUserPage} />
                  <Route path="/users" component={UserManagementPage} />
                  <Route path="/audit" component={AuditLogsPage} />
                  <Route path="/account/:rest*" component={AccountPage} />
                  <Route component={NotFoundPage} />
                </Switch>
              </PrivateLayout>
            )}

            <Toaster position="top-right" />
          </TaskProvider>
        </CompanyProvider>
      </AuthProvider>
    </I18nextProvider>
  );
}

export default App;
