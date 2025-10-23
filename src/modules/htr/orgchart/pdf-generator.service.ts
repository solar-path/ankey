/**
 * PDF Generator Service
 * Generates professional PDF documents for organizational chart entities
 */

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Department, Position, Appointment } from "./orgchart.types";

// Extend jsPDF type to include autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}

// Company info for headers/footers
interface CompanyInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string;
}

/**
 * Base PDF configuration
 */
class PDFGenerator {
  protected doc: jsPDF;
  protected pageWidth: number;
  protected pageHeight: number;
  protected margin: number;
  protected currentY: number;
  protected companyInfo: CompanyInfo;

  constructor(companyInfo: CompanyInfo) {
    this.doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 20;
    this.currentY = this.margin;
    this.companyInfo = companyInfo;
  }

  /**
   * Add company header to page
   */
  protected addHeader(title: string) {
    // Company name
    this.doc.setFontSize(10);
    this.doc.setTextColor(100);
    this.doc.text(this.companyInfo.name, this.margin, this.currentY);

    // Document title
    this.doc.setFontSize(20);
    this.doc.setTextColor(0);
    this.doc.setFont("helvetica", "bold");
    this.currentY += 15;
    this.doc.text(title, this.margin, this.currentY);

    // Divider line
    this.currentY += 5;
    this.doc.setDrawColor(200);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);

    this.currentY += 10;
    this.doc.setFont("helvetica", "normal");
  }

  /**
   * Add footer with page numbers
   */
  protected addFooter() {
    const pageCount = this.doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(8);
      this.doc.setTextColor(150);

      // Page number
      const pageText = `Page ${i} of ${pageCount}`;
      const textWidth = this.doc.getTextWidth(pageText);
      this.doc.text(pageText, this.pageWidth - this.margin - textWidth, this.pageHeight - 10);

      // Date
      const dateText = new Date().toLocaleDateString();
      this.doc.text(dateText, this.margin, this.pageHeight - 10);

      // Company contact info
      if (this.companyInfo.email) {
        const emailWidth = this.doc.getTextWidth(this.companyInfo.email);
        this.doc.text(this.companyInfo.email, (this.pageWidth - emailWidth) / 2, this.pageHeight - 10);
      }
    }
  }

  /**
   * Add section title
   */
  protected addSection(title: string) {
    this.checkPageBreak(15);
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(0);
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 8;
    this.doc.setFont("helvetica", "normal");
  }

  /**
   * Add paragraph text
   */
  protected addParagraph(text: string, indent: number = 0) {
    this.checkPageBreak(10);
    this.doc.setFontSize(10);
    this.doc.setTextColor(0);
    const lines = this.doc.splitTextToSize(text, this.pageWidth - 2 * this.margin - indent);
    this.doc.text(lines, this.margin + indent, this.currentY);
    this.currentY += lines.length * 5 + 3;
  }

  /**
   * Add bullet point
   */
  protected addBullet(text: string, indent: number = 5) {
    this.checkPageBreak(10);
    this.doc.setFontSize(10);
    this.doc.text("•", this.margin + indent, this.currentY);
    const lines = this.doc.splitTextToSize(text, this.pageWidth - 2 * this.margin - indent - 10);
    this.doc.text(lines, this.margin + indent + 5, this.currentY);
    this.currentY += lines.length * 5 + 2;
  }

  /**
   * Add key-value pair
   */
  protected addKeyValue(key: string, value: string) {
    this.checkPageBreak(8);
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(`${key}:`, this.margin, this.currentY);
    this.doc.setFont("helvetica", "normal");
    const keyWidth = this.doc.getTextWidth(`${key}:`);
    this.doc.text(value, this.margin + keyWidth + 3, this.currentY);
    this.currentY += 6;
  }

  /**
   * Check if we need a page break
   */
  protected checkPageBreak(requiredSpace: number) {
    if (this.currentY + requiredSpace > this.pageHeight - 30) {
      this.doc.addPage();
      this.currentY = this.margin;
    }
  }

  /**
   * Add spacing
   */
  protected addSpace(amount: number = 5) {
    this.currentY += amount;
  }

  /**
   * Save PDF
   */
  protected save(filename: string) {
    this.addFooter();
    this.doc.save(filename);
  }
}

// ============================================================================
// 1. Department Charter Generator
// ============================================================================

