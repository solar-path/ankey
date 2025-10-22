"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  type RowSelectionState,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  Search,
  Trash2,
  Download,
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
import { Checkbox } from "@/lib/ui/checkbox";
import { Input } from "@/lib/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/lib/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/lib/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface QTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKey?: string;
  filterable?: boolean;
  pageSizes?: number[];
  defaultPageSize?: number;
  onRowClick?: (row: TData) => void;
  rowActions?: (row: TData) => React.ReactNode;
  massActions?: (selectedRows: TData[]) => React.ReactNode;
  mainButton?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  };
  enableRowSelection?: boolean;
  className?: string;
  emptyMessage?: string;
}

export function QTable<TData, TValue>({
  columns,
  data,
  searchable = true,
  searchPlaceholder = "Search...",
  searchKey,
  filterable = true,
  pageSizes = [25, 50, 75],
  defaultPageSize = 25,
  onRowClick,
  rowActions,
  massActions,
  mainButton,
  enableRowSelection = true,
  className,
  emptyMessage = "No results found.",
}: QTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  // Add selection column if enabled
  const tableColumns = React.useMemo(() => {
    if (!enableRowSelection) return columns;

    const selectionColumn: ColumnDef<TData, TValue> = {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    };

    return [selectionColumn, ...columns];
  }, [columns, enableRowSelection]);

  // Add row actions column if provided
  const finalColumns = React.useMemo(() => {
    if (!rowActions) return tableColumns;

    const actionsColumn: ColumnDef<TData, TValue> = {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => rowActions(row.original),
      enableSorting: false,
      enableHiding: false,
    };

    return [...tableColumns, actionsColumn];
  }, [tableColumns, rowActions]);

  const table = useReactTable({
    data,
    columns: finalColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: defaultPageSize,
      },
    },
  });

  const selectedRows = React.useMemo(() => {
    return table.getFilteredSelectedRowModel().rows.map((row) => row.original);
  }, [table, rowSelection]);

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Header: Search, Filters, Column Visibility, Mass Actions, Main Button */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-2">
          {/* Search */}
          {searchable && (
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
          )}

          {/* Column Visibility Toggle */}
          {filterable && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="default">
                  Columns <ChevronDown className="ml-2 size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                  .getAllColumns()
                  .filter(
                    (column) =>
                      typeof column.accessorFn !== "undefined" && column.getCanHide()
                  )
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Mass Actions & Main Button */}
        <div className="flex items-center gap-2">
          {/* Mass Actions */}
          {enableRowSelection && selectedRows.length > 0 && massActions && (
            <div className="flex items-center gap-2 border-r pr-2">
              <div className="text-sm font-medium text-muted-foreground">
                {selectedRows.length} selected
              </div>
              {massActions(selectedRows)}
            </div>
          )}

          {/* Main Button */}
          {mainButton && (
            <Button onClick={mainButton.onClick}>
              {mainButton.icon}
              {mainButton.label}
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={onRowClick ? "cursor-pointer" : ""}
                  onClick={() => {
                    if (onRowClick && !row.getIsSelected()) {
                      onRowClick(row.original);
                    }
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={finalColumns.length}
                  className="h-24 text-center"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            Rows per page
          </p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizes.map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Selection Info */}
      {enableRowSelection && (
        <div className="text-xs text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
      )}
    </div>
  );
}

// Helper component for sortable column headers
export function SortableHeader({
  column,
  children,
}: {
  column: any;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="-ml-3 h-8 data-[state=open]:bg-accent"
    >
      {children}
      <ArrowUpDown className="ml-2 size-4" />
    </Button>
  );
}

// Helper component for row actions dropdown
export function RowActionsDropdown({
  actions,
}: {
  actions: { label: string; icon?: React.ReactNode; onClick: () => void; variant?: "default" | "destructive" }[];
}) {
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
        {actions.map((action, index) => (
          <DropdownMenuItem
            key={index}
            onClick={action.onClick}
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
}

// Example mass action buttons
export function MassActionButtons({
  onDelete,
  onExport,
}: {
  onDelete?: () => void;
  onExport?: () => void;
}) {
  return (
    <>
      {onExport && (
        <Button variant="outline" size="sm" onClick={onExport}>
          <Download className="size-4" />
          Export
        </Button>
      )}
      {onDelete && (
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 className="size-4" />
          Delete
        </Button>
      )}
    </>
  );
}
