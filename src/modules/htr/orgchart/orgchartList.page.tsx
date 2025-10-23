/**
 * Organizational Charts List Page
 * Displays all orgcharts for the active company
 */

import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useCompany } from "@/lib/company-context";
import { OrgChartService } from "./orgchart-service";
import type { OrgChart } from "./orgchart.types";
import { Button } from "@/lib/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/lib/ui/card";
import { Badge } from "@/lib/ui/badge";
import { Plus, Building2, Calendar, CheckCircle, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function OrgChartListPage() {
  const { user } = useAuth();
  const { activeCompany } = useCompany();
  const [orgCharts, setOrgCharts] = useState<OrgChart[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrgCharts();
  }, [activeCompany]);

  const loadOrgCharts = async () => {
    if (!activeCompany || !user) return;

    try {
      setLoading(true);
      const charts = await OrgChartService.getCompanyOrgCharts(activeCompany.id);
      setOrgCharts(charts);
    } catch (error) {
      console.error("Failed to load orgcharts:", error);
      toast.error("Failed to load organizational charts");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrgChart = async () => {
    if (!activeCompany || !user) return;

    try {
      const newChart = await OrgChartService.createOrgChart(activeCompany.id, user._id, {
        title: `Organizational Chart ${new Date().getFullYear()}`,
        description: "New organizational structure",
      });

      toast.success("Organizational chart created");
      await loadOrgCharts();
    } catch (error: any) {
      toast.error(error.message || "Failed to create orgchart");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return <Clock className="size-4 text-gray-500" />;
      case "pending_approval":
        return <Clock className="size-4 text-yellow-500" />;
      case "approved":
        return <CheckCircle className="size-4 text-green-500" />;
      case "revoked":
        return <XCircle className="size-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      draft: "bg-gray-100 text-gray-800",
      pending_approval: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      revoked: "bg-red-100 text-red-800",
    };

    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || statusColors.draft}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading organizational charts...</p>
      </div>
    );
  }

  if (!activeCompany) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Please select a company first
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizational Charts</h1>
          <p className="text-muted-foreground">
            Manage your organizational structures and hierarchies
          </p>
        </div>

        <Button onClick={handleCreateOrgChart}>
          <Plus className="size-4 mr-2" />
          Create OrgChart
        </Button>
      </div>

      {/* OrgCharts List */}
      {orgCharts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Building2 className="size-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="font-semibold text-lg">No organizational charts yet</h3>
                <p className="text-muted-foreground">
                  Create your first organizational chart to get started
                </p>
              </div>
              <Button onClick={handleCreateOrgChart}>
                <Plus className="size-4 mr-2" />
                Create First OrgChart
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {orgCharts.map((chart) => {
            const chartId = chart._id.split(":").pop()!;

            return (
              <Link key={chart._id} href={`/orgchart/${chartId}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="size-5 text-blue-500" />
                        <CardTitle className="text-lg">{chart.title}</CardTitle>
                      </div>
                      {getStatusIcon(chart.status)}
                    </div>
                    {chart.description && (
                      <CardDescription>{chart.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status</span>
                        {getStatusBadge(chart.status)}
                      </div>

                      {chart.enforcedAt && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="size-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Enforced: {new Date(chart.enforcedAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      {chart.revokedAt && (
                        <div className="flex items-center gap-2 text-sm">
                          <XCircle className="size-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Revoked: {new Date(chart.revokedAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        Created {new Date(chart.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
