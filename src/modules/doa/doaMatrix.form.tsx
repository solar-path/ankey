/**
 * DOA Matrix Form Component
 *
 * Full-featured form with drag-and-drop approval blocks
 */

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/lib/ui/button";
import { Input } from "@/lib/ui/input";
import { Label } from "@/lib/ui/label";
import { Textarea } from "@/lib/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/lib/ui/select";
import { Checkbox } from "@/lib/ui/checkbox";
import { Card } from "@/lib/ui/card";
import { Calendar } from "@/lib/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/lib/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/lib/ui/command";
import { Plus, Trash2, GripVertical, Check, ChevronsUpDown, ChevronDown, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { callFunction } from "@/lib/api";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type ApprovalMatrix } from "@/modules/shared/types/database.types";
import { DOAService } from "./doa.service";
import { z } from "zod";

// Functional areas available
const FUNCTIONAL_AREAS = [
  { id: "hr", label: "Human Resources" },
  { id: "it", label: "Information Technology" },
  { id: "finance", label: "Finance" },
  { id: "operations", label: "Operations" },
  { id: "sales", label: "Sales" },
  { id: "marketing", label: "Marketing" },
  { id: "legal", label: "Legal" },
  { id: "procurement", label: "Procurement" },
];

// Document types
const DOCUMENT_TYPES = [
  { id: "orgchart", label: "Organization Chart" },
  { id: "department_charter", label: "Department Charter" },
  { id: "job_description", label: "Job Description" },
  { id: "job_offer", label: "Job Offer" },
  { id: "employment_contract", label: "Employment Contract" },
  { id: "termination_notice", label: "Termination Notice" },
];

// Form schemas
const approverFinancialLimitsSchema = z.object({
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().min(0).optional(),
  currency: z.string().min(1),
}).optional();

const formApproverSchema = z.object({
  id: z.string(),
  order: z.number().int().min(1),
  type: z.enum(["position", "user"]),
  value: z.string().min(1, "Approver value is required"),
  label: z.string().min(1, "Label is required"),
  required: z.boolean(),
  timeframe: z.number().int().min(1).nullable(),
  financialLimits: approverFinancialLimitsSchema,
  functionalAreas: z.array(z.string()).optional(),
});

const formBlockSchema = z.object({
  id: z.string(),
  order: z.number().int().min(1),
  mode: z.enum(["sequential", "parallel"]),
  approvers: z.array(formApproverSchema).min(1, "At least one approver required"),
});

const matrixFormSchema = z.object({
  name: z.string().min(1, "Matrix name is required"),
  description: z.string().optional(),
  documentType: z.enum([
    "purchase_order",
    "sales_order",
    "invoice",
    "payment",
    "contract",
    "department_charter",
    "job_description",
    "job_offer",
    "employment_contract",
    "termination_notice",
    "orgchart",
    "other",
  ] as const),
  effectiveFrom: z.string().datetime().optional(),
  effectiveTo: z.string().datetime().nullable().optional(),
  conditions: z.object({
    functionalAreas: z.array(z.string()).optional(),
    departments: z.array(z.string()).optional(),
    categories: z.array(z.string()).optional(),
  }).optional(),
  approvalBlocks: z.array(formBlockSchema).min(1, "At least one block required"),
});

type MatrixFormData = z.infer<typeof matrixFormSchema>;

const createDefaultApprover = (order = 1) => ({
  id: crypto.randomUUID(),
  order,
  type: "user" as const,
  value: "",
  label: "",
  required: true,
  timeframe: null,
  financialLimits: undefined,
  functionalAreas: [],
});

const createDefaultBlock = (order = 1) => ({
  id: crypto.randomUUID(),
  order,
  mode: "sequential" as const,
  approvers: [createDefaultApprover()],
});

interface DOAMatrixFormProps {
  companyId: string;
  matrix?: ApprovalMatrix;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface User {
  _id: string;
  email: string;
  fullname?: string;
}

interface Position {
  id: string;
  title: string;
  departmentId: string;
  code: string;
}

export function DOAMatrixForm({ companyId, matrix, onSuccess, onCancel }: DOAMatrixFormProps) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [hasActiveOrgchart, setHasActiveOrgchart] = useState(false);
  const [effectiveFromOpen, setEffectiveFromOpen] = useState(false);
  const [effectiveToOpen, setEffectiveToOpen] = useState(false);
  const { user } = useAuth();
  const isEditing = !!matrix;

