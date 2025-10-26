import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { client } from "@/lib/api-client";
import { QTable, SortableHeader, RowActionsDropdown } from "@/lib/ui/QTable.ui";
import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/lib/ui/badge";
import { Plus, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { type ApprovalMatrix } from "@/api/db/schema";
import { useCompanyOptional } from "@/lib/company-context";

export default function DOAPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const [, setLocation] = useLocation();
  const [matrices, setMatrices] = useState<ApprovalMatrix[]>([]);
  const [loading, setLoading] = useState(true);
  const companyContext = useCompanyOptional();
  const activeCompany = companyContext?.activeCompany || null;

  // Use activeCompany.id instead of URL companyId to react to company switches
  const effectiveCompanyId = activeCompany?.id || companyId;

  useEffect(() => {
    if (effectiveCompanyId) {
      loadMatrices();
    }
  }, [effectiveCompanyId]); // Reload when activeCompany changes

  const loadMatrices = async () => {
    if (!effectiveCompanyId) return;

    try {
      setLoading(true);
      const { data, error } = await client(
        `/api/doa/companies/${effectiveCompanyId}/matrices` as any,
        {
          params: { companyId: effectiveCompanyId },
        } as any
      );

      if (error) {
        console.error("Failed to load approval matrices:", error);
        toast.error("Failed to load approval matrices");
        setMatrices([]); // Clear matrices on error
        return;
      }

      const responseData = data as any;
      setMatrices(responseData.matrices || []);
    } catch (error) {
      console.error("Failed to load approval matrices:", error);
      toast.error("Failed to load approval matrices");
      setMatrices([]); // Clear matrices on error
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (matrixId: string) => {
    if (!confirm("Are you sure you want to delete this approval matrix?"))
      return;

    try {
      const { error } = await client(
        `/api/doa/matrices/${matrixId}` as any,
        {
          method: "DELETE",
          params: { matrixId },
        } as any
      );

      if (error) {
        const errorMessage =
          (error.value as any)?.error || "Failed to delete approval matrix";
        toast.error(errorMessage);
        return;
      }

      toast.success("Approval matrix deleted successfully");
      loadMatrices();
    } catch (error) {
      console.error("Failed to delete matrix:", error);
      toast.error("Failed to delete approval matrix");
    }
  };

  const columns: ColumnDef<ApprovalMatrix>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <SortableHeader column={column}>Name</SortableHeader>
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "documentType",
      header: ({ column }) => (
        <SortableHeader column={column}>Document Type</SortableHeader>
      ),
      cell: ({ row }) => {
        const docType = row.getValue("documentType") as string;
        return docType ? (
          <Badge variant="outline">
            {docType.replace(/_/g, " ").toUpperCase()}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <SortableHeader column={column}>Status</SortableHeader>
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return status ? (
          <Badge variant={status === "active" ? "default" : "secondary"}>
            {status.toUpperCase()}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      id: "blocks",
      header: "Approval Blocks",
      cell: ({ row }) => {
        const blocks = row.original.approvalBlocks || [];
        return <div className="text-sm">{blocks.length} block(s)</div>;
      },
    },
    {
      id: "approvers",
      header: "Total Approvers",
      cell: ({ row }) => {
        const blocks = row.original.approvalBlocks || [];
        const totalApprovers = blocks.reduce(
          (sum, block) => sum + (block.approvers?.length || 0),
          0
        );
        return <div className="text-sm">{totalApprovers}</div>;
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const desc = row.getValue("description") as string;
        return desc ? (
          <div className="text-sm text-muted-foreground max-w-md truncate">
            {desc}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <SortableHeader column={column}>Created</SortableHeader>
      ),
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as string;
        return date ? new Date(date).toLocaleDateString() : "—";
      },
    },
  ];

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Loading approval matrices...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Authorisation Matrix</h1>
        <p className="text-muted-foreground">
          Define approval workflows and rules for organizational processes
        </p>
      </div>

      <QTable
        columns={columns}
        data={matrices}
        searchKey="name"
        searchPlaceholder="Search matrices..."
        enableRowSelection={false}
        onRowClick={(matrix) =>
          setLocation(`/doa/${effectiveCompanyId}/matrix/${matrix.id}`)
        }
        rowActions={(matrix) => (
          <RowActionsDropdown
            actions={[
              {
                label: "View/Edit",
                icon: <Eye className="size-4" />,
                onClick: () =>
                  setLocation(`/doa/${effectiveCompanyId}/matrix/${matrix.id}`),
              },
              {
                label: "Delete",
                icon: <Trash2 className="size-4" />,
                onClick: () => handleDelete(matrix.id!),
                variant: "destructive",
              },
            ]}
          />
        )}
        mainButton={{
          label: "New Matrix",
          icon: <Plus className="size-4" />,
          onClick: () => setLocation(`/doa/${effectiveCompanyId}/matrix/new`),
        }}
        emptyMessage="No approval matrices found. Create one to define approval workflows."
      />

      {matrices.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> Approval matrices must be defined before
            submitting org charts for approval. Without an active approval
            matrix of type "orgchart", submissions will fail.
          </p>
        </div>
      )}
    </div>
  );
}
