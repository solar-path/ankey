/**
 * Task Detail Page
 *
 * TODO: This page is for generic DOA (Delegation of Authority) task details.
 * It requires an API backend that doesn't exist yet (@/lib/api-client, @/api/db/schema).
 *
 * For orgchart approval tasks, use: /task/orgchart/:taskId (orgchartApprovalTask.page.tsx)
 *
 * To implement this page:
 * 1. Create @/lib/api-client module with fetch wrapper
 * 2. Create @/api/db/schema with database types
 * 3. Implement /api/tasks endpoints in the Hono API server
 */

import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/lib/ui/card";
import { Button } from "@/lib/ui/button";
import { ArrowLeft, AlertCircle } from "lucide-react";

export default function TaskDetailPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/task")}>
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-3xl font-bold">Task Details</h1>
      </div>

      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700">
            <AlertCircle className="size-5" />
            Not Implemented
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-amber-600">
            This page is for generic DOA (Delegation of Authority) task details.
          </p>
          <p className="text-sm text-amber-600">
            For <strong>Orgchart Approval Tasks</strong>, please use the dedicated page at{" "}
            <code className="bg-amber-100 px-2 py-1 rounded">/task/orgchart/:taskId</code>
          </p>
          <div className="mt-4 p-4 bg-white rounded border border-amber-200">
            <p className="text-sm font-medium mb-2">Required to implement:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Create @/lib/api-client module</li>
              <li>Create @/api/db/schema with database types</li>
              <li>Implement /api/tasks API endpoints</li>
              <li>Implement DOA workflow system</li>
            </ul>
          </div>
          <Button onClick={() => setLocation("/task")}>
            Back to Tasks
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