export class DepartmentCharterPDF extends PDFGenerator {
  generate(department: Department, orgChartTitle: string) {
    this.addHeader("DEPARTMENT CHARTER");

    // Basic Information
    this.addSection("Department Information");
    this.addKeyValue("Department Name", department.title);
    if (department.code) this.addKeyValue("Department Code", department.code);
    this.addKeyValue("Organizational Chart", orgChartTitle);
    if (department.description) this.addKeyValue("Description", department.description);
    this.addKeyValue("Headcount Limit", department.headcount.toString());
    this.addKeyValue("Created", new Date(department.createdAt).toLocaleDateString());

    // Mission
    if (department.charter?.mission) {
      this.addSpace(10);
      this.addSection("Mission");
      this.addParagraph(department.charter.mission);
    }

    // Objectives
    if (department.charter?.objectives && department.charter.objectives.length > 0) {
      this.addSpace(10);
      this.addSection("Objectives");
      department.charter.objectives.forEach((objective) => {
        this.addBullet(objective);
      });
    }

    // Responsibilities
    if (department.charter?.responsibilities && department.charter.responsibilities.length > 0) {
      this.addSpace(10);
      this.addSection("Responsibilities");
      department.charter.responsibilities.forEach((responsibility) => {
        this.addBullet(responsibility);
      });
    }

    // KPIs section removed per requirements

    // Approval Section
    this.addSpace(20);
    this.addSection("Approvals");
    this.currentY += 10;

    // Signature lines
    const signatureY = this.currentY;
    this.doc.line(this.margin, signatureY, this.margin + 60, signatureY);
    this.doc.text("Department Head", this.margin, signatureY + 5);
    this.doc.text("Date: __________", this.margin, signatureY + 12);

    this.doc.line(this.pageWidth - this.margin - 60, signatureY, this.pageWidth - this.margin, signatureY);
    this.doc.text("Authorized By", this.pageWidth - this.margin - 60, signatureY + 5);
    this.doc.text("Date: __________", this.pageWidth - this.margin - 60, signatureY + 12);

    this.save(`Department_Charter_${department.code || department.title.replace(/\s+/g, "_")}.pdf`);
  }
}

// ============================================================================
// 2. Job Description Generator
// ============================================================================

export class JobDescriptionPDF extends PDFGenerator {
  generate(position: Position, department: Department, orgChartTitle: string) {
    this.addHeader("JOB DESCRIPTION");

    // Position Information
    this.addSection("Position Information");
    this.addKeyValue("Position Title", position.title);
    if (position.code) this.addKeyValue("Position Code", position.code);
    this.addKeyValue("Department", department.title);
    this.addKeyValue("Organizational Chart", orgChartTitle);
    if (position.description) this.addKeyValue("Description", position.description);

    // Compensation
    this.addSpace(10);
    this.addSection("Compensation Range");
    const formatSalary = (amount: number) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: position.salaryCurrency,
      }).format(amount);
    };

    this.addKeyValue("Minimum Salary", `${formatSalary(position.salaryMin)} (${position.salaryFrequency})`);
    this.addKeyValue("Maximum Salary", `${formatSalary(position.salaryMax)} (${position.salaryFrequency})`);

    // Job Summary
    if (position.jobDescription?.summary) {
      this.addSpace(10);
      this.addSection("Job Summary");
      this.addParagraph(position.jobDescription.summary);
    }

    // Responsibilities
    if (position.jobDescription?.responsibilities && position.jobDescription.responsibilities.length > 0) {
      this.addSpace(10);
      this.addSection("Key Responsibilities");
      position.jobDescription.responsibilities.forEach((responsibility) => {
        this.addBullet(responsibility);
      });
    }

    // Requirements
    if (position.jobDescription?.requirements && position.jobDescription.requirements.length > 0) {
      this.addSpace(10);
      this.addSection("Requirements");
      position.jobDescription.requirements.forEach((requirement) => {
        this.addBullet(requirement);
      });
    }

    // Qualifications
    if (position.jobDescription?.qualifications && position.jobDescription.qualifications.length > 0) {
      this.addSpace(10);
      this.addSection("Qualifications");
      position.jobDescription.qualifications.forEach((qualification) => {
        this.addBullet(qualification);
      });
    }

    // Benefits section removed per requirements

    // Footer note
    this.addSpace(15);
    this.doc.setFontSize(8);
    this.doc.setTextColor(100);
    this.addParagraph(
      "This job description is not designed to cover or contain a comprehensive listing of activities, duties, or responsibilities that are required of the employee. Duties, responsibilities, and activities may change or new ones may be assigned at any time with or without notice."
    );

    this.save(`Job_Description_${position.code || position.title.replace(/\s+/g, "_")}.pdf`);
  }
}

