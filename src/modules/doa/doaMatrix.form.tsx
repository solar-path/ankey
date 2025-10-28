/**
 * DOA Matrix Form Component
 *
 * TODO: This form needs to be implemented with drag-and-drop approval blocks
 * Requires @dnd-kit packages to be installed
 */

import { Button } from "@/lib/ui/button";
import { Card, CardContent } from "@/lib/ui/card";
import { AlertCircle } from "lucide-react";
import type { ApprovalMatrix } from "@/modules/shared/database/db";

interface DOAMatrixFormProps {
  companyId: string;
  matrix?: ApprovalMatrix;
  onSuccess: () => void;
  onCancel: () => void;
}

export function DOAMatrixForm({ onCancel }: DOAMatrixFormProps) {
  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="size-5 text-amber-700" />
          <h3 className="text-lg font-semibold text-amber-700">Form Not Implemented Yet</h3>
        </div>
        <p className="text-amber-600 mb-4">
          The approval matrix form requires additional development:
        </p>
        <ul className="text-sm text-amber-600 space-y-1 list-disc list-inside mb-4">
          <li>Install @dnd-kit packages for drag-and-drop</li>
          <li>Create approval block editor with user selection</li>
          <li>Implement level ordering and approval logic</li>
          <li>Add form validation with Valibot</li>
        </ul>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Back to List
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
