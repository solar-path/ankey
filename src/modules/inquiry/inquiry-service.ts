/**
 * Inquiry Service - Thin Client Layer
 *
 * All business logic is in PostgreSQL functions (inquiry.sql)
 * This service just calls Hono API which executes SQL functions
 */

export interface CreateInquiryInput {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  message: string;
  attachments?: Array<{
    name: string;
    type: string;
    size: number;
    data: string;
  }>;
}

export interface Inquiry {
  _id: string;
  id?: string;
  type: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  message: string;
  attachments?: Array<{
    name: string;
    type: string;
    size: number;
    data: string;
  }>;
  status: 'pending' | 'in-progress' | 'resolved' | 'closed';
  response?: string;
  createdAt: number;
  updatedAt: number;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

/**
 * Helper function to call Postgres functions via Hono API
 */
async function callFunction(functionName: string, params: Record<string, any> = {}) {
  const response = await fetch(`${API_URL}/api/${functionName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to call ${functionName}`);
  }

  return response.json();
}

export class InquiryService {
  /**
   * Create new inquiry
   */
  static async createInquiry(input: CreateInquiryInput): Promise<Inquiry> {
    try {
      const result = await callFunction("inquiry.create_inquiry", {
        name: input.name,
        email: input.email,
        company: input.company,
        phone: input.phone,
        message: input.message,
        attachments: input.attachments ? JSON.stringify(input.attachments) : '[]',
      });

      return result as Inquiry;
    } catch (error) {
      console.error("Error creating inquiry:", error);
      throw new Error("Failed to create inquiry");
    }
  }

  /**
   * Get inquiry by ID
   */
  static async getInquiry(inquiryId: string): Promise<Inquiry | null> {
    try {
      const result = await callFunction("inquiry.get_inquiry_by_id", {
        inquiry_id: inquiryId,
      });

      return result as Inquiry | null;
    } catch (error: any) {
      console.error("Error getting inquiry:", error);
      return null;
    }
  }

  /**
   * Update inquiry status
   */
  static async updateStatus(
    inquiryId: string,
    status: Inquiry["status"],
    response?: string
  ): Promise<Inquiry> {
    try {
      const result = await callFunction("inquiry.update_status", {
        inquiry_id: inquiryId,
        status: status,
        response: response,
      });

      return result as Inquiry;
    } catch (error) {
      console.error("Error updating inquiry status:", error);
      throw new Error("Failed to update inquiry status");
    }
  }

  /**
   * Get all inquiries (for admin)
   */
  static async getAllInquiries(
    status?: Inquiry["status"],
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    inquiries: Inquiry[];
    total: number;
    limit: number;
    offset: number;
  }> {
    try {
      const result = await callFunction("inquiry.get_all_inquiries", {
        status: status,
        limit: limit,
        offset: offset,
      });

      return result;
    } catch (error) {
      console.error("Error getting inquiries:", error);
      throw new Error("Failed to get inquiries");
    }
  }

  /**
   * Get inquiries by email
   */
  static async getInquiriesByEmail(email: string): Promise<Inquiry[]> {
    try {
      const result = await callFunction("inquiry.get_inquiries_by_email", {
        email: email,
      });

      return result as Inquiry[];
    } catch (error) {
      console.error("Error getting inquiries by email:", error);
      throw new Error("Failed to get inquiries");
    }
  }

  /**
   * Delete inquiry (admin)
   */
  static async deleteInquiry(inquiryId: string): Promise<void> {
    try {
      await callFunction("inquiry.delete_inquiry", {
        inquiry_id: inquiryId,
      });
    } catch (error) {
      console.error("Error deleting inquiry:", error);
      throw new Error("Failed to delete inquiry");
    }
  }

  /**
   * Get inquiry statistics (admin)
   */
  static async getStatistics(): Promise<{
    total: number;
    byStatus: {
      pending: number;
      inProgress: number;
      resolved: number;
      closed: number;
    };
    byTime: {
      today: number;
      thisWeek: number;
      thisMonth: number;
    };
  }> {
    try {
      const result = await callFunction("inquiry.get_statistics");
      return result;
    } catch (error) {
      console.error("Error getting statistics:", error);
      throw new Error("Failed to get statistics");
    }
  }
}
