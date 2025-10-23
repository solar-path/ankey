/**
 * Department Detail Card Component
 * Editable card for department details
 */

import { useState } from "react";
import { Building2, Save, Trash2, FileDown } from "lucide-react";
import { Button } from "@/lib/ui/button";
import { Input } from "@/lib/ui/input";
import { Textarea } from "@/lib/ui/textarea";
import { Label } from "@/lib/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/lib/ui/card";
import { Badge } from "@/lib/ui/badge";
import type { Department, OrgChartStatus } from "../orgchart.types";
import { getDepartmentPermissions } from "../orgchart.types";

interface DepartmentCardProps {
  department: Department;
  orgChartStatus: OrgChartStatus;
  onSave: (updates: Partial<Department>) => Promise<void>;
  onDelete: () => void;
  onGeneratePDF: () => void;
}

export function DepartmentCard({
  department,
  orgChartStatus,
  onSave,
  onDelete,
  onGeneratePDF,
}: DepartmentCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: department.title,
    description: department.description || "",
    code: department.code?.replace("CC-", "") || "",
    headcount: department.headcount,
    mission: department.charter?.mission || "",
    objectives: department.charter?.objectives?.join("\n") || "",
    responsibilities: department.charter?.responsibilities?.join("\n") || "",
  });

  const permissions = getDepartmentPermissions(orgChartStatus);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Ensure code has CC- prefix
      const code = formData.code.startsWith("CC-") ? formData.code : `CC-${formData.code}`;

      await onSave({
        title: formData.title,
        description: formData.description,
        code: code,
        headcount: formData.headcount,
        charter: {
          mission: formData.mission,
          objectives: formData.objectives.split("\n").filter(Boolean),
          responsibilities: formData.responsibilities.split("\n").filter(Boolean),
        },
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      title: department.title,
      description: department.description || "",
      code: department.code?.replace("CC-", "") || "",
      headcount: department.headcount,
      mission: department.charter?.mission || "",
      objectives: department.charter?.objectives?.join("\n") || "",
      responsibilities: department.charter?.responsibilities?.join("\n") || "",
    });
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="size-5 text-green-500" />
            <div>
              <CardTitle>{department.title}</CardTitle>
              <CardDescription>Department</CardDescription>
            </div>
          </div>
          <Badge variant="outline">Level {department.level}</Badge>
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
                <Label htmlFor="code">Code</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-muted-foreground">CC-</span>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => {
                      // Remove CC- prefix if user types it
                      const value = e.target.value.replace("CC-", "");
                      setFormData({ ...formData, code: value });
                    }}
                    placeholder="e.g., FIN-001"
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="headcount">Max Headcount</Label>
                <Input
                  id="headcount"
                  type="number"
                  value={formData.headcount}
                  onChange={(e) => setFormData({ ...formData, headcount: parseInt(e.target.value) })}
                />
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
                <Label htmlFor="mission">Mission</Label>
                <Textarea
                  id="mission"
                  value={formData.mission}
                  onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="objectives">Objectives (one per line)</Label>
                <Textarea
                  id="objectives"
                  value={formData.objectives}
                  onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
                  rows={3}
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
                <p className="text-sm font-mono">{department.code || "-"}</p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Max Headcount</Label>
                <p className="text-sm">{department.headcount}</p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Description</Label>
                <p className="text-sm">{department.description || "-"}</p>
              </div>

              {department.charter?.mission && (
                <div>
                  <Label className="text-xs text-muted-foreground">Mission</Label>
                  <p className="text-sm">{department.charter.mission}</p>
                </div>
              )}

              {department.charter?.objectives && department.charter.objectives.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Objectives</Label>
                  <ul className="text-sm list-disc list-inside">
                    {department.charter.objectives.map((obj, i) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                </div>
              )}

              {department.charter?.responsibilities && department.charter.responsibilities.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Responsibilities</Label>
                  <ul className="text-sm list-disc list-inside">
                    {department.charter.responsibilities.map((resp, i) => (
                      <li key={i}>{resp}</li>
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
                Charter PDF
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
