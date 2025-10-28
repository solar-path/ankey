import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { QTable, SortableHeader, RowActionsDropdown } from "@/lib/ui/QTable.ui";
import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/lib/ui/badge";
import { Plus, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { type ApprovalMatrix } from "@/modules/shared/types/database.types";
import { useCompanyOptional } from "@/lib/company-context";
import { DOAService } from "./doa.service";

export default function DOAPage() {
  const [, setLocation] = useLocation();
  const [matrices, setMatrices] = useState<ApprovalMatrix[]>([]);
  const [loading, setLoading] = useState(true);
  const companyContext = useCompanyOptional();
  const activeCompany = companyContext?.activeCompany || null;

  useEffect(() => {
    if (activeCompany) {
      loadMatrices();
    }
  }, [activeCompany?._id]);

  const loadMatrices = async () => {
    if (!activeCompany) return;

    try {
      setLoading(true);
      const matrices = await DOAService.getMatrices(activeCompany._id);
      setMatrices(matrices);
    } catch (error) {
      console.error("Failed to load approval matrices:", error);
      toast.error("Failed to load approval matrices");
      setMatrices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (matrixId: string) => {
    if (!confirm("Are you sure you want to delete this approval matrix?"))
      return;

    if (!activeCompany) return;

    try {
      await DOAService.deleteMatrix(activeCompany._id, matrixId);
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
        onRowClick={(matrix) => {
          const id = matrix._id.split(":").pop() || matrix._id;
          setLocation(`/doa/matrix/${id}`);
        }}
        rowActions={(matrix) => {
          const id = matrix._id.split(":").pop() || matrix._id;
          return (
            <RowActionsDropdown
              actions={[
                {
                  label: "View/Edit",
                  icon: <Eye className="size-4" />,
                  onClick: () => setLocation(`/doa/matrix/${id}`),
                },
                {
                  label: "Delete",
                  icon: <Trash2 className="size-4" />,
                  onClick: () => handleDelete(id),
                  variant: "destructive",
                },
              ]}
            />
          );
        }}
        mainButton={{
          label: "New Matrix",
          icon: <Plus className="size-4" />,
          onClick: () => setLocation(`/doa/matrix/new`),
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
