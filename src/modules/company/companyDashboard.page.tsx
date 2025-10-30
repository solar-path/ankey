import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCompany } from "@/lib/company-context";
import { OrgChartService } from "@/modules/htr/orgchart/orgchart-service";
import { PayrollForecastChart } from "@/modules/htr/orgchart/components/PayrollForecastChart";
import { toast } from "sonner";

export function CompanyDashboardPage() {
  const { t } = useTranslation();
  const { activeCompany } = useCompany();
  const [payrollForecastData, setPayrollForecastData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayrollForecast();
  }, [activeCompany]);

  const loadPayrollForecast = async () => {
    if (!activeCompany) return;

    try {
      setLoading(true);

      // Get all approved orgcharts for this company
      const orgCharts = await OrgChartService.getCompanyOrgCharts(activeCompany._id);
      const approvedOrgChart = orgCharts.find((o) => o.status === "approved");

      if (approvedOrgChart && approvedOrgChart._id) {
        const data = await OrgChartService.getPayrollForecast(
          activeCompany._id,
          approvedOrgChart._id.split(":").pop()!
        );
        setPayrollForecastData(data);
      }
    } catch (error: any) {
      toast.error(error.message || t('company.dashboard.loadError'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">{t('company.dashboard.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">{t('company.dashboard.title')}</h1>
        <p className="text-muted-foreground">
          {t('company.dashboard.overview', { company: activeCompany?.title || t('company.dashboard.yourCompany') })}
        </p>
      </div>

      {payrollForecastData ? (
        <PayrollForecastChart
          data={payrollForecastData}
          currency="USD"
          title={t('company.dashboard.payrollForecast')}
          description={t('company.dashboard.payrollDescription')}
        />
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>{t('company.dashboard.noOrgChart')}</p>
          <p className="text-sm">{t('company.dashboard.createOrgChart')}</p>
        </div>
      )}
    </div>
  );
}
