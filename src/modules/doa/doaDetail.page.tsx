import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useBreadcrumb } from "@/lib/breadcrumb-context";
import { useCompanyOptional } from "@/lib/company-context";
import { Button } from "@/lib/ui/button";
import { Card, CardContent } from "@/lib/ui/card";
import { Badge } from "@/lib/ui/badge";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { type ApprovalMatrix } from "@/modules/shared/types/database.types";
import { DOAMatrixForm } from "./doaMatrix.form";
import { DOAService } from "./doa.service";

export default function DOADetailPage() {
  const { matrixId } = useParams<{ matrixId: string }>();
  const [, setLocation] = useLocation();
  const { setExtraCrumbs } = useBreadcrumb();
  const companyContext = useCompanyOptional();
  const activeCompany = companyContext?.activeCompany || null;
  const [matrix, setMatrix] = useState<ApprovalMatrix | null>(null);
  const [loading, setLoading] = useState(true);

  const isNewMatrix = matrixId === "new";

  useEffect(() => {
    if (!isNewMatrix && activeCompany) {
      loadMatrix();
    } else {
      setLoading(false);
    }
  }, [matrixId, activeCompany?._id]);

  // Update breadcrumb with matrix name or "New Matrix"
  useEffect(() => {
    if (isNewMatrix) {
      setExtraCrumbs([{ label: "New Matrix" }]);
    } else if (matrix?.name) {
      setExtraCrumbs([{ label: matrix.name }]);
    }

    // Cleanup when component unmounts
    return () => {
      setExtraCrumbs([]);
    };
  }, [matrix?.name, isNewMatrix, setExtraCrumbs]);

  const loadMatrix = async () => {
    if (!matrixId || isNewMatrix || !activeCompany) return;

    try {
      setLoading(true);
      const matrix = await DOAService.getMatrix(activeCompany._id, matrixId);
      setMatrix(matrix);
    } catch (error) {
      console.error("Failed to load approval matrix:", error);
      toast.error("Failed to load approval matrix");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    toast.success(
      isNewMatrix
        ? "Matrix created successfully"
        : "Matrix updated successfully"
    );
    setLocation(`/doa`);
  };

  const handleCancel = () => {
    setLocation(`/doa`);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isNewMatrix ? "Create Approval Matrix" : "Edit Approval Matrix"}
          </h1>
          <p className="text-muted-foreground">
            {isNewMatrix
              ? "Define approval workflow rules and approvers"
              : `Modify approval matrix: ${matrix?.name}`}
          </p>
        </div>
      </div>

      {/* Matrix Info Cards (for editing) */}
      {!isNewMatrix && matrix && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Document Type
                </p>
                <Badge variant="outline">
                  {matrix.documentType?.replace(/_/g, " ").toUpperCase() || "—"}
                </Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Status
                </p>
                <Badge
                  variant={matrix.status === "active" ? "default" : "secondary"}
                >
                  {matrix.status?.toUpperCase() || "INACTIVE"}
                </Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Created
                </p>
                <p className="font-medium">
                  {matrix.createdAt
                    ? new Date(matrix.createdAt).toLocaleDateString()
                    : "—"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Form */}
      <Card>
        <CardContent className="pt-6">
          <DOAMatrixForm
            companyId={activeCompany?._id || ""}
            matrix={matrix || undefined}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  );
}
