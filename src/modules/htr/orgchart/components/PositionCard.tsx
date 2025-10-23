/**
 * Position Detail Card Component
 * Editable card for position details
 */

import { useState } from "react";
import { Users, Save, Trash2, FileDown } from "lucide-react";
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
import type { Position, OrgChartStatus, SalaryFrequency } from "../orgchart.types";
import { getPositionPermissions } from "../orgchart.types";

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
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: position.title,
    description: position.description || "",
    salaryMin: position.salaryMin,
    salaryMax: position.salaryMax,
    salaryCurrency: position.salaryCurrency,
    salaryFrequency: position.salaryFrequency,
    summary: position.jobDescription?.summary || "",
    responsibilities: position.jobDescription?.responsibilities?.join("\n") || "",
    requirements: position.jobDescription?.requirements?.join("\n") || "",
    qualifications: position.jobDescription?.qualifications?.join("\n") || "",
  });

  const permissions = getPositionPermissions(orgChartStatus);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        title: formData.title,
        description: formData.description,
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
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      title: position.title,
      description: position.description || "",
      salaryMin: position.salaryMin,
      salaryMax: position.salaryMax,
      salaryCurrency: position.salaryCurrency,
      salaryFrequency: position.salaryFrequency,
      summary: position.jobDescription?.summary || "",
      responsibilities: position.jobDescription?.responsibilities?.join("\n") || "",
      requirements: position.jobDescription?.requirements?.join("\n") || "",
      qualifications: position.jobDescription?.qualifications?.join("\n") || "",
    });
    setIsEditing(false);
  };

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
        {isEditing ? (
          <>
            {/* Edit Mode */}
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
                <Label htmlFor="code">Code (Auto-generated)</Label>
                <Input
                  id="code"
                  value={position.code || ""}
                  disabled
                  className="bg-muted"
                />
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

            <div className="flex items-center gap-2">
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="size-4 mr-2" />
                Save
              </Button>
              <Button onClick={handleCancel} variant="outline" disabled={isSaving}>
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* View Mode */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Code</Label>
                <p className="text-sm font-mono">{position.code || "-"}</p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Salary Range</Label>
                <p className="text-sm">
                  {position.salaryMin.toLocaleString()} - {position.salaryMax.toLocaleString()}{" "}
                  {position.salaryCurrency} / {position.salaryFrequency}
                </p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Description</Label>
                <p className="text-sm">{position.description || "-"}</p>
              </div>

              {position.jobDescription?.summary && (
                <div>
                  <Label className="text-xs text-muted-foreground">Summary</Label>
                  <p className="text-sm">{position.jobDescription.summary}</p>
                </div>
              )}

              {position.jobDescription?.responsibilities && position.jobDescription.responsibilities.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Responsibilities</Label>
                  <ul className="text-sm list-disc list-inside">
                    {position.jobDescription.responsibilities.map((resp, i) => (
                      <li key={i}>{resp}</li>
                    ))}
                  </ul>
                </div>
              )}

              {position.jobDescription?.requirements && position.jobDescription.requirements.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Requirements</Label>
                  <ul className="text-sm list-disc list-inside">
                    {position.jobDescription.requirements.map((req, i) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {position.jobDescription?.qualifications && position.jobDescription.qualifications.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Qualifications</Label>
                  <ul className="text-sm list-disc list-inside">
                    {position.jobDescription.qualifications.map((qual, i) => (
                      <li key={i}>{qual}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-4 border-t">
              {permissions.canUpdate && (
                <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                  Edit
                </Button>
              )}
              <Button onClick={onGeneratePDF} variant="outline" size="sm">
                <FileDown className="size-4 mr-2" />
                Job Description PDF
              </Button>
              {permissions.canDelete && (
                <Button onClick={onDelete} variant="destructive" size="sm">
                  <Trash2 className="size-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
