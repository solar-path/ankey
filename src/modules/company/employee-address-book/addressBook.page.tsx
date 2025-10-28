"use client";

import { useEffect, useState } from "react";
import { QTable, SortableHeader } from "@/lib/ui/QTable.ui.tsx";
import type { ColumnDef } from "@tanstack/react-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/lib/ui/avatar";
import { Badge } from "@/lib/ui/badge";
import { useCompany } from "@/lib/company-context";
import { toast } from "sonner";
import { CompanyMembersService } from "@/modules/company/company-members-service";

interface Employee {
  _id: string;
  fullname: string;
  email: string;
  phone?: string;
  address?: string;
  avatar?: string;
  position?: string;
  department?: string;
  role?: "owner" | "admin" | "member";
}

export default function AddressBookPage() {
  const { activeCompany } = useCompany();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEmployees();
  }, [activeCompany]);

  const loadEmployees = async () => {
    try {
      setIsLoading(true);

      if (!activeCompany) {
        setEmployees([]);
        return;
      }

      // Get company members from database
      const members = await CompanyMembersService.getCompanyMembers(
        activeCompany._id
      );

      // TODO: Migrate to PostgreSQL - CompanyMembersService should return full user details with JOIN
      // For now, use basic member data
      const employeesData: Employee[] = members.map((member) => ({
        _id: member.userId,
        fullname: member.userId, // TODO: Get from user table via PostgreSQL join
        email: member.userId, // TODO: Get from user table via PostgreSQL join
        phone: undefined,
        address: undefined,
        avatar: undefined,
        position: undefined, // TODO: Get from orgchart appointments
        department: undefined, // TODO: Get from orgchart departments
        role: member.role,
      }));

      setEmployees(employeesData);
    } catch (error) {
      console.error("Failed to load employees:", error);
      toast.error("Failed to load employee directory");
      setEmployees([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case "owner":
        return "default";
      case "admin":
        return "secondary";
      default:
        return "outline";
    }
  };

  const columns: ColumnDef<Employee>[] = [
    {
      id: "employee",
      header: ({ column }) => (
        <SortableHeader column={column}>Employee</SortableHeader>
      ),
      accessorKey: "fullname",
      cell: ({ row }) => {
        const employee = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={employee.avatar} alt={employee.fullname} />
              <AvatarFallback>{getInitials(employee.fullname)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{employee.fullname}</span>
              {employee.position && (
                <span className="text-sm text-muted-foreground">
                  {employee.position}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      id: "email",
      header: ({ column }) => <SortableHeader column={column}>Email</SortableHeader>,
      accessorKey: "email",
      cell: ({ row }) => (
        <a
          href={`mailto:${row.original.email}`}
          className="text-primary hover:underline"
        >
          {row.original.email}
        </a>
      ),
    },
    {
      id: "phone",
      header: "Phone",
      accessorKey: "phone",
      cell: ({ row }) => {
        const phone = row.original.phone;
        return phone ? (
          <a href={`tel:${phone}`} className="text-primary hover:underline">
            {phone}
          </a>
        ) : null;
      },
    },
    {
      id: "department",
      header: ({ column }) => (
        <SortableHeader column={column}>Department</SortableHeader>
      ),
      accessorKey: "department",
      cell: ({ row }) => {
        const department = row.original.department;
        return department ? (
          <span>{department}</span>
        ) : null;
      },
    },
    {
      id: "address",
      header: "Address",
      accessorKey: "address",
      cell: ({ row }) => {
        const address = row.original.address;
        return address ? (
          <span className="text-sm">{address}</span>
        ) : null;
      },
    },
    {
      id: "role",
      header: "Role",
      accessorKey: "role",
      cell: ({ row }) => {
        const role = row.original.role;
        return role ? (
          <Badge variant={getRoleBadgeVariant(role)}>
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </Badge>
        ) : null;
      },
    },
  ];

  if (!activeCompany) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">No Company Selected</h2>
          <p className="text-muted-foreground">
            Please select a company to view the employee directory
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <p className="text-muted-foreground">Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Employee Directory</h1>
        <p className="text-muted-foreground mt-2">
          View and search employee contact information for {activeCompany.title}
        </p>
      </div>

      <QTable
        columns={columns}
        data={employees}
        searchable={true}
        searchPlaceholder="Search employees..."
        searchKey="employee"
        filterable={true}
        pageSizes={[10, 25, 50, 100]}
        defaultPageSize={25}
        enableRowSelection={false}
        emptyMessage="No employees found in the directory."
      />
    </div>
  );
}
