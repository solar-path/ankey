import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { UserService } from "./user-service";
import { useCompanyOptional } from "@/lib/company-context";
import { inviteUserSchema, type InviteUserInput } from "../auth.valibot";
import { industries, type Industry } from "@/modules/shared/database/reference-data";
import { Button } from "@/lib/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/lib/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/lib/ui/form";
import { Input } from "@/lib/ui/input";
import { Checkbox } from "@/lib/ui/checkbox";
import { toast } from "sonner";
import { ArrowLeft, Mail, Send, Building2 } from "lucide-react";

export default function InviteUserPage() {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);
  const [industriesData, setIndustriesData] = useState<Industry[]>([]);
  const companyContext = useCompanyOptional();
  const companies = companyContext?.companies || [];
  const activeCompany = companyContext?.activeCompany;

  const form = useForm<InviteUserInput>({
    resolver: valibotResolver(inviteUserSchema),
    defaultValues: {
      email: "",
      sendEmail: true, // Always send email for invitations
      companyIds: activeCompany ? [activeCompany._id] : [],
    },
  });

  // Load industries data
  useEffect(() => {
    const loadIndustries = async () => {
      try {
        const list = await industries.getAll();
        setIndustriesData(list);
      } catch (error) {
        console.error("Failed to load industries:", error);
      }
    };
    loadIndustries();
  }, []);

  // Auto-select active company when it changes
  useEffect(() => {
    if (activeCompany) {
      form.setValue("companyIds", [activeCompany._id]);
    }
  }, [activeCompany]);

  // Helper function to get industry title from code
  const getIndustryTitle = (code: string) => {
    if (!code) return "Unknown";
    const industry = industriesData.find((i) => i.code.toString() === code);
    return industry?.title || code;
  };

  const onSubmit = async (data: InviteUserInput) => {
    try {
      setLoading(true);
      const result = await UserService.inviteUser(data);

      toast.success(result.message);

      // Reset form
      form.reset({
        email: "",
        sendEmail: true,
        companyIds: activeCompany ? [activeCompany._id] : [],
      });

      // Navigate back to user list after short delay
      setTimeout(() => {
        navigate("/users");
      }, 2000);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to invite user"
      );
      setLoading(false);
    }
  };

  const selectedCompanyIds = form.watch("companyIds") || [];

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/users")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Button>
        <h1 className="text-3xl font-bold">Invite User</h1>
        <p className="text-muted-foreground mt-2">
          Send an invitation email to a new user
        </p>
      </div>

      {/* Invitation Form */}
      <Card>
        <CardHeader>
          <CardTitle>User Details</CardTitle>
          <CardDescription>
            Enter the email address of the user you want to invite
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="user@example.com"
                          {...field}
                          className="pl-9"
                          type="email"
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      The user will receive an invitation email with a 6-digit
                      verification code
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Company Selection */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">
                    Company Access (Optional)
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Select which companies this user should have access to
                  </p>
                </div>

                {companies.length === 0 ? (
                  <div className="flex items-center justify-center py-8 border rounded-md">
                    <div className="text-center">
                      <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No companies available
                      </p>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => navigate("/company/new")}
                        className="mt-2"
                      >
                        Create a company
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-md divide-y max-h-64 overflow-y-auto">
                    {companies.map((company) => {
                      const isSelected = selectedCompanyIds.includes(company._id);

                      return (
                        <div
                          key={company._id}
                          className="flex items-center space-x-3 p-3 hover:bg-accent cursor-pointer"
                          onClick={() => {
                            const currentIds = form.getValues("companyIds") || [];
                            if (isSelected) {
                              form.setValue(
                                "companyIds",
                                currentIds.filter((id) => id !== company._id)
                              );
                            } else {
                              form.setValue("companyIds", [...currentIds, company._id]);
                            }
                          }}
                        >
                          <Checkbox
                            checked={isSelected}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{company.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {company.type} • {getIndustryTitle(company.industry)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Selected {selectedCompanyIds.length} of {companies.length}{" "}
                  companies
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (
                    "Sending invitation..."
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Invitation
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/users")}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">What happens next?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            1. The user will receive an email with a 6-digit verification code
            and invitation link
          </p>
          <p>
            2. New users will need to create a password when accepting the
            invitation
          </p>
          <p>3. Existing users will confirm with just the 6-digit code</p>
          <p>4. The invitation code expires in 24 hours</p>
          <p>5. They will have access to the companies you selected</p>
        </CardContent>
      </Card>
    </div>
  );
}
