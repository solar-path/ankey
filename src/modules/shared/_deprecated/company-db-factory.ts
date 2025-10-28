/**
 * Company Database Factory
 *
 * Provides dynamic connection to company-specific partitioned databases
 * Manages database lifecycle: connect, disconnect, query
 */

import { orgchartsDB, chartOfAccountsDB } from "./db";
import type { OrgChart, ChartOfAccounts } from "./db";

/**
 * Active sync handlers for company databases
 * Used to cancel sync when switching companies
 */
interface CompanySyncHandlers {
  orgcharts?: any;
  chartofaccounts?: any;
}

let activeSyncHandlers: CompanySyncHandlers = {};
let currentCompanyId: string | null = null;

/**
 * Company Database Factory
 */
export class CompanyDatabaseFactory {
  /**
   * Connect to company databases
   * Sets up local databases with filtered sync for specific company partition
   */
  static async connectToCompany(companyId: string): Promise<void> {
    // If already connected to this company, do nothing
    if (currentCompanyId === companyId) {
      console.log(`Already connected to company: ${companyId}`);
      return;
    }

    // Disconnect from previous company databases
    if (currentCompanyId) {
      await this.disconnectFromCompany();
    }

    console.log(`Connecting to company databases: ${companyId}`);
    currentCompanyId = companyId;

    // Note: For partitioned databases in PouchDB/CouchDB 3.x,
    // we use the same database instances but filter queries by partition key
    // The partition key format is: company:{companyId}

    // No additional setup needed - we'll use the existing global database instances
    // and filter all queries by partition key
  }

  /**
   * Disconnect from current company databases
   * Cancels all active sync operations
   */
  static async disconnectFromCompany(): Promise<void> {
    if (!currentCompanyId) {
      return;
    }

    console.log(`Disconnecting from company databases: ${currentCompanyId}`);

    // Cancel all active sync handlers
    if (activeSyncHandlers.orgcharts) {
      activeSyncHandlers.orgcharts.cancel();
    }
    if (activeSyncHandlers.chartofaccounts) {
      activeSyncHandlers.chartofaccounts.cancel();
    }

    activeSyncHandlers = {};
    currentCompanyId = null;
  }

  /**
   * Get current company ID
   */
  static getCurrentCompanyId(): string | null {
    return currentCompanyId;
  }

  /**
   * Query orgcharts for current company
   */
  static async getOrgCharts(): Promise<OrgChart[]> {
    if (!currentCompanyId) {
      throw new Error("No company connected");
    }

    const result = await orgchartsDB.find({
      selector: {
        _id: {
          $gte: `company:${currentCompanyId}:`,
          $lte: `company:${currentCompanyId}:\ufff0`,
        },
        type: "orgchart",
      },
    });

    return result.docs as OrgChart[];
  }

  /**
   * Get specific orgchart version
   */
  static async getOrgChart(version: number): Promise<OrgChart | null> {
    if (!currentCompanyId) {
      throw new Error("No company connected");
    }

    try {
      const doc = await orgchartsDB.get(
        `company:${currentCompanyId}:orgchart_v${version}`
      );
      return doc as OrgChart;
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Create new orgchart version
   */
  static async createOrgChart(
    name: string,
    data: any,
    version: number
  ): Promise<OrgChart> {
    if (!currentCompanyId) {
      throw new Error("No company connected");
    }

    const now = Date.now();
    const orgchart: OrgChart = {
      _id: `company:${currentCompanyId}:orgchart_v${version}`,
      type: "orgchart",
      companyId: currentCompanyId,
      version,
      name,
      data,
      createdAt: now,
      updatedAt: now,
    };

    const result = await orgchartsDB.put(orgchart);
    orgchart._rev = result.rev;

    return orgchart;
  }

  /**
   * Update orgchart
   */
  static async updateOrgChart(
    version: number,
    updates: Partial<OrgChart>
  ): Promise<OrgChart> {
    if (!currentCompanyId) {
      throw new Error("No company connected");
    }

    const orgchart = await this.getOrgChart(version);
    if (!orgchart) {
      throw new Error(`Orgchart version ${version} not found`);
    }

    const updatedOrgchart: OrgChart = {
      ...orgchart,
      ...updates,
      _id: orgchart._id,
      _rev: orgchart._rev,
      companyId: currentCompanyId,
      version,
      updatedAt: Date.now(),
    };

    const result = await orgchartsDB.put(updatedOrgchart);
    updatedOrgchart._rev = result.rev;

    return updatedOrgchart;
  }

  /**
   * Delete orgchart version
   */
  static async deleteOrgChart(version: number): Promise<void> {
    if (!currentCompanyId) {
      throw new Error("No company connected");
    }

    const orgchart = await this.getOrgChart(version);
    if (!orgchart) {
      throw new Error(`Orgchart version ${version} not found`);
    }

    await orgchartsDB.remove(orgchart._id, orgchart._rev!);
  }

  /**
   * Query chart of accounts for current company
   */
  static async getChartOfAccounts(): Promise<ChartOfAccounts[]> {
    if (!currentCompanyId) {
      throw new Error("No company connected");
    }

    const result = await chartOfAccountsDB.find({
      selector: {
        _id: {
          $gte: `company:${currentCompanyId}:`,
          $lte: `company:${currentCompanyId}:\ufff0`,
        },
        type: "account",
      },
    });

    return result.docs as ChartOfAccounts[];
  }

  /**
   * Get specific account by code
   */
  static async getAccount(accountCode: string): Promise<ChartOfAccounts | null> {
    if (!currentCompanyId) {
      throw new Error("No company connected");
    }

    try {
      const doc = await chartOfAccountsDB.get(
        `company:${currentCompanyId}:account_${accountCode}`
      );
      return doc as ChartOfAccounts;
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Create new account
   */
  static async createAccount(
    accountCode: string,
    accountName: string,
    accountType: "asset" | "liability" | "equity" | "revenue" | "expense",
    parentAccount?: string
  ): Promise<ChartOfAccounts> {
    if (!currentCompanyId) {
      throw new Error("No company connected");
    }

    const now = Date.now();
    const account: ChartOfAccounts = {
      _id: `company:${currentCompanyId}:account_${accountCode}`,
      type: "account",
      companyId: currentCompanyId,
      accountCode,
      accountName,
      accountType,
      parentAccount,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    const result = await chartOfAccountsDB.put(account);
    account._rev = result.rev;

    return account;
  }

  /**
   * Update account
   */
  static async updateAccount(
    accountCode: string,
    updates: Partial<ChartOfAccounts>
  ): Promise<ChartOfAccounts> {
    if (!currentCompanyId) {
      throw new Error("No company connected");
    }

    const account = await this.getAccount(accountCode);
    if (!account) {
      throw new Error(`Account ${accountCode} not found`);
    }

    const updatedAccount: ChartOfAccounts = {
      ...account,
      ...updates,
      _id: account._id,
      _rev: account._rev,
      companyId: currentCompanyId,
      accountCode,
      updatedAt: Date.now(),
    };

    const result = await chartOfAccountsDB.put(updatedAccount);
    updatedAccount._rev = result.rev;

    return updatedAccount;
  }

  /**
   * Delete account (soft delete - mark as inactive)
   */
  static async deleteAccount(accountCode: string): Promise<void> {
    if (!currentCompanyId) {
      throw new Error("No company connected");
    }

    await this.updateAccount(accountCode, { isActive: false });
  }
}

export default CompanyDatabaseFactory;