// ============================================================================
// 3. Job Offer Generator
// ============================================================================

export class JobOfferPDF extends PDFGenerator {
  generate(
    appointment: Appointment,
    position: Position,
    department: Department,
    candidateName: string,
    candidateAddress: string
  ) {
    this.addHeader("JOB OFFER LETTER");

    // Date
    this.addParagraph(new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    }));
    this.addSpace(10);

    // Candidate address
    this.addParagraph(candidateName);
    this.addParagraph(candidateAddress);
    this.addSpace(10);

    // Salutation
    this.addParagraph(`Dear ${candidateName},`);
    this.addSpace(5);

    // Opening paragraph
    this.addParagraph(
      `We are pleased to offer you the position of ${position.title} with ${this.companyInfo.name}. We believe your skills and experience will be a valuable addition to our ${department.title} team.`
    );
    this.addSpace(10);

    // Position Details
    this.addSection("Position Details");
    this.addKeyValue("Position Title", position.title);
    this.addKeyValue("Department", department.title);
    if (position.code) this.addKeyValue("Position Code", position.code);

    if (appointment.jobOffer?.startDate) {
      this.addKeyValue(
        "Start Date",
        new Date(appointment.jobOffer.startDate).toLocaleDateString()
      );
    }

    // Compensation
    this.addSpace(10);
    this.addSection("Compensation");

    if (appointment.jobOffer?.salary) {
      const formatSalary = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: appointment.jobOffer!.salaryCurrency,
        }).format(amount);
      };

      this.addKeyValue(
        "Salary",
        `${formatSalary(appointment.jobOffer.salary)} (${appointment.jobOffer.salaryFrequency})`
      );
    }

    // Benefits
    if (appointment.jobOffer?.benefits && appointment.jobOffer.benefits.length > 0) {
      this.addSpace(10);
      this.addSection("Benefits");
      appointment.jobOffer.benefits.forEach((benefit) => {
        this.addBullet(benefit);
      });
    }

    // Conditions
    if (appointment.jobOffer?.conditions && appointment.jobOffer.conditions.length > 0) {
      this.addSpace(10);
      this.addSection("Terms and Conditions");
      appointment.jobOffer.conditions.forEach((condition) => {
        this.addBullet(condition);
      });
    }

    // Acceptance
    this.addSpace(15);
    this.addSection("Acceptance");
    this.addParagraph(
      "To accept this offer, please sign and return this letter by [DEADLINE DATE]. If you have any questions, please do not hesitate to contact us."
    );

    this.addSpace(10);
    this.addParagraph("We look forward to welcoming you to our team!");
    this.addSpace(5);
    this.addParagraph("Sincerely,");
    this.addSpace(15);

    // Signature lines
    const signatureY = this.currentY;
    this.doc.line(this.margin, signatureY, this.margin + 60, signatureY);
    this.doc.text("Hiring Manager", this.margin, signatureY + 5);
    this.doc.text(`${this.companyInfo.name}`, this.margin, signatureY + 12);

    this.addSpace(25);
    this.addParagraph("I accept the terms of this offer:");
    this.addSpace(10);

    const acceptanceY = this.currentY;
    this.doc.line(this.margin, acceptanceY, this.margin + 60, acceptanceY);
    this.doc.text("Signature", this.margin, acceptanceY + 5);
    this.doc.text("Date: __________", this.margin, acceptanceY + 12);

    this.save(`Job_Offer_${position.code || position.title.replace(/\s+/g, "_")}.pdf`);
  }
}

// ============================================================================
// 4. Employment Contract Generator
// ============================================================================

