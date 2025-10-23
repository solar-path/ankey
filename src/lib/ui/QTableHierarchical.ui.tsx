/**
 * QTableHierarchical - Enhanced table for hierarchical data with inline editing
 * Inspired by Asana's table view
 */

"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type ExpandedState,
  type SortingState,
  type VisibilityState,
  type RowSelectionState,
  type Row,
} from "@tanstack/react-table";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  MoreHorizontal,
  Search,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/lib/ui/table";
import { Button } from "@/lib/ui/button";
import { Input } from "@/lib/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/lib/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export interface HierarchicalRow {
  _id: string;
  level: number; // 0 = root, 1 = child, 2 = grandchild, etc.
  hasChildren: boolean;
  parentId?: string;
  [key: string]: any;
}

export interface InlineEditConfig<TData> {
  field: keyof TData;
  type: "text" | "number" | "select" | "date";
  options?: { label: string; value: any }[]; // For select type
  onSave: (row: TData, value: any) => Promise<void>;
  validate?: (value: any) => string | null; // Return error message or null
  canEdit?: (row: TData) => boolean;
}

export interface RowAction<TData> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: TData) => void;
  variant?: "default" | "destructive";
  show?: (row: TData) => boolean;
}

export interface QTableHierarchicalProps<TData extends HierarchicalRow> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKey?: string;
  defaultExpanded?: boolean; // Expand all rows by default
  indentSize?: number; // Indent size in pixels per level
  inlineEdit?: InlineEditConfig<TData>[];
  rowActions?: RowAction<TData>[];
  onAddChild?: (parent: TData) => void;
  className?: string;
  emptyMessage?: string;
}

// ============================================================================
// Inline Edit Cell Component
// ============================================================================

interface InlineEditCellProps<TData> {
  row: TData;
  config: InlineEditConfig<TData>;
  initialValue: any;
}

function InlineEditCell<TData>({ row, config, initialValue }: InlineEditCellProps<TData>) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [value, setValue] = React.useState(initialValue);
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const canEdit = config.canEdit ? config.canEdit(row) : true;

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (config.validate) {
      const validationError = config.validate(value);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setIsSaving(true);
    setError(null);

    try {
      await config.onSave(row, value);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setValue(initialValue);
    setError(null);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  if (!canEdit) {
    return <span className="text-sm">{initialValue || "-"}</span>;
  }

  if (!isEditing) {
    return (
      <div
        className="group flex items-center gap-2 cursor-pointer hover:bg-accent/50 -mx-2 px-2 py-1 rounded"
        onClick={() => setIsEditing(true)}
      >
        <span className="text-sm flex-1">{value || "-"}</span>
        <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100">
          Click to edit
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {config.type === "select" && config.options ? (
        <select
          ref={inputRef as any}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {config.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <Input
          ref={inputRef}
          type={config.type}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          className="h-8"
        />
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex items-center gap-1">
        <Button size="sm" variant="ghost" onClick={handleSave} disabled={isSaving} className="h-6 text-xs">
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={handleCancel} disabled={isSaving} className="h-6 text-xs">
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function QTableHierarchical<TData extends HierarchicalRow>({
  columns,
  data,
  searchable = true,
  searchPlaceholder = "Search...",
  searchKey,
  defaultExpanded = true,
  indentSize = 24,
  inlineEdit = [],
  rowActions = [],
  onAddChild,
  className,
  emptyMessage = "No results found.",
}: QTableHierarchicalProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [expanded, setExpanded] = React.useState<ExpandedState>(
    defaultExpanded
      ? data.reduce((acc, row) => {
          if (row.hasChildren) {
            (acc as Record<string, boolean>)[row._id] = true;
          }
          return acc;
        }, {} as ExpandedState)
      : {}
  );

  // Enhanced columns with expand/collapse and actions
  const enhancedColumns = React.useMemo(() => {
    const cols: ColumnDef<TData, any>[] = [...columns];

    // Add row actions column if provided
    if (rowActions.length > 0) {
      cols.push({
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const visibleActions = rowActions.filter((action) => !action.show || action.show(row.original));

          if (visibleActions.length === 0) return null;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {visibleActions.map((action, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={() => action.onClick(row.original)}
                    className={cn(
                      action.variant === "destructive" && "text-destructive focus:text-destructive"
                    )}
                  >
                    {action.icon && <span className="mr-2">{action.icon}</span>}
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        enableSorting: false,
        enableHiding: false,
      });
    }

    return cols;
  }, [columns, rowActions]);

  const table = useReactTable({
    data,
    columns: enhancedColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onExpandedChange: setExpanded,
    globalFilterFn: "includesString",
    getSubRows: (row) => {
      // Filter child rows
      return data.filter((r) => r.parentId === row._id);
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      expanded,
    },
  });

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Search */}
      {searchable && (
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={
                searchKey
                  ? (table.getColumn(searchKey)?.getFilterValue() as string) ?? ""
                  : globalFilter
              }
              onChange={(event) => {
                if (searchKey) {
                  table.getColumn(searchKey)?.setFilterValue(event.target.value);
                } else {
                  setGlobalFilter(event.target.value);
                }
              }}
              className="pl-9"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <HierarchicalRow
                  key={row.id}
                  row={row}
                  indentSize={indentSize}
                  inlineEdit={inlineEdit}
                  onAddChild={onAddChild}
                />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={enhancedColumns.length} className="h-24 text-center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ============================================================================
// Hierarchical Row Component
// ============================================================================

interface HierarchicalRowProps<TData extends HierarchicalRow> {
  row: Row<TData>;
  indentSize: number;
  inlineEdit: InlineEditConfig<TData>[];
  onAddChild?: (parent: TData) => void;
}

function HierarchicalRow<TData extends HierarchicalRow>({
  row,
  indentSize,
  inlineEdit,
  onAddChild,
}: HierarchicalRowProps<TData>) {
  const level = row.original.level;
  const hasChildren = row.original.hasChildren;
  const isExpanded = row.getIsExpanded();

  return (
    <TableRow data-state={row.getIsSelected() && "selected"} className="group">
      {row.getVisibleCells().map((cell, cellIndex) => {
        const editConfig = inlineEdit.find((config) => config.field === cell.column.id);

        return (
          <TableCell key={cell.id} style={cellIndex === 0 ? { paddingLeft: `${level * indentSize + 16}px` } : {}}>
            {cellIndex === 0 && (
              <div className="flex items-center gap-1">
                {/* Expand/Collapse Button */}
                {hasChildren ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => row.toggleExpanded()}
                  >
                    {isExpanded ? (
                      <ChevronDown className="size-4" />
                    ) : (
                      <ChevronRight className="size-4" />
                    )}
                  </Button>
                ) : (
                  <div className="w-6" />
                )}

                {/* Add Child Button */}
                {onAddChild && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                    onClick={() => onAddChild(row.original)}
                  >
                    <Plus className="size-4" />
                  </Button>
                )}

                {/* Cell Content with Inline Edit */}
                {editConfig ? (
                  <InlineEditCell
                    row={row.original}
                    config={editConfig}
                    initialValue={row.original[editConfig.field]}
                  />
                ) : (
                  <span className="flex-1">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </span>
                )}
              </div>
            )}

            {cellIndex !== 0 &&
              (editConfig ? (
                <InlineEditCell
                  row={row.original}
                  config={editConfig}
                  initialValue={row.original[editConfig.field]}
                />
              ) : (
                flexRender(cell.column.columnDef.cell, cell.getContext())
              ))}
          </TableCell>
        );
      })}
    </TableRow>
  );
}
