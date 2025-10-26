/**
 * XLSX Export Service
 * Exports organizational chart data to Excel format
 */

import * as XLSX from "xlsx";
import type { OrgChartRow } from "./orgchart.types";

export class XLSXExportService {
  /**
   * Export orgchart rows to Excel file
   */
  static exportOrgChartToExcel(rows: OrgChartRow[], orgChartTitle: string) {
    // Prepare data for Excel
    const excelData: any[] = [];

    rows.forEach((row) => {
      if (row.type === "department" || row.type === "position" || row.type === "appointment") {
        const indent = "  ".repeat(row.level);

        excelData.push({
          Title: `${indent}${row.title}`,
          Type: row.type,
          Code: row.code || "",
          Headcount: row.headcount || "",
          "Salary Min": row.salaryMin || "",
          "Salary Max": row.salaryMax || "",
          Currency: row.salaryCurrency || "",
          Frequency: row.salaryFrequency || "",
          Status: row.isVacant !== undefined ? (row.isVacant ? "Vacant" : "Filled") : "",
          "Created At": new Date(row.createdAt).toLocaleDateString(),
          "Updated At": new Date(row.updatedAt).toLocaleDateString(),
        });
      }
    });

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const colWidths = [
      { wch: 50 }, // Title
      { wch: 15 }, // Type
      { wch: 15 }, // Code
      { wch: 12 }, // Headcount
      { wch: 15 }, // Salary Min
      { wch: 15 }, // Salary Max
      { wch: 10 }, // Currency
      { wch: 12 }, // Frequency
      { wch: 10 }, // Status
      { wch: 15 }, // Created At
      { wch: 15 }, // Updated At
    ];
    ws["!cols"] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "OrgChart");

    // Generate filename
    const filename = `OrgChart_${orgChartTitle.replace(/\s+/g, "_")}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);
  }
}
