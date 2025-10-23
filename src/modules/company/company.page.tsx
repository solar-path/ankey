import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { CompanyForm } from "./company.form";

export default function CompanyPage() {
  const [matchNew] = useRoute("/company/new");
  const [, paramsEdit] = useRoute("/company/:id");
  const [, setLocation] = useLocation();
  const { user: _user } = useAuth();

  // Determine if creating new or editing existing
  const isNew = matchNew;
  const companyId = isNew ? undefined : paramsEdit?.id;

  // Always use "workspace" type for companies created via sidebar
  const companyType = "workspace";

  return (
    <CompanyForm
      companyId={companyId}
      companyType={companyType}
      onSuccess={() => setLocation("/dashboard")}
      onCancel={() => setLocation("/dashboard")}
    />
  );
}
