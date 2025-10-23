import { inquiriesDB, type Inquiry } from "@/modules/shared/database/db";

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

export class InquiryService {
  // Create new inquiry
  static async createInquiry(input: CreateInquiryInput): Promise<Inquiry> {
    try {
      const inquiryId = `inquiry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const inquiry: Inquiry = {
        _id: inquiryId,
        type: "inquiry",
        name: input.name,
        email: input.email,
        company: input.company,
        phone: input.phone,
        message: input.message,
        attachments: input.attachments || [],
        status: "pending",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await inquiriesDB.put(inquiry);

      return inquiry;
    } catch (error) {
      console.error("Error creating inquiry:", error);
      throw new Error("Failed to create inquiry");
    }
  }

  // Get inquiry by ID
  static async getInquiry(inquiryId: string): Promise<Inquiry | null> {
    try {
      const inquiry = await inquiriesDB.get(inquiryId) as Inquiry;
      return inquiry;
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      console.error("Error getting inquiry:", error);
      throw new Error("Failed to get inquiry");
    }
  }

  // Update inquiry status
  static async updateStatus(
    inquiryId: string,
    status: Inquiry["status"],
    response?: string
  ): Promise<Inquiry> {
    try {
      const inquiry = await inquiriesDB.get(inquiryId) as Inquiry;

      if (!inquiry) {
        throw new Error("Inquiry not found");
      }

      const updatedInquiry: Inquiry = {
        ...inquiry,
        status,
        response: response || inquiry.response,
        updatedAt: Date.now(),
      };

      await inquiriesDB.put(updatedInquiry);

      return updatedInquiry;
    } catch (error) {
      console.error("Error updating inquiry status:", error);
      throw new Error("Failed to update inquiry status");
    }
  }

  // Get all inquiries (for admin)
  static async getAllInquiries(): Promise<Inquiry[]> {
    try {
      const result = await inquiriesDB.allDocs({ include_docs: true });
      return result.rows.map((row: any) => row.doc as Inquiry);
    } catch (error) {
      console.error("Error getting inquiries:", error);
      throw new Error("Failed to get inquiries");
    }
  }

  // Get inquiries by email
  static async getInquiriesByEmail(email: string): Promise<Inquiry[]> {
    try {
      const result = await inquiriesDB.find({
        selector: {
          email: email,
          type: "inquiry",
        },
        sort: [{ createdAt: "desc" }],
      });
      return result.docs as Inquiry[];
    } catch (error) {
      console.error("Error getting inquiries by email:", error);
      throw new Error("Failed to get inquiries");
    }
  }
}
