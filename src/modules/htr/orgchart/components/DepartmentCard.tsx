/**
 * Department Detail Card Component
 * Editable card for department details
 */

import { useState, useEffect } from "react";
import { Building2, Save, Trash2, FileDown } from "lucide-react";
import { Button } from "@/lib/ui/button";
import { Input } from "@/lib/ui/input";
import { Textarea } from "@/lib/ui/textarea";
import { Label } from "@/lib/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/lib/ui/card";
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
  const permissions = getDepartmentPermissions(orgChartStatus);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [originalData, setOriginalData] = useState({
    title: department.title,
    description: department.description || "",
    code: department.code?.replace("CC-", "") || "",
    headcount: department.headcount,
    mission: department.charter?.mission || "",
    objectives: department.charter?.objectives?.join("\n") || "",
    responsibilities: department.charter?.responsibilities?.join("\n") || "",
  });

  const [formData, setFormData] = useState(originalData);

  // Check if form has changes
  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Ensure code has CC- prefix
      const code = formData.code.startsWith("CC-")
        ? formData.code
        : `CC-${formData.code}`;

      await onSave({
        title: formData.title,
        description: formData.description,
        code: code,
        headcount: formData.headcount,
        charter: {
          mission: formData.mission,
          objectives: formData.objectives.split("\n").filter(Boolean),
          responsibilities: formData.responsibilities
            .split("\n")
            .filter(Boolean),
        },
      });

      // Update original data and exit editing mode
      setOriginalData(formData);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(originalData);
    setIsEditing(false);
  };

  const handleFieldClick = () => {
    if (!isEditing) {
      setIsEditing(true);
    }
  };

  // Sync with department changes
  useEffect(() => {
    const newData = {
      title: department.title,
      description: department.description || "",
      code: department.code?.replace("CC-", "") || "",
      headcount: department.headcount,
      mission: department.charter?.mission || "",
      objectives: department.charter?.objectives?.join("\n") || "",
      responsibilities: department.charter?.responsibilities?.join("\n") || "",
    };
    setOriginalData(newData);
    setFormData(newData);
    setIsEditing(false);
  }, [department]);

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
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            {isEditing ? (
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            ) : (
              <div
                onClick={handleFieldClick}
                className="px-3 py-2 rounded-md border border-transparent hover:border-input hover:bg-accent/50 cursor-pointer transition-colors"
              >
                <p className="text-sm font-medium">{formData.title}</p>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="code">Code</Label>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-muted-foreground">
                  CC-
                </span>
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
            ) : (
              <div
                onClick={handleFieldClick}
                className="px-3 py-2 rounded-md border border-transparent hover:border-input hover:bg-accent/50 cursor-pointer transition-colors"
              >
                <p className="text-sm font-mono">
                  CC-{formData.code}
                </p>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="headcount">Headcount (max people)</Label>
            {isEditing ? (
              <>
                <Input
                  id="headcount"
                  type="number"
                  value={formData.headcount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      headcount: parseInt(e.target.value),
                    })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum number of people (non-vacant appointments) allowed in this department
                </p>
              </>
            ) : (
              <div
                onClick={handleFieldClick}
                className="px-3 py-2 rounded-md border border-transparent hover:border-input hover:bg-accent/50 cursor-pointer transition-colors"
              >
                <p className="text-sm font-medium">{formData.headcount} people maximum</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Can create {formData.headcount} appointments (multiple per position allowed)
                </p>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            {isEditing ? (
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                placeholder="Department description..."
              />
            ) : (
              <div
                onClick={handleFieldClick}
                className="px-3 py-2 rounded-md border border-transparent hover:border-input hover:bg-accent/50 cursor-pointer transition-colors min-h-[80px]"
              >
                {formData.description ? (
                  <p className="text-sm whitespace-pre-wrap">{formData.description}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">No description</p>
                )}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="mission">Mission</Label>
            {isEditing ? (
              <Textarea
                id="mission"
                value={formData.mission}
                onChange={(e) =>
                  setFormData({ ...formData, mission: e.target.value })
                }
                rows={2}
                placeholder="Department mission..."
              />
            ) : (
              <div
                onClick={handleFieldClick}
                className="px-3 py-2 rounded-md border border-transparent hover:border-input hover:bg-accent/50 cursor-pointer transition-colors min-h-[60px]"
              >
                {formData.mission ? (
                  <p className="text-sm whitespace-pre-wrap">{formData.mission}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">No mission statement</p>
                )}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="objectives">Objectives</Label>
            {isEditing ? (
              <Textarea
                id="objectives"
                value={formData.objectives}
                onChange={(e) =>
                  setFormData({ ...formData, objectives: e.target.value })
                }
                rows={3}
                placeholder="One objective per line"
              />
            ) : (
              <div
                onClick={handleFieldClick}
                className="px-3 py-2 rounded-md border border-transparent hover:border-input hover:bg-accent/50 cursor-pointer transition-colors min-h-[80px]"
              >
                {formData.objectives ? (
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    {formData.objectives.split("\n").filter(Boolean).map((obj, idx) => (
                      <li key={idx}>{obj}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No objectives specified</p>
                )}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="responsibilities">Responsibilities</Label>
            {isEditing ? (
              <Textarea
                id="responsibilities"
                value={formData.responsibilities}
                onChange={(e) =>
                  setFormData({ ...formData, responsibilities: e.target.value })
                }
                rows={3}
                placeholder="One responsibility per line"
              />
            ) : (
              <div
                onClick={handleFieldClick}
                className="px-3 py-2 rounded-md border border-transparent hover:border-input hover:bg-accent/50 cursor-pointer transition-colors min-h-[80px]"
              >
                {formData.responsibilities ? (
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    {formData.responsibilities.split("\n").filter(Boolean).map((resp, idx) => (
                      <li key={idx}>{resp}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No responsibilities specified</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-4 border-t flex-wrap">
          {hasChanges && (
            <>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="size-4 mr-2" />
                Save
              </Button>
              <Button onClick={handleCancel} variant="outline" disabled={isSaving}>
                Cancel
              </Button>
            </>
          )}
          <Button onClick={onGeneratePDF} variant="outline" size="sm">
            <FileDown className="size-4 mr-2" />
            Department Charter
          </Button>
          {permissions.canDelete && (
            <Button onClick={onDelete} variant="destructive" size="sm">
              <Trash2 className="size-4 mr-2" />
              Delete Department
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
