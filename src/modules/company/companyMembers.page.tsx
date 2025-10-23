import { useEffect, useState } from "react";
import { useCompany } from "@/lib/company-context";
import { useAuth } from "@/lib/auth-context";
import { CompanyMembersService, type CompanyMember, type CompanyRole } from "./company-members-service";
import { Button } from "@/lib/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/lib/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/lib/ui/select";
import { Badge } from "@/lib/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/lib/ui/avatar";
import { Crown, Shield, User, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function CompanyMembersPage() {
  const { user } = useAuth();
  const { activeCompany } = useCompany();
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<CompanyRole | null>(null);

  // Load members
  useEffect(() => {
    if (!activeCompany) return;

    loadMembers();
  }, [activeCompany]);

  const loadMembers = async () => {
    if (!activeCompany || !user) return;

    try {
      setLoading(true);
      const [membersData, role] = await Promise.all([
        CompanyMembersService.getCompanyMembers(activeCompany.id),
        CompanyMembersService.getUserRole(user._id, activeCompany.id),
      ]);

      setMembers(membersData);
      setCurrentUserRole(role);
    } catch (error) {
      console.error("Failed to load members:", error);
      toast.error("Failed to load team members");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: CompanyRole) => {
    if (!activeCompany) return;

    try {
      await CompanyMembersService.updateMemberRole(activeCompany.id, userId, newRole);
      toast.success("Role updated successfully");
      await loadMembers();
    } catch (error: any) {
      toast.error(error.message || "Failed to update role");
    }
  };

  const handleRemoveMember = async (member: CompanyMember) => {
    if (!activeCompany) return;

    const confirmed = window.confirm(
      `Are you sure you want to remove ${member.fullname} from ${activeCompany.title}? They will lose access to all company data.`
    );

    if (!confirmed) return;

    try {
      await CompanyMembersService.removeMember(activeCompany.id, member.userId);
      toast.success("Member removed successfully");
      await loadMembers();
    } catch (error: any) {
      toast.error(error.message || "Failed to remove member");
    }
  };

  const getRoleIcon = (role: CompanyRole) => {
    switch (role) {
      case "owner":
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case "admin":
        return <Shield className="h-4 w-4 text-blue-500" />;
      case "member":
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadgeVariant = (role: CompanyRole): "default" | "secondary" | "outline" => {
    switch (role) {
      case "owner":
        return "default";
      case "admin":
        return "secondary";
      case "member":
        return "outline";
    }
  };

  const canManageMembers = currentUserRole === "owner" || currentUserRole === "admin";

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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team Members</h1>
        <p className="text-muted-foreground">
          Manage your team members and their roles
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Members ({members.length})</CardTitle>
          <CardDescription>
            People who have access to {activeCompany.title}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading members...
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No members found
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.avatar} alt={member.fullname} />
                      <AvatarFallback>
                        {member.fullname.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{member.fullname}</p>
                        {member.userId === user?._id && (
                          <Badge variant="secondary" className="text-xs">
                            You
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {member.email}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {getRoleIcon(member.role)}
                      <Badge variant={getRoleBadgeVariant(member.role)}>
                        {member.role}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {canManageMembers &&
                      member.userId !== user?._id &&
                      member.role !== "owner" && (
                        <Select
                          value={member.role}
                          onValueChange={(value) =>
                            handleRoleChange(member.userId, value as CompanyRole)
                          }
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="member">Member</SelectItem>
                          </SelectContent>
                        </Select>
                      )}

                    {canManageMembers &&
                      member.userId !== user?._id &&
                      member.role !== "owner" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveMember(member)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
