import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { UserService } from "./user-service";
import { useCompany } from "@/lib/company-context";
import { Badge } from "@/lib/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/lib/ui/card";
import { toast } from "sonner";
import {
  Plus,
  UserCheck,
  UserX,
  Mail,
  Trash2,
  Shield,
  Building2,
} from "lucide-react";
import { QTable, SortableHeader, RowActionsDropdown, MassActionButtons } from "@/lib/ui/QTable.ui";
import type { ColumnDef } from "@tanstack/react-table";

interface SanitizedUser {
  _id: string;
  email: string;
  fullname: string;
  verified: boolean;
  twoFactorEnabled?: boolean;
  createdAt: number;
  updatedAt: number;
}

export default function UserManagementPage() {
  const [, navigate] = useLocation();
  const { activeCompany } = useCompany();
  const [users, setUsers] = useState<SanitizedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    unverified: 0,
    recent: 0,
  });

  // Load users when company changes
  useEffect(() => {
    if (activeCompany) {
      loadUsers();
      loadStats();
    }
  }, [activeCompany]);

  const loadUsers = async () => {
    if (!activeCompany) {
      setUsers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const fetchedUsers = await UserService.getUsersByCompany(activeCompany._id);
      setUsers(fetchedUsers as SanitizedUser[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!activeCompany) {
      return;
    }

    try {
      const fetchedStats = await UserService.getUserStats(activeCompany._id);
      setStats(fetchedStats);
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user ${userEmail}?`)) {
      return;
    }

    try {
      await UserService.deleteUser(userId);
      toast.success("User deleted successfully");
      loadUsers();
      loadStats();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete user");
    }
  };

  const handleToggleBlock = async (userId: string, currentlyBlocked: boolean, userEmail: string) => {
    const action = currentlyBlocked ? "unblock" : "block";
    if (!confirm(`Are you sure you want to ${action} user ${userEmail}?`)) {
      return;
    }

    try {
      await UserService.toggleBlockUser(userId, !currentlyBlocked);
      toast.success(`User ${action}ed successfully`);
      loadUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to ${action} user`);
    }
  };

  const handleResendInvitation = async (userEmail: string) => {
    toast.info(`Resending invitation to ${userEmail}...`);
    // TODO: Implement resend invitation
  };

  const handleMassDelete = async (selectedUsers: SanitizedUser[]) => {
    if (!confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) {
      return;
    }

    try {
      for (const user of selectedUsers) {
        await UserService.deleteUser(user._id);
      }
      toast.success(`${selectedUsers.length} users deleted successfully`);
      loadUsers();
      loadStats();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete users");
    }
  };

  const handleMassExport = (selectedUsers: SanitizedUser[]) => {
    const csv = [
      ["Email", "Full Name", "Verified", "2FA Enabled", "Created At"].join(","),
      ...selectedUsers.map((user) =>
        [
          user.email,
          user.fullname,
          user.verified ? "Yes" : "No",
          user.twoFactorEnabled ? "Yes" : "No",
          new Date(user.createdAt).toLocaleDateString(),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-export-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(`Exported ${selectedUsers.length} users`);
  };

  // Define table columns
  const columns: ColumnDef<SanitizedUser>[] = [
    {
      accessorKey: "fullname",
      header: ({ column }) => <SortableHeader column={column}>Name</SortableHeader>,
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("fullname")}</div>
      ),
    },
    {
      accessorKey: "email",
      header: ({ column }) => <SortableHeader column={column}>Email</SortableHeader>,
      cell: ({ row }) => <div>{row.getValue("email")}</div>,
    },
    {
      accessorKey: "verified",
      header: "Status",
      cell: ({ row }) => {
        const verified = row.getValue("verified");
        return verified ? (
          <Badge variant="default" className="bg-green-600">
            <UserCheck className="mr-1 h-3 w-3" />
            Verified
          </Badge>
        ) : (
          <Badge variant="secondary">
            <UserX className="mr-1 h-3 w-3" />
            Unverified
          </Badge>
        );
      },
    },
    {
      accessorKey: "twoFactorEnabled",
      header: "2FA",
      cell: ({ row }) => {
        const enabled = row.getValue("twoFactorEnabled");
        return enabled ? (
          <Badge variant="default" className="bg-blue-600">Enabled</Badge>
        ) : (
          <Badge variant="outline">Disabled</Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <SortableHeader column={column}>Created</SortableHeader>,
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"));
        return <div>{date.toLocaleDateString()}</div>;
      },
    },
  ];

  if (!activeCompany) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">No Company Selected</p>
            <p className="text-muted-foreground mb-4">
              Please select a company to manage users
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage users for {activeCompany.title}
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.verified}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unverified</CardTitle>
            <UserX className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unverified}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent (30d)</CardTitle>
            <Mail className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recent}</div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <QTable
        columns={columns}
        data={users}
        searchable
        searchPlaceholder="Search users by name, email..."
        filterable
        pageSizes={[10, 25, 50, 100]}
        defaultPageSize={25}
        enableRowSelection
        emptyMessage="No users found"
        mainButton={{
          label: "Invite User",
          icon: <Plus className="mr-2 h-4 w-4" />,
          onClick: () => navigate("/users/invite"),
        }}
        massActions={(selectedUsers) => (
          <MassActionButtons
            onExport={() => handleMassExport(selectedUsers)}
            onDelete={() => handleMassDelete(selectedUsers)}
          />
        )}
        rowActions={(user) => (
          <RowActionsDropdown
            actions={[
              {
                label: "View Details",
                icon: <Shield className="h-4 w-4" />,
                onClick: () => navigate(`/users/${user._id}`),
              },
              {
                label: "Manage Companies",
                icon: <Building2 className="h-4 w-4" />,
                onClick: () => navigate(`/users/${user._id}/companies`),
              },
              ...(user.verified
                ? []
                : [
                    {
                      label: "Resend Invitation",
                      icon: <Mail className="h-4 w-4" />,
                      onClick: () => handleResendInvitation(user.email),
                    },
                  ]),
              {
                label: user.verified ? "Block User" : "Unblock User",
                icon: user.verified ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />,
                onClick: () => handleToggleBlock(user._id, !user.verified, user.email),
              },
              {
                label: "Delete User",
                icon: <Trash2 className="h-4 w-4" />,
                onClick: () => handleDeleteUser(user._id, user.email),
                variant: "destructive" as const,
              },
            ]}
          />
        )}
      />
    </div>
  );
}
