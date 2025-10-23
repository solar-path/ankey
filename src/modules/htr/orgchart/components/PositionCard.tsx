/**
 * Position Detail Card Component
 * Editable card for position details
 */

import { useState, useEffect } from "react";
import { Users, Save, Trash2, FileDown, Check, ChevronsUpDown } from "lucide-react";
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
import type { Position, OrgChartStatus, SalaryFrequency } from "../orgchart.types";
import { getPositionPermissions } from "../orgchart.types";
import { OrgChartService } from "../orgchart-service";
import { useCompany } from "@/lib/company-context";
import { cn } from "@/lib/utils";

interface PositionCardProps {
  position: Position;
  departmentCode: string;
  orgChartStatus: OrgChartStatus;
  onSave: (updates: Partial<Position>) => Promise<void>;
  onDelete: () => void;
  onGeneratePDF: () => void;
}

export function PositionCard({
  position,
  departmentCode,
  orgChartStatus,
  onSave,
  onDelete,
  onGeneratePDF,
}: PositionCardProps) {
  const { activeCompany } = useCompany();
  const permissions = getPositionPermissions(orgChartStatus);
  const [isSaving, setIsSaving] = useState(false);
  const [availablePositions, setAvailablePositions] = useState<Position[]>([]);
  const [loadingPositions, setLoadingPositions] = useState(false);
  const [positionSelectOpen, setPositionSelectOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: position.title,
    description: position.description || "",
    reportsToPositionId: position.reportsToPositionId || "",
    salaryMin: position.salaryMin,
    salaryMax: position.salaryMax,
    salaryCurrency: position.salaryCurrency,
    salaryFrequency: position.salaryFrequency,
    summary: position.jobDescription?.summary || "",
    responsibilities: position.jobDescription?.responsibilities?.join("\n") || "",
    requirements: position.jobDescription?.requirements?.join("\n") || "",
    qualifications: position.jobDescription?.qualifications?.join("\n") || "",
  });

  // Load available positions for reporting relationship
  useEffect(() => {
    if (activeCompany && isEditing && position.orgChartId) {
      loadAvailablePositions();
    }
  }, [activeCompany, isEditing, position.orgChartId]);

  const loadAvailablePositions = async () => {
    if (!activeCompany || !position.orgChartId) return;

    try {
      setLoadingPositions(true);
      const hierarchy = await OrgChartService.getOrgChartHierarchy(activeCompany._id, position.orgChartId);

      // Filter only positions, exclude current position
      const positions = hierarchy
        .filter((row) => row.type === "position" && row._id !== position._id)
        .map((row) => row.original as Position);

      setAvailablePositions(positions);
    } catch (error) {
      console.error("Failed to load positions:", error);
    } finally {
      setLoadingPositions(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        title: formData.title,
        description: formData.description,
        reportsToPositionId: formData.reportsToPositionId || undefined,
        // Code is auto-generated and readonly
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
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      title: position.title,
      description: position.description || "",
      reportsToPositionId: position.reportsToPositionId || "",
      salaryMin: position.salaryMin,
      salaryMax: position.salaryMax,
      salaryCurrency: position.salaryCurrency,
      salaryFrequency: position.salaryFrequency,
      summary: position.jobDescription?.summary || "",
      responsibilities: position.jobDescription?.responsibilities?.join("\n") || "",
      requirements: position.jobDescription?.requirements?.join("\n") || "",
      qualifications: position.jobDescription?.qualifications?.join("\n") || "",
    });
  };

  const selectedReportsToPosition = availablePositions.find((p) => p._id.split(":").pop() === formData.reportsToPositionId);
  const currentReportsToPosition = availablePositions.find((p) => p._id.split(":").pop() === position.reportsToPositionId);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="size-5 text-orange-500" />
            <div>
              <CardTitle>{position.title}</CardTitle>
              <CardDescription>Position</CardDescription>
            </div>
          </div>
          <Badge variant="outline">Level {position.level}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="reportsTo">Reports To (Manager)</Label>
                <Popover open={positionSelectOpen} onOpenChange={setPositionSelectOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={positionSelectOpen}
                      className="w-full justify-between"
                      disabled={loadingPositions}
                    >
                      {formData.reportsToPositionId
                        ? selectedReportsToPosition?.title || formData.reportsToPositionId
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
                          <CommandItem
                            value=""
                            onSelect={() => {
                              setFormData({ ...formData, reportsToPositionId: "" });
                              setPositionSelectOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                !formData.reportsToPositionId ? "opacity-100" : "opacity-0"
                              )}
                            />
                            No manager (top position)
                          </CommandItem>
                          {availablePositions.map((pos) => {
                            const posId = pos._id.split(":").pop()!;
                            return (
                              <CommandItem
                                key={pos._id}
                                value={posId}
                                onSelect={() => {
                                  setFormData({ ...formData, reportsToPositionId: posId });
                                  setPositionSelectOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.reportsToPositionId === posId ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span>{pos.title}</span>
                                  {pos.code && <span className="text-xs text-muted-foreground">{pos.code}</span>}
                                </div>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="salaryMin">Min Salary</Label>
                  <Input
                    id="salaryMin"
                    type="number"
                    value={formData.salaryMin}
                    onChange={(e) => setFormData({ ...formData, salaryMin: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="salaryMax">Max Salary</Label>
                  <Input
                    id="salaryMax"
                    type="number"
                    value={formData.salaryMax}
                    onChange={(e) => setFormData({ ...formData, salaryMax: parseFloat(e.target.value) })}
                  />
                </div>
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
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="summary">Job Summary</Label>
                <Textarea
                  id="summary"
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="responsibilities">Responsibilities (one per line)</Label>
                <Textarea
                  id="responsibilities"
                  value={formData.responsibilities}
                  onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="requirements">Requirements (one per line)</Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="qualifications">Qualifications (one per line)</Label>
                <Textarea
                  id="qualifications"
                  value={formData.qualifications}
                  onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

        <div className="flex items-center gap-2 pt-4 border-t flex-wrap">
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="size-4 mr-2" />
            Save
          </Button>
          <Button onClick={handleCancel} variant="outline" disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={onGeneratePDF} variant="outline" size="sm">
            <FileDown className="size-4 mr-2" />
            Job Description
          </Button>
          {permissions.canDelete && (
            <Button onClick={onDelete} variant="destructive" size="sm">
              <Trash2 className="size-4 mr-2" />
              Delete Position
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
