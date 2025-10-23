/**
 * Appointment Detail Card Component
 * Editable card for appointment details with user selection
 */

import { useState, useEffect } from "react";
import { UserCheck, Save, Trash2, FileDown, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/lib/ui/button";
import { Input } from "@/lib/ui/input";
import { Textarea } from "@/lib/ui/textarea";
import { Label } from "@/lib/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/lib/ui/card";
import { Badge } from "@/lib/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/lib/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/lib/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/lib/ui/popover";
import type { Appointment, OrgChartStatus, SalaryFrequency, Position } from "../orgchart.types";
import { getAppointmentPermissions } from "../orgchart.types";
import { CompanyMembersService, type CompanyMember } from "@/modules/company/company-members-service";
import { useCompany } from "@/lib/company-context";
import { cn } from "@/lib/utils";

interface AppointmentCardProps {
  appointment: Appointment;
  position: Position;
  orgChartStatus: OrgChartStatus;
  onSave: (updates: Partial<Appointment>) => Promise<void>;
  onDelete: () => void;
  onGeneratePDF: () => void;
}

export function AppointmentCard({
  appointment,
  position,
  orgChartStatus,
  onSave,
  onDelete,
  onGeneratePDF,
}: AppointmentCardProps) {
  const { activeCompany } = useCompany();
  const permissions = getAppointmentPermissions(orgChartStatus);
  const [isSaving, setIsSaving] = useState(false);
  const [companyMembers, setCompanyMembers] = useState<CompanyMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [userSelectOpen, setUserSelectOpen] = useState(false);

  const [formData, setFormData] = useState({
    userId: appointment.userId || "",
    isVacant: appointment.isVacant,
    salary: appointment.jobOffer?.salary || position.salaryMin || 0,
    salaryCurrency: appointment.jobOffer?.salaryCurrency || position.salaryCurrency || "USD",
    salaryFrequency: appointment.jobOffer?.salaryFrequency || position.salaryFrequency || "monthly",
    startDate: appointment.jobOffer?.startDate
      ? new Date(appointment.jobOffer.startDate).toISOString().split("T")[0]
      : "",
    benefits: appointment.jobOffer?.benefits?.join("\n") || "",
    conditions: appointment.jobOffer?.conditions?.join("\n") || "",
  });

  // Load company members
  useEffect(() => {
    if (activeCompany) {
      loadCompanyMembers();
    }
  }, [activeCompany]);

  const loadCompanyMembers = async () => {
    if (!activeCompany) return;

    try {
      setLoadingMembers(true);
      const members = await CompanyMembersService.getCompanyMembers(activeCompany._id);
      setCompanyMembers(members);
    } catch (error) {
      console.error("Failed to load company members:", error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Validate salary is within min-max range
      if (formData.salary < position.salaryMin || formData.salary > position.salaryMax) {
        throw new Error(`Salary must be between ${position.salaryMin} and ${position.salaryMax}`);
      }

      await onSave({
        userId: formData.userId || undefined,
        isVacant: !formData.userId,
        jobOffer: {
          salary: formData.salary,
          salaryCurrency: formData.salaryCurrency,
          salaryFrequency: formData.salaryFrequency as SalaryFrequency,
          startDate: formData.startDate ? new Date(formData.startDate).getTime() : undefined,
          benefits: formData.benefits.split("\n").filter(Boolean),
          conditions: formData.conditions.split("\n").filter(Boolean),
        },
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      userId: appointment.userId || "",
      isVacant: appointment.isVacant,
      salary: appointment.jobOffer?.salary || position.salaryMin || 0,
      salaryCurrency: appointment.jobOffer?.salaryCurrency || position.salaryCurrency || "USD",
      salaryFrequency: appointment.jobOffer?.salaryFrequency || position.salaryFrequency || "monthly",
      startDate: appointment.jobOffer?.startDate
        ? new Date(appointment.jobOffer.startDate).toISOString().split("T")[0]
        : "",
      benefits: appointment.jobOffer?.benefits?.join("\n") || "",
      conditions: appointment.jobOffer?.conditions?.join("\n") || "",
    });
  };

  const handleTermination = async () => {
    if (!window.confirm("Are you sure you want to terminate this appointment? The position will remain but user link will be removed.")) {
      return;
    }

    try {
      setIsSaving(true);
      // Remove user link and set position as vacant
      await onSave({
        userId: undefined,
        isVacant: true,
        employmentEndedAt: Date.now(),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const selectedMember = companyMembers.find((m) => m.userId === formData.userId);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="size-5 text-purple-500" />
            <div>
              <CardTitle>
                {appointment.isVacant ? "Vacant Position" : selectedMember?.fullname || `User ${appointment.userId}`}
              </CardTitle>
              <CardDescription>
                {position.title} {position.code && `(${position.code})`}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {appointment.isVacant && (
              <Badge variant="outline" className="text-xs">
                Vacant
              </Badge>
            )}
            <Badge variant="outline">Level {appointment.level}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div>
            <Label htmlFor="userId">Select User</Label>
            <Popover open={userSelectOpen} onOpenChange={setUserSelectOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={userSelectOpen}
                  className="w-full justify-between"
                  disabled={loadingMembers}
                >
                  {formData.userId
                    ? selectedMember?.fullname || formData.userId
                    : "Select user..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput placeholder="Search users..." />
                  <CommandList>
                    <CommandEmpty>No user found.</CommandEmpty>
                    <CommandGroup>
                      {companyMembers.map((member) => (
                        <CommandItem
                          key={member.userId}
                          value={member.userId}
                          onSelect={() => {
                            setFormData({ ...formData, userId: member.userId, isVacant: false });
                            setUserSelectOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.userId === member.userId ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{member.fullname}</span>
                            <span className="text-xs text-muted-foreground">{member.email}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="salary">Actual Salary</Label>
            <Input
              id="salary"
              type="number"
              value={formData.salary}
              onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) })}
              min={position.salaryMin}
              max={position.salaryMax}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Range: {position.salaryMin.toLocaleString()} - {position.salaryMax.toLocaleString()} {position.salaryCurrency}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="salaryCurrency">Currency</Label>
              <Input
                id="salaryCurrency"
                value={formData.salaryCurrency}
                onChange={(e) => setFormData({ ...formData, salaryCurrency: e.target.value })}
                placeholder="USD"
              />
            </div>
            <div>
              <Label htmlFor="salaryFrequency">Frequency</Label>
              <Select
                value={formData.salaryFrequency}
                onValueChange={(value: SalaryFrequency) =>
                  setFormData({ ...formData, salaryFrequency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="per_job">Per Job</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="benefits">Benefits (one per line)</Label>
            <Textarea
              id="benefits"
              value={formData.benefits}
              onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="conditions">Conditions (one per line)</Label>
            <Textarea
              id="conditions"
              value={formData.conditions}
              onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
              rows={3}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-4 border-t flex-wrap">
          <Button onClick={handleSave} disabled={isSaving || !formData.userId}>
            <Save className="size-4 mr-2" />
            Save
          </Button>
          <Button onClick={handleCancel} variant="outline" disabled={isSaving}>
            Cancel
          </Button>
          {!appointment.isVacant && (
            <>
              <Button onClick={onGeneratePDF} variant="outline" size="sm">
                <FileDown className="size-4 mr-2" />
                Job Offer
              </Button>
              <Button onClick={onGeneratePDF} variant="outline" size="sm">
                <FileDown className="size-4 mr-2" />
                Employment Contract
              </Button>
              <Button onClick={() => handleTermination()} variant="outline" size="sm">
                <FileDown className="size-4 mr-2" />
                Termination Notice
              </Button>
            </>
          )}
          {permissions.canDelete && (
            <Button onClick={onDelete} variant="destructive" size="sm">
              <Trash2 className="size-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
