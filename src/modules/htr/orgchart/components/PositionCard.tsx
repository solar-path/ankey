import { useState, useEffect } from "react";
import {
  Users,
  Save,
  Trash2,
  FileDown,
  Check,
  ChevronsUpDown,
  Loader2,
  Edit3,
} from "lucide-react";
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
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/lib/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Position, OrgChartStatus, SalaryFrequency } from "../orgchart.types";
import { getPositionPermissions } from "../orgchart.types";
import { OrgChartService } from "../orgchart-service";
import { useCompany } from "@/lib/company-context";

// Helper function to get human-readable salary frequency label
function getSalaryFrequencyLabel(frequency: SalaryFrequency): string {
  const labels: Record<SalaryFrequency, string> = {
    hourly: "Hourly (per hour)",
    daily: "Daily (per day)",
    weekly: "Weekly (per week)",
    biweekly: "Bi-weekly (every 2 weeks)",
    semimonthly: "Semi-monthly (twice a month)",
    monthly: "Monthly (per month)",
    quarterly: "Quarterly (every 3 months)",
    semiannual: "Semi-annual (every 6 months)",
    annual: "Annual (per year)",
    per_project: "Per Project",
    per_job: "Per Job",
    commission: "Commission",
    one_time: "One-time Payment",
  };
  return labels[frequency] || frequency;
}

interface PositionCardProps {
  position: Position;
  orgChartStatus: OrgChartStatus;
  mode?: "view" | "edit" | "create";
  onSave: (updates: Partial<Position>) => Promise<void>;
  onDelete: () => void;
  onGeneratePDF: () => void;
}