export class EmploymentContractPDF extends PDFGenerator {
  generate(
    appointment: Appointment,
    position: Position,
    department: Department,
    employeeName: string,
    employeeAddress: string,
    employeeId: string
  ) {
    this.addHeader("EMPLOYMENT CONTRACT");

    // Contract parties
    this.addSection("Parties to the Agreement");
    this.addParagraph(
      `This Employment Contract ("Agreement") is entered into on ${new Date().toLocaleDateString()}, between:`
    );
    this.addSpace(5);

    this.addParagraph(`EMPLOYER: ${this.companyInfo.name}`, 5);
    if (this.companyInfo.address) {
      this.addParagraph(`Address: ${this.companyInfo.address}`, 5);
    }
    this.addSpace(5);

    this.addParagraph(`EMPLOYEE: ${employeeName}`, 5);
    this.addParagraph(`Address: ${employeeAddress}`, 5);
    this.addParagraph(`Employee ID: ${employeeId}`, 5);

    // Position
    this.addSpace(10);
    this.addSection("1. Position and Duties");
    this.addParagraph(
      `The Employer hereby employs the Employee in the position of ${position.title} within the ${department.title} department.`
    );
    if (position.description) {
      this.addSpace(5);
      this.addParagraph(position.description);
    }

    // Compensation
    this.addSpace(10);
    this.addSection("2. Compensation");
    if (appointment.jobOffer?.salary) {
      const formatSalary = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: appointment.jobOffer!.salaryCurrency,
        }).format(amount);
      };

      this.addParagraph(
        `The Employee shall receive a salary of ${formatSalary(appointment.jobOffer.salary)} (${
          appointment.jobOffer.salaryFrequency
        }), subject to applicable taxes and deductions.`
      );
    }

    // Start Date
    this.addSpace(10);
    this.addSection("3. Commencement Date");
    const startDate = appointment.employmentStartedAt || appointment.jobOffer?.startDate;
    if (startDate) {
      this.addParagraph(
        `Employment shall commence on ${new Date(startDate).toLocaleDateString()}.`
      );
    } else {
      this.addParagraph("Employment commencement date: [TO BE DETERMINED]");
    }

    // Benefits
    if (appointment.jobOffer?.benefits && appointment.jobOffer.benefits.length > 0) {
      this.addSpace(10);
      this.addSection("4. Benefits");
      this.addParagraph("The Employee shall be entitled to the following benefits:");
      appointment.jobOffer.benefits.forEach((benefit) => {
        this.addBullet(benefit);
      });
    }

    // Termination
    this.addSpace(10);
    this.addSection("5. Termination");
    this.addParagraph(
      "Either party may terminate this Agreement by providing [NUMBER] days written notice to the other party. The Employer may terminate employment immediately for cause, including but not limited to misconduct, breach of contract, or unsatisfactory performance."
    );

    // Confidentiality
    this.addSpace(10);
    this.addSection("6. Confidentiality");
    this.addParagraph(
      "The Employee agrees to maintain strict confidentiality regarding all proprietary information, trade secrets, and confidential business information of the Employer, both during and after employment."
    );

    // Governing Law
    this.addSpace(10);
    this.addSection("7. Governing Law");
    this.addParagraph(
      "This Agreement shall be governed by and construed in accordance with the laws of [JURISDICTION]."
    );

    // Entire Agreement
    this.addSpace(10);
    this.addSection("8. Entire Agreement");
    this.addParagraph(
      "This Agreement constitutes the entire agreement between the parties and supersedes all prior negotiations, representations, or agreements, whether written or oral."
    );

    // Signatures
    this.addSpace(20);
    this.addSection("Signatures");
    this.addSpace(10);

    const signatureY = this.currentY;
    this.doc.line(this.margin, signatureY, this.margin + 70, signatureY);
    this.doc.text("Employee Signature", this.margin, signatureY + 5);
    this.doc.text(`Name: ${employeeName}`, this.margin, signatureY + 12);
    this.doc.text("Date: __________", this.margin, signatureY + 19);

    this.doc.line(this.pageWidth - this.margin - 70, signatureY, this.pageWidth - this.margin, signatureY);
    this.doc.text("Employer Representative", this.pageWidth - this.margin - 70, signatureY + 5);
    this.doc.text(`Company: ${this.companyInfo.name}`, this.pageWidth - this.margin - 70, signatureY + 12);
    this.doc.text("Date: __________", this.pageWidth - this.margin - 70, signatureY + 19);

    this.save(`Employment_Contract_${employeeId}.pdf`);
  }
}

// ============================================================================
// 5. Termination Notice Generator
// ============================================================================

