'use client';

import type { ColumnDef, ColumnFiltersState, RowSelectionState, SortingState, VisibilityState } from '@tanstack/react-table';
import {
    flexRender,
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import * as React from 'react';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
    ArrowDownNarrowWide,
    ArrowUpNarrowWide,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronsLeftIcon,
    ChevronsRightIcon,
    FileSpreadsheetIcon,
    FileTextIcon,
    MoreHorizontalIcon,
    PencilIcon,
    PlusIcon,
    RefreshCwIcon,
    SlidersHorizontalIcon,
    TrashIcon,
    UploadIcon,
} from 'lucide-react';

import { DataTableProps } from '@/shared';

export function QDataTable<TData, TValue>({
    columns,
    data,
    onDelete,
    onEdit,
    onCreate,
    onExportPdf,
    onExportExcel,
    onImport,
    onSync,
    title,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState<string>('');
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [pageSize, setPageSize] = useState<number>(25);
    const [pageIndex, setPageIndex] = useState<number>(0);

    // Add row selection column to the columns
    const columnsWithRowSelection = React.useMemo(() => {
        return [
            {
                id: 'select',
                header: ({ table }) => (
                    <div className="px-1">
                        <input
                            type="checkbox"
                            checked={table.getIsAllPageRowsSelected()}
                            onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
                            aria-label="Select all"
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                    </div>
                ),
                cell: ({ row }) => (
                    <div className="px-1">
                        <input
                            type="checkbox"
                            checked={row.getIsSelected()}
                            onChange={(e) => row.toggleSelected(!!e.target.checked)}
                            aria-label="Select row"
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                    </div>
                ),
                enableSorting: false,
                enableHiding: false,
            },
            ...columns,
            {
                id: 'actions',
                cell: ({ row }) => {
                    return (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="group flex aspect-square items-center justify-center p-0">
                                    <MoreHorizontalIcon className="h-5 w-5 transition-all group-hover:scale-110" />
                                    <span className="sr-only">Open menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                {onEdit && (
                                    <DropdownMenuItem onClick={() => onEdit(row.original)}>
                                        <PencilIcon className="mr-2 h-4 w-4" />
                                        Edit
                                    </DropdownMenuItem>
                                )}
                                {onDelete && (
                                    <DropdownMenuItem onClick={() => onDelete([row.original])}>
                                        <TrashIcon className="mr-2 h-4 w-4" />
                                        Delete
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    );
                },
            },
        ] as ColumnDef<TData, TValue>[];
    }, [columns, onDelete, onEdit]);

    // Keep the page size consistent - don't change it based on data length
    const effectivePageSize = pageSize;

    const table = useReactTable({
        data,
        columns: columnsWithRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        onRowSelectionChange: setRowSelection,
        onColumnVisibilityChange: setColumnVisibility,
        onPaginationChange: (updater) => {
            if (typeof updater === 'function') {
                const newPagination = updater({ pageSize: effectivePageSize, pageIndex });
                setPageIndex(newPagination.pageIndex);
                // Don't update pageSize here - we handle it separately
            } else {
                setPageIndex(updater.pageIndex);
                // Don't update pageSize here - we handle it separately
            }
        },
        state: {
            sorting,
            columnFilters,
            globalFilter,
            rowSelection,
            columnVisibility,
            pagination: {
                pageSize: effectivePageSize,
                pageIndex,
            },
        },
        enableRowSelection: true,
        enableMultiRowSelection: true,
    });

    // Sync table state when pageSize or pageIndex changes externally
    useEffect(() => {
        table.setPageSize(pageSize);
    }, [pageSize, table]);

    useEffect(() => {
        table.setPageIndex(pageIndex);
    }, [pageIndex, table]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between py-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    {title && <h2 className="text-xl font-semibold whitespace-nowrap">{title}</h2>}
                    <Input
                        placeholder="Filter all columns..."
                        value={globalFilter ?? ''}
                        onChange={(event) => setGlobalFilter(event.target.value)}
                        className="w-full md:w-64"
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <TooltipProvider>
                        {onCreate && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="default" onClick={onCreate} className="group flex items-center space-x-2">
                                        <PlusIcon className="h-5 w-5 transition-all group-hover:scale-110" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Create new</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {onExportExcel && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" onClick={onExportExcel} className="group flex items-center space-x-2">
                                        <FileSpreadsheetIcon className="h-5 w-5 transition-all group-hover:scale-110" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Export to Excel</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {onExportPdf && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" onClick={onExportPdf} className="group flex items-center space-x-2">
                                        <FileTextIcon className="h-5 w-5 transition-all group-hover:scale-110" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Export to PDF</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {onImport && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" onClick={onImport} className="group flex items-center space-x-2">
                                        <UploadIcon className="h-5 w-5 transition-all group-hover:scale-110" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Import from Excel</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {onSync && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" onClick={onSync} className="group flex items-center space-x-2">
                                        <RefreshCwIcon className="h-5 w-5 transition-all group-hover:scale-110" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Sync Permissions</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </TooltipProvider>

                    {table.getFilteredSelectedRowModel().rows.length > 0 && onDelete && (
                        <Button
                            variant="destructive"
                            onClick={() => onDelete(table.getFilteredSelectedRowModel().rows.map((row) => row.original))}
                            className="group flex items-center space-x-2"
                        >
                            <TrashIcon className="h-5 w-5 transition-all group-hover:scale-110" />
                            <span>Delete Selected</span>
                        </Button>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="group flex aspect-square items-center justify-center p-0">
                                <SlidersHorizontalIcon className="h-6 w-6 transition-all group-hover:scale-110" />
                                <span className="sr-only">View options</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {table
                                .getAllColumns()
                                .filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide())
                                .map((column) => {
                                    return (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                        >
                                            {column.id}
                                        </DropdownMenuCheckboxItem>
                                    );
                                })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            <div className="max-w-full overflow-x-auto rounded-md border">
                <Table className="w-full table-auto">
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        onClick={header.column.getToggleSortingHandler()}
                                        className="cursor-pointer items-center gap-1 px-4 py-2 whitespace-nowrap transition-colors hover:bg-gray-50"
                                    >
                                        {!header.isPlaceholder && flexRender(header.column.columnDef.header, header.getContext())}
                                        {
                                            {
                                                asc: <ArrowUpNarrowWide className="ml-2 inline h-4 w-4" />,
                                                desc: <ArrowDownNarrowWide className="ml-2 inline h-4 w-4" />,
                                            }[header.column.getIsSorted() as string]
                                        }
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="px-4 py-2 whitespace-nowrap">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columnsWithRowSelection.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end space-x-2">
                <div className="flex-1 text-sm text-muted-foreground">
                    {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.
                </div>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">Items per page:</span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="h-8 px-3">
                                    {pageSize}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {[25, 50, 100].map((size) => (
                                    <DropdownMenuItem
                                        key={size}
                                        onClick={() => {
                                            setPageSize(size);
                                            setPageIndex(0); // Reset to first page when changing page size
                                            // Table will be synced via useEffect
                                        }}
                                    >
                                        {size}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">
                            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                        </span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            className="group flex aspect-square items-center justify-center p-0"
                            onClick={() => setPageIndex(0)}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <ChevronsLeftIcon className="h-6 w-6 transition-all group-hover:scale-110" />
                        </Button>
                        <Button
                            variant="outline"
                            className="group flex aspect-square items-center justify-center p-0"
                            onClick={() => setPageIndex(Math.max(0, pageIndex - 1))}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <ChevronLeftIcon className="h-6 w-6 transition-all group-hover:scale-110" />
                        </Button>
                        <Button
                            variant="outline"
                            className="group flex aspect-square items-center justify-center p-0"
                            onClick={() => setPageIndex(Math.min(table.getPageCount() - 1, pageIndex + 1))}
                            disabled={!table.getCanNextPage()}
                        >
                            <ChevronRightIcon className="h-6 w-6 transition-all group-hover:scale-110" />
                        </Button>
                        <Button
                            variant="outline"
                            className="group flex aspect-square items-center justify-center p-0"
                            onClick={() => setPageIndex(table.getPageCount() - 1)}
                            disabled={!table.getCanNextPage()}
                        >
                            <ChevronsRightIcon className="h-6 w-6 transition-all group-hover:scale-110" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}