export function PositionCard({
  position,
  orgChartStatus,
  mode = "view",
  onSave,
  onDelete,
  onGeneratePDF,
}: PositionCardProps) {
  const { activeCompany } = useCompany();
  const permissions = getPositionPermissions(orgChartStatus);

  const [isEditing, setIsEditing] = useState(mode === "create" || mode === "edit");
  const [isSaving, setIsSaving] = useState(false);
  const [availablePositions, setAvailablePositions] = useState<Position[]>([]);
  const [positionSelectOpen, setPositionSelectOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: position.title || "",
    description: position.description || "",
    reportsToPositionId: position.reportsToPositionId || "",
    salaryMin: position.salaryMin || 0,
    salaryMax: position.salaryMax || 0,
    salaryCurrency: position.salaryCurrency || "USD",
    salaryFrequency: position.salaryFrequency || "monthly",
    summary: position.jobDescription?.summary || "",
    responsibilities: position.jobDescription?.responsibilities?.join("\n") || "",
    requirements: position.jobDescription?.requirements?.join("\n") || "",
    qualifications: position.jobDescription?.qualifications?.join("\n") || "",
  });

  const [originalData, setOriginalData] = useState(formData);

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  const selectedReportsToPosition = availablePositions.find(
    (p) => p._id?.split(":").pop() === formData.reportsToPositionId
  );

  useEffect(() => {
    if (activeCompany && position.orgChartId) {
      loadAvailablePositions();
    }
  }, [activeCompany, position.orgChartId]);

  async function loadAvailablePositions() {
    if (!activeCompany) return;

    try {
      const hierarchy = await OrgChartService.getOrgChartHierarchy(activeCompany._id, position.orgChartId);
      const positions = hierarchy
        .filter((row) => row.type === "position" && row._id !== position._id)
        .map((row) => row.original as Position);
      setAvailablePositions(positions);
    } catch (e) {
      console.error("Failed to load positions", e);
    }
  }

  // Validation errors
  const validationErrors = {
    title: formData.title.trim() === "",
    salaryMin: formData.salaryMin <= 0,
    salaryMax: formData.salaryMax <= 0 || formData.salaryMax <= formData.salaryMin,
  };

  const isValid = !validationErrors.title && !validationErrors.salaryMin && !validationErrors.salaryMax;

  async function handleSave() {
    if (!isValid) return;
    setIsSaving(true);
    await onSave({
      title: formData.title,
      description: formData.description,
      reportsToPositionId: formData.reportsToPositionId || undefined,
      salaryMin: formData.salaryMin,
      salaryMax: formData.salaryMax,
      salaryCurrency: formData.salaryCurrency,
      salaryFrequency: formData.salaryFrequency,
      jobDescription: {
        summary: formData.summary,
        responsibilities: formData.responsibilities.split("\n").filter(Boolean),
        requirements: formData.requirements.split("\n").filter(Boolean),
        qualifications: formData.qualifications.split("\n").filter(Boolean),
      },
    });
    setOriginalData(formData);
    setIsEditing(false);
    setIsSaving(false);
  }

  function handleCancel() {
    setFormData(originalData);
    setIsEditing(false);
  }

  return (
    <TooltipProvider>
      <Card
        className={cn(
          "transition-all duration-300",
          isEditing
            ? "border-blue-400 shadow-md shadow-blue-100"
            : "border-border hover:shadow-sm",
          mode === "create" && "border-green-400 shadow-green-100"
        )}
      >
        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="text-orange-500 h-5 w-5" />
            <div>
              <CardTitle>{formData.title || "New Position"}</CardTitle>
              <CardDescription>
                {mode === "create" ? "Creating position" : "Position details"}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                orgChartStatus === "draft" && "bg-yellow-50 text-yellow-700"
              )}
            >
              {orgChartStatus}
            </Badge>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing((e) => !e)}
                >
                  {isEditing ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Edit3 className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isEditing ? "Done editing" : "Edit"}
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="space-y-6 transition-all duration-300 ease-in-out">
          {/* Validation Summary */}
          {isEditing && !isValid && hasChanges && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <p className="text-sm font-medium text-destructive">Please fix the following errors:</p>
              <ul className="mt-2 list-disc list-inside text-xs text-destructive/80 space-y-1">
                {validationErrors.title && <li>Title is required</li>}
                {validationErrors.salaryMin && <li>Minimum salary must be greater than 0</li>}
                {validationErrors.salaryMax && <li>Maximum salary must be greater than minimum salary</li>}
              </ul>
            </div>
          )}

          {/* Section: Basic Info */}
          <Section title="Basic Information">
            <Field
              label="Title"
              required
              editable={isEditing}
              value={formData.title}
              onChange={(v) => setFormData({ ...formData, title: v })}
              error={isEditing && validationErrors.title}
              errorMessage="Title is required"
            />
            <Field
              label="Description"
              editable={isEditing}
              textarea
              value={formData.description}
              onChange={(v) => setFormData({ ...formData, description: v })}
            />
          </Section>

          {/* Section: Reporting */}
          <Section title="Reporting Structure">
            {isEditing ? (
              <Popover open={positionSelectOpen} onOpenChange={setPositionSelectOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between">
                    {formData.reportsToPositionId
                      ? selectedReportsToPosition?.title
                      : "No manager (top position)"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="Search positions..." />
                    <CommandList>
                      <CommandEmpty>No position found.</CommandEmpty>
                      <CommandGroup>
                        {availablePositions.map((pos) => {
                          const id = pos._id?.split(":").pop();
                          return (
                            <CommandItem
                              key={id}
                              onSelect={() => {
                                setFormData({ ...formData, reportsToPositionId: id || "" });
                                setPositionSelectOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.reportsToPositionId === id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {pos.title}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            ) : (
              <ReadOnlyBlock
                value={
                  selectedReportsToPosition?.title ||
                  "No manager (top position)"
                }
              />
            )}
          </Section>

          {/* Section: Compensation */}
          <Section title="Compensation">
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Min Salary"
                required
                editable={isEditing}
                type="number"
                value={formData.salaryMin.toString()}
                onChange={(v) =>
                  setFormData({ ...formData, salaryMin: parseFloat(v) || 0 })
                }
                error={isEditing && validationErrors.salaryMin}
                errorMessage="Min salary must be greater than 0"
              />
              <Field
                label="Max Salary"
                required
                editable={isEditing}
                type="number"
                value={formData.salaryMax.toString()}
                onChange={(v) =>
                  setFormData({ ...formData, salaryMax: parseFloat(v) || 0 })
                }
                error={isEditing && validationErrors.salaryMax}
                errorMessage="Max salary must be greater than min salary"
              />
            </div>

            <Field
              label="Currency"
              editable={isEditing}
              value={formData.salaryCurrency}
              onChange={(v) =>
                setFormData({ ...formData, salaryCurrency: v })
              }
            />

            <div>
              <Label>Frequency</Label>
              {isEditing ? (
                <Select
                  value={formData.salaryFrequency}
                  onValueChange={(v: SalaryFrequency) =>
                    setFormData({ ...formData, salaryFrequency: v })
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly (per hour)</SelectItem>
                    <SelectItem value="daily">Daily (per day)</SelectItem>
                    <SelectItem value="weekly">Weekly (per week)</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly (every 2 weeks)</SelectItem>
                    <SelectItem value="semimonthly">Semi-monthly (twice a month)</SelectItem>
                    <SelectItem value="monthly">Monthly (per month)</SelectItem>
                    <SelectItem value="quarterly">Quarterly (every 3 months)</SelectItem>
                    <SelectItem value="semiannual">Semi-annual (every 6 months)</SelectItem>
                    <SelectItem value="annual">Annual (per year)</SelectItem>
                    <SelectItem value="per_project">Per Project</SelectItem>
                    <SelectItem value="per_job">Per Job</SelectItem>
                    <SelectItem value="commission">Commission</SelectItem>
                    <SelectItem value="one_time">One-time Payment</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <ReadOnlyBlock value={getSalaryFrequencyLabel(formData.salaryFrequency)} />
              )}
            </div>
          </Section>

          {/* Section: Job Description */}
          <Section title="Job Description">
            <Field
              label="Summary"
              editable={isEditing}
              textarea
              value={formData.summary}
              onChange={(v) => setFormData({ ...formData, summary: v })}
            />
            <Field
              label="Responsibilities (one per line)"
              editable={isEditing}
              textarea
              value={formData.responsibilities}
              onChange={(v) => setFormData({ ...formData, responsibilities: v })}
            />
            <Field
              label="Requirements (one per line)"
              editable={isEditing}
              textarea
              value={formData.requirements}
              onChange={(v) => setFormData({ ...formData, requirements: v })}
            />
            <Field
              label="Qualifications (one per line)"
              editable={isEditing}
              textarea
              value={formData.qualifications}
              onChange={(v) => setFormData({ ...formData, qualifications: v })}
            />
          </Section>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 border-t pt-4">
            {hasChanges && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={handleSave} disabled={!isValid || isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" /> Save
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  {!isValid && (
                    <TooltipContent>
                      Please fix validation errors before saving
                    </TooltipContent>
                  )}
                </Tooltip>
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={onGeneratePDF}>
                  <FileDown className="mr-2 h-4 w-4" /> Job Description
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download as PDF</TooltipContent>
            </Tooltip>

            {permissions.canDelete && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="destructive" size="sm" onClick={onDelete}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete this position</TooltipContent>
              </Tooltip>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

/* ---------- Subcomponents ---------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border rounded-xl p-4 bg-background/60 backdrop-blur-sm">
      <h3 className="text-sm font-semibold text-muted-foreground mb-3">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  editable,
  textarea,
  required,
  type = "text",
  error,
  errorMessage,
}: {
  label: string;
  value: string;
  onChange?: (val: string) => void;
  editable?: boolean;
  textarea?: boolean;
  required?: boolean;
  type?: string;
  error?: boolean;
  errorMessage?: string;
}) {
  return (
    <div className="flex flex-col space-y-1.5">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {editable ? (
        <>
          {textarea ? (
            <Textarea
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              className={cn(error && "border-destructive focus-visible:ring-destructive")}
            />
          ) : (
            <Input
              type={type}
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              className={cn(error && "border-destructive focus-visible:ring-destructive")}
            />
          )}
          {error && errorMessage && (
            <p className="text-xs text-destructive">{errorMessage}</p>
          )}
        </>
      ) : (
        <ReadOnlyBlock value={value} />
      )}
    </div>
  );
}

function ReadOnlyBlock({ value }: { value: string }) {
  return (
    <div className="px-3 py-2 rounded-md border bg-muted/40 hover:bg-accent/50 cursor-pointer transition group relative">
      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
        {value || "—"}
      </p>
      <Edit3 className="absolute right-2 top-2 h-3.5 w-3.5 opacity-0 group-hover:opacity-100 text-muted-foreground transition" />
    </div>
  );
}