export class TerminationNoticePDF extends PDFGenerator {
  generate(
    appointment: Appointment,
    position: Position,
    department: Department,
    employeeName: string,
    employeeId: string,
    terminationDate: Date,
    reason?: string
  ) {
    this.addHeader("NOTICE OF TERMINATION");

    // Date
    this.addParagraph(new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }));
    this.addSpace(10);

    // Employee address
    this.addParagraph(employeeName);
    this.addParagraph(`Employee ID: ${employeeId}`);
    this.addSpace(10);

    // Salutation
    this.addParagraph(`Dear ${employeeName},`);
    this.addSpace(5);

    // Opening paragraph
    this.addParagraph(
      `This letter serves as formal notification that your employment with ${this.companyInfo.name} will be terminated effective ${terminationDate.toLocaleDateString()}.`
    );
    this.addSpace(10);

    // Position details
    this.addSection("Position Information");
    this.addKeyValue("Position Title", position.title);
    this.addKeyValue("Department", department.title);
    if (position.code) this.addKeyValue("Position Code", position.code);

    if (appointment.employmentStartedAt) {
      this.addKeyValue(
        "Employment Start Date",
        new Date(appointment.employmentStartedAt).toLocaleDateString()
      );
    }

    this.addKeyValue("Termination Date", terminationDate.toLocaleDateString());

    // Reason for termination
    if (reason || appointment.terminationReason) {
      this.addSpace(10);
      this.addSection("Reason for Termination");
      this.addParagraph(reason || appointment.terminationReason || "As discussed");
    }

    // Final compensation
    this.addSpace(10);
    this.addSection("Final Compensation");
    this.addParagraph(
      "Your final paycheck will include compensation for all hours worked through your last day of employment, plus any accrued but unused vacation time, in accordance with company policy and applicable law."
    );

    // Return of property
    this.addSpace(10);
    this.addSection("Return of Company Property");
    this.addParagraph(
      "Please ensure that all company property is returned on or before your last day of employment, including but not limited to:"
    );
    this.addBullet("Laptop computer and accessories");
    this.addBullet("Mobile phone and accessories");
    this.addBullet("Access cards and keys");
    this.addBullet("Company documents and files");
    this.addBullet("Any other company-owned equipment or materials");

    // Benefits
    this.addSpace(10);
    this.addSection("Benefits");
    this.addParagraph(
      "Your health insurance coverage will continue through the end of the month in which your termination becomes effective. Information regarding COBRA continuation coverage will be mailed to your address on file."
    );

    // Confidentiality reminder
    this.addSpace(10);
    this.addSection("Confidentiality Obligations");
    this.addParagraph(
      "Please be reminded that your confidentiality obligations as outlined in your employment agreement continue beyond your termination date."
    );

    // Closing
    this.addSpace(10);
    this.addParagraph(
      "If you have any questions regarding this notice or your termination, please contact the Human Resources department."
    );
    this.addSpace(5);
    this.addParagraph("Sincerely,");
    this.addSpace(15);

    // Signature
    const signatureY = this.currentY;
    this.doc.line(this.margin, signatureY, this.margin + 60, signatureY);
    this.doc.text("Human Resources Manager", this.margin, signatureY + 5);
    this.doc.text(`${this.companyInfo.name}`, this.margin, signatureY + 12);

    this.addSpace(25);
    this.addParagraph("Acknowledged and received:");
    this.addSpace(10);

    const ackY = this.currentY;
    this.doc.line(this.margin, ackY, this.margin + 60, ackY);
    this.doc.text("Employee Signature", this.margin, ackY + 5);
    this.doc.text("Date: __________", this.margin, ackY + 12);

    this.save(`Termination_Notice_${employeeId}.pdf`);
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export class PDFGeneratorFactory {
  private static companyInfo: CompanyInfo = {
    name: "Company Name",
    address: "123 Business St, City, State 12345",
    phone: "+1 (555) 123-4567",
    email: "hr@company.com",
    website: "www.company.com",
  };

  static setCompanyInfo(info: CompanyInfo) {
    this.companyInfo = info;
  }

  static generateDepartmentCharter(department: Department, orgChartTitle: string) {
    const generator = new DepartmentCharterPDF(this.companyInfo);
    generator.generate(department, orgChartTitle);
  }

  static generateJobDescription(position: Position, department: Department, orgChartTitle: string) {
    const generator = new JobDescriptionPDF(this.companyInfo);
    generator.generate(position, department, orgChartTitle);
  }

  static generateJobOffer(
    appointment: Appointment,
    position: Position,
    department: Department,
    candidateName: string,
    candidateAddress: string
  ) {
    const generator = new JobOfferPDF(this.companyInfo);
    generator.generate(appointment, position, department, candidateName, candidateAddress);
  }

  static generateEmploymentContract(
    appointment: Appointment,
    position: Position,
    department: Department,
    employeeName: string,
    employeeAddress: string,
    employeeId: string
  ) {
    const generator = new EmploymentContractPDF(this.companyInfo);
    generator.generate(appointment, position, department, employeeName, employeeAddress, employeeId);
  }

  static generateTerminationNotice(
    appointment: Appointment,
    position: Position,
    department: Department,
    employeeName: string,
    employeeId: string,
    terminationDate: Date,
    reason?: string
  ) {
    const generator = new TerminationNoticePDF(this.companyInfo);
    generator.generate(appointment, position, department, employeeName, employeeId, terminationDate, reason);
  }
}