  // Convert existing approval blocks from database format to form format
  const convertApprovalBlocks = (blocks?: any[]): any[] => {
    if (!blocks || blocks.length === 0) {
      return [createDefaultBlock()];
    }

    return blocks.map((block, index) => ({
      id: crypto.randomUUID(),
      order: block.order || index + 1,
      mode: "sequential" as const, // Default mode since old format doesn't have this
      approvers: Array.isArray(block.approvers)
        ? block.approvers.map((approver: string | any, approverIndex: number) => {
            // If approver is a string (user ID), convert to form format
            if (typeof approver === 'string') {
              return {
                id: crypto.randomUUID(),
                order: approverIndex + 1,
                type: "user" as const,
                value: approver,
                label: approver, // Will be replaced when users are loaded
                required: true,
                timeframe: null,
                financialLimits: undefined,
                functionalAreas: [],
              };
            }
            // If approver is an object, convert to form format
            return {
              id: crypto.randomUUID(),
              order: approverIndex + 1,
              type: "user" as const,
              value: approver.userId || approver.value || "",
              label: approver.name || approver.label || "",
              required: true,
              timeframe: null,
              financialLimits: undefined,
              functionalAreas: [],
            };
          })
        : [createDefaultApprover()],
    }));
  };

  const {
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
    register,
  } = useForm<MatrixFormData>({
    resolver: zodResolver(matrixFormSchema),
    defaultValues: {
      name: matrix?.name || "",
      description: matrix?.description || "",
      documentType: (matrix?.documentType as any) || undefined,
      effectiveFrom: undefined,
      effectiveTo: undefined,
      conditions: { functionalAreas: [], departments: [], categories: [] },
      approvalBlocks: convertApprovalBlocks(matrix?.approvalBlocks as any),
    },
  });

  const { fields: blockFields, append: appendBlock, remove: removeBlock, move: moveBlock } = useFieldArray({
    control,
    name: "approvalBlocks",
  });

  // Fetch users and orgchart data
  useEffect(() => {
    const fetchData = async () => {
      if (!companyId) return;

      try {
        console.log("Fetching users for companyId:", companyId);

        // Fetch company members
        const membersResult = await callFunction("company.get_company_members", {
          company_id: companyId,
        });

        if (membersResult && Array.isArray(membersResult)) {
          const formattedUsers = membersResult.map((member: any) => ({
            _id: member.userId || member.user_id,
            email: member.email || "",
            fullname: member.fullname || member.fullName || member.email,
          }));
          setUsers(formattedUsers);
          console.log("Loaded users:", formattedUsers);
        }

        // TODO: Fetch active orgchart for position selection
        // For now, orgchart is not available
        setHasActiveOrgchart(false);
        setPositions([]);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast.error("Failed to load users");
      }
    };
    fetchData();
  }, [companyId]);

