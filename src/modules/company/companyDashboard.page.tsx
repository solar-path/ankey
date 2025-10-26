import { useEffect, useState } from "react";
import { useCompany } from "@/lib/company-context";
import { OrgChartService } from "@/modules/htr/orgchart/orgchart-service";
import { PayrollForecastChart } from "@/modules/htr/orgchart/components/PayrollForecastChart";
import { toast } from "sonner";

export function CompanyDashboardPage() {
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

      if (approvedOrgChart) {
        const data = await OrgChartService.getPayrollForecast(
          activeCompany._id,
          approvedOrgChart._id.split(":").pop()!
        );
        setPayrollForecastData(data);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load payroll forecast");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Company Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of {activeCompany?.title || "your company"}
        </p>
      </div>

      {payrollForecastData ? (
        <PayrollForecastChart
          data={payrollForecastData}
          currency="USD"
          title="Payroll Forecast"
          description="18-month projection based on approved organizational structure"
        />
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>No approved organizational chart found.</p>
          <p className="text-sm">Create and approve an org chart to see payroll forecasts.</p>
        </div>
      )}
    </div>
  );
}