  // Update approver labels when users are loaded
  useEffect(() => {
    if (users.length === 0) return;

    const currentBlocks = watch("approvalBlocks");
    let updated = false;

    currentBlocks.forEach((block, blockIndex) => {
      block.approvers.forEach((approver, approverIndex) => {
        if (approver.type === "user" && approver.value) {
          const user = users.find((u) => u._id === approver.value);
          if (user && approver.label !== user.fullname) {
            setValue(
              `approvalBlocks.${blockIndex}.approvers.${approverIndex}.label`,
              user.fullname || user.email
            );
            updated = true;
          }
        }
      });
    });

    if (updated) {
      console.log("Updated approver labels with user names");
    }
  }, [users, watch, setValue]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleBlockDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = blockFields.findIndex((field) => field.id === active.id);
      const newIndex = blockFields.findIndex((field) => field.id === over.id);

      moveBlock(oldIndex, newIndex);

      setTimeout(() => {
        const currentBlocks = watch("approvalBlocks");
        currentBlocks.forEach((_, index) => {
          setValue(`approvalBlocks.${index}.order`, index + 1);
        });
      }, 0);
    }
  };

  const onSubmit = async (data: MatrixFormData) => {
    if (!user) {
      toast.error("User not authenticated");
      return;
    }

    setLoading(true);
    try {
      if (isEditing && matrix?._id) {
        await DOAService.updateMatrix(companyId, matrix._id, {
          name: data.name,
          description: data.description,
          documentType: data.documentType,
          approvalBlocks: data.approvalBlocks as any,
        });

        toast.success("Approval matrix updated successfully");
      } else {
        await DOAService.createMatrix(
          companyId,
          {
            name: data.name,
            description: data.description,
            documentType: data.documentType,
            approvalBlocks: data.approvalBlocks as any,
            status: "active",
            isActive: true,
            currency: "USD",
          },
          user._id
        );

        toast.success("Approval matrix created successfully");
      }
      onSuccess?.();
    } catch (error) {
      console.error("Failed to save approval matrix:", error);
      toast.error("Failed to save approval matrix");
    } finally {
      setLoading(false);
    }
  };

  const addBlock = () => {
    appendBlock(createDefaultBlock(blockFields.length + 1));
  };

  const effectiveFromDate = watch("effectiveFrom");
  const effectiveToDate = watch("effectiveTo");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Matrix Name *</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="e.g., Org Chart Approval - Standard"
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...register("description")}
            placeholder="Describe when this approval matrix should be used..."
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="documentType">Document Type *</Label>
          <Select
            value={watch("documentType")}
            onValueChange={(value) => setValue("documentType", value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select document type" />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_TYPES.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.documentType && (
            <p className="text-sm text-destructive">{errors.documentType.message}</p>
          )}
        </div>
      </div>

      {/* Effective Period */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Effective From</Label>
          <Popover open={effectiveFromOpen} onOpenChange={setEffectiveFromOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between font-normal">
                {effectiveFromDate ? new Date(effectiveFromDate).toLocaleDateString() : "Select date"}
                <ChevronDown className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={effectiveFromDate ? new Date(effectiveFromDate) : undefined}
                onSelect={(date) => {
                  setValue("effectiveFrom", date?.toISOString());
                  setEffectiveFromOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Effective To</Label>
          <Popover open={effectiveToOpen} onOpenChange={setEffectiveToOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between font-normal">
                {effectiveToDate ? new Date(effectiveToDate).toLocaleDateString() : "No end date"}
                <ChevronDown className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={effectiveToDate ? new Date(effectiveToDate) : undefined}
                disabled={(date) => effectiveFromDate ? date < new Date(effectiveFromDate) : false}
                onSelect={(date) => {
                  setValue("effectiveTo", date?.toISOString() || null);
                  setEffectiveToOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Approval Blocks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Approval Blocks</Label>
          <Button type="button" variant="outline" size="sm" onClick={addBlock}>
            <Plus className="size-4 mr-1" />
            Add Block
          </Button>
        </div>

        {!hasActiveOrgchart && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md">
            <AlertCircle className="size-4 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              No active organization chart found. Only user-based approvers are available.
            </p>
          </div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleBlockDragEnd}
        >
          <SortableContext
            items={blockFields.map((field) => field.id)}
            strategy={verticalListSortingStrategy}
          >
            {blockFields.map((field, blockIndex) => (
              <SortableBlockCard
                key={field.id}
                id={field.id}
                blockIndex={blockIndex}
                setValue={setValue}
                watch={watch}
                control={control}
                removeBlock={removeBlock}
                canRemove={blockFields.length > 1}
                users={users}
                positions={positions}
                hasActiveOrgchart={hasActiveOrgchart}
              />
            ))}
          </SortableContext>
        </DndContext>

        {errors.approvalBlocks && (
          <p className="text-sm text-destructive">{errors.approvalBlocks.message as string}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : isEditing ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}

// Sortable Block Card Component
interface SortableBlockCardProps {
  id: string;
  blockIndex: number;
  setValue: any;
  watch: any;
  control: any;
  removeBlock: (index: number) => void;
  canRemove: boolean;
  users: User[];
  positions: Position[];
  hasActiveOrgchart: boolean;
}

function SortableBlockCard({
  id,
  blockIndex,
  setValue,
  watch,
  control,
  removeBlock,
  canRemove,
  users,
  positions,
  hasActiveOrgchart,
}: SortableBlockCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const { fields: approverFields, append, remove, move } = useFieldArray({
    control,
    name: `approvalBlocks.${blockIndex}.approvers`,
  });

  const blockMode = watch(`approvalBlocks.${blockIndex}.mode`);

  const addApprover = () => {
    append(createDefaultApprover(approverFields.length + 1));
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleApproverDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = approverFields.findIndex((field) => field.id === active.id);
      const newIndex = approverFields.findIndex((field) => field.id === over.id);

      move(oldIndex, newIndex);

      setTimeout(() => {
        approverFields.forEach((_, index) => {
          setValue(`approvalBlocks.${blockIndex}.approvers.${index}.order`, index + 1);
        });
      }, 0);
    }
  };

  return (
    <Card ref={setNodeRef} style={style} className="p-4">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div {...attributes} {...listeners} className="cursor-grab">
            <GripVertical className="size-4 text-muted-foreground" />
          </div>
          <Label className="flex-1">Block {blockIndex + 1}</Label>
          <Select
            value={blockMode}
            onValueChange={(value: "sequential" | "parallel") =>
              setValue(`approvalBlocks.${blockIndex}.mode`, value)
            }
          >
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sequential">Sequential</SelectItem>
              <SelectItem value="parallel">Parallel</SelectItem>
            </SelectContent>
          </Select>
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => removeBlock(blockIndex)}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          )}
        </div>

        <div className="space-y-2 pl-6">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Approvers</Label>
            <Button type="button" variant="ghost" size="sm" onClick={addApprover}>
              <Plus className="size-3 mr-1" />
              Add
            </Button>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleApproverDragEnd}
          >
            <SortableContext
              items={approverFields.map((field) => field.id)}
              strategy={verticalListSortingStrategy}
            >
              {approverFields.map((field, approverIndex) => (
                <SortableApproverCard
                  key={field.id}
                  id={field.id}
                  blockIndex={blockIndex}
                  approverIndex={approverIndex}
                  setValue={setValue}
                  watch={watch}
                  removeApprover={remove}
                  canRemove={approverFields.length > 1}
                  users={users}
                  positions={positions}
                  hasActiveOrgchart={hasActiveOrgchart}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </Card>
  );
}

// Sortable Approver Card Component
interface SortableApproverCardProps {
  id: string;
  blockIndex: number;
  approverIndex: number;
  setValue: any;
  watch: any;
  removeApprover: (index: number) => void;
  canRemove: boolean;
  users: User[];
  positions: Position[];
  hasActiveOrgchart: boolean;
}

function SortableApproverCard({
  id,
  blockIndex,
  approverIndex,
  setValue,
  watch,
  removeApprover,
  canRemove,
  users,
  positions,
  hasActiveOrgchart,
}: SortableApproverCardProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [criteriaOpen, setCriteriaOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const basePath = `approvalBlocks.${blockIndex}.approvers.${approverIndex}`;
  const approverType = watch(`${basePath}.type`);
  const approverValue = watch(`${basePath}.value`);
  const approverLabel = watch(`${basePath}.label`);
  const financialLimits = watch(`${basePath}.financialLimits`);
  const selectedFunctionalAreas = watch(`${basePath}.functionalAreas`) || [];

  const items = approverType === "position"
    ? positions.map(p => ({ id: p.id, label: `${p.title} (${p.code})` }))
    : users.map(u => ({ id: u._id, label: u.fullname || u.email }));

  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleSelect = (itemId: string, itemLabel: string) => {
    setValue(`${basePath}.value`, itemId);
    setValue(`${basePath}.label`, itemLabel);
    setOpen(false);
    setSearchValue("");
  };

  return (
    <Card ref={setNodeRef} style={style} className="p-2 bg-muted/50">
      <div className="flex items-center gap-2">
        <div {...attributes} {...listeners} className="cursor-grab">
          <GripVertical className="size-3 text-muted-foreground" />
        </div>

        <Select
          value={approverType}
          onValueChange={(value) => {
            setValue(`${basePath}.type`, value as "position" | "user");
            setValue(`${basePath}.value`, "");
            setValue(`${basePath}.label`, "");
          }}
        >
          <SelectTrigger className="h-7 w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {hasActiveOrgchart && <SelectItem value="position">Position</SelectItem>}
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="h-7 flex-1 justify-between text-xs font-normal"
            >
              {approverLabel || "Select..."}
              <ChevronsUpDown className="ml-2 size-3 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[250px] p-0" align="start">
            <Command>
              <CommandInput
                placeholder="Search..."
                value={searchValue}
                onValueChange={setSearchValue}
              />
              <CommandList>
                <CommandEmpty>
                  {approverType === "position" && !hasActiveOrgchart
                    ? "No active organization chart"
                    : `No ${approverType} found.`}
                </CommandEmpty>
                <CommandGroup>
                  {filteredItems.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={item.id}
                      onSelect={() => handleSelect(item.id, item.label)}
                    >
                      <Check
                        className={cn(
                          "mr-2 size-4",
                          approverValue === item.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {item.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Financial Limits */}
        <Input
          type="number"
          placeholder="Min"
          className="h-7 w-20 text-xs"
          value={financialLimits?.minAmount || ""}
          onChange={(e) => {
            const value = e.target.value ? parseFloat(e.target.value) : undefined;
            setValue(`${basePath}.financialLimits.minAmount`, value);
            if (!financialLimits && value !== undefined) {
              setValue(`${basePath}.financialLimits`, { currency: "USD", minAmount: value });
            }
          }}
        />

        <Input
          type="number"
          placeholder="Max"
          className="h-7 w-20 text-xs"
          value={financialLimits?.maxAmount || ""}
          onChange={(e) => {
            const value = e.target.value ? parseFloat(e.target.value) : undefined;
            setValue(`${basePath}.financialLimits.maxAmount`, value);
            if (!financialLimits && value !== undefined) {
              setValue(`${basePath}.financialLimits`, { currency: "USD", maxAmount: value });
            }
          }}
        />

        <Select
          value={financialLimits?.currency || "USD"}
          onValueChange={(value) => {
            setValue(`${basePath}.financialLimits.currency`, value);
            if (!financialLimits) {
              setValue(`${basePath}.financialLimits`, { currency: value });
            }
          }}
        >
          <SelectTrigger className="h-7 w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USD">USD</SelectItem>
            <SelectItem value="EUR">EUR</SelectItem>
            <SelectItem value="GBP">GBP</SelectItem>
            <SelectItem value="JPY">JPY</SelectItem>
          </SelectContent>
        </Select>

        {/* Approval Criteria (Functional Areas) */}
        <Popover open={criteriaOpen} onOpenChange={setCriteriaOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-7 w-[180px] justify-between text-xs font-normal"
            >
              {selectedFunctionalAreas.length > 0
                ? `${selectedFunctionalAreas.length} area${selectedFunctionalAreas.length > 1 ? 's' : ''}`
                : "Select criteria"}
              <ChevronsUpDown className="ml-2 size-3 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[250px] p-3" align="start">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Functional Areas</Label>
              <div className="grid grid-cols-1 gap-2">
                {FUNCTIONAL_AREAS.map((area) => (
                  <div key={area.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${basePath}-fa-${area.id}`}
                      checked={selectedFunctionalAreas.includes(area.id)}
                      onCheckedChange={(checked) => {
                        const current = selectedFunctionalAreas;
                        if (checked) {
                          setValue(`${basePath}.functionalAreas`, [...current, area.id]);
                        } else {
                          setValue(`${basePath}.functionalAreas`, current.filter((faId: string) => faId !== area.id));
                        }
                      }}
                    />
                    <Label htmlFor={`${basePath}-fa-${area.id}`} className="text-sm font-normal cursor-pointer">
                      {area.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => removeApprover(approverIndex)}
          >
            <Trash2 className="size-3 text-destructive" />
          </Button>
        )}
      </div>
    </Card>
  );
}
