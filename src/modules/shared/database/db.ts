// PouchDB is loaded from CDN in index.html
// Access it from the global window object
declare global {
  interface Window {
    PouchDB: any;
  }
}

// Get PouchDB from global scope
const PouchDB = window.PouchDB;

// CouchDB configuration from environment or fallback
const COUCHDB_URL = import.meta.env.VITE_COUCHDB_URL || "http://127.0.0.1:5984";

// Database instances
export const usersDB = new PouchDB("users");
export const sessionsDB = new PouchDB("sessions");
export const inquiriesDB = new PouchDB("inquiries");
export const companiesDB = new PouchDB("companies");
export const userCompaniesDB = new PouchDB("user_companies");
export const orgchartsDB = new PouchDB("orgcharts");
export const chartOfAccountsDB = new PouchDB("chartofaccounts");

// Remote databases for sync
export const remoteUsersDB = new PouchDB(`${COUCHDB_URL}/users`);
export const remoteSessionsDB = new PouchDB(`${COUCHDB_URL}/sessions`);
export const remoteInquiriesDB = new PouchDB(`${COUCHDB_URL}/inquiries`);
export const remoteCompaniesDB = new PouchDB(`${COUCHDB_URL}/companies`);
export const remoteUserCompaniesDB = new PouchDB(`${COUCHDB_URL}/user_companies`);
export const remoteOrgchartsDB = new PouchDB(`${COUCHDB_URL}/orgcharts`);
export const remoteChartOfAccountsDB = new PouchDB(`${COUCHDB_URL}/chartofaccounts`);

// Setup sync
export function setupSync() {
  // Sync users database
  usersDB
    .sync(remoteUsersDB, {
      live: true,
      retry: true,
    })
    .on("change", (info: any) => {
      console.log("Users DB sync change:", info);
    })
    .on("error", (err: any) => {
      console.error("Users DB sync error:", err);
    });

  // Sync sessions database
  sessionsDB
    .sync(remoteSessionsDB, {
      live: true,
      retry: true,
    })
    .on("change", (info: any) => {
      console.log("Sessions DB sync change:", info);
    })
    .on("error", (err: any) => {
      console.error("Sessions DB sync error:", err);
    });

  // Sync inquiries database
  inquiriesDB
    .sync(remoteInquiriesDB, {
      live: true,
      retry: true,
    })
    .on("change", (info: any) => {
      console.log("Inquiries DB sync change:", info);
    })
    .on("error", (err: any) => {
      console.error("Inquiries DB sync error:", err);
    });

  // Sync companies database
  companiesDB
    .sync(remoteCompaniesDB, {
      live: true,
      retry: true,
    })
    .on("change", (info: any) => {
      console.log("Companies DB sync change:", info);
    })
    .on("error", (err: any) => {
      console.error("Companies DB sync error:", err);
    });

  // Sync user_companies database
  userCompaniesDB
    .sync(remoteUserCompaniesDB, {
      live: true,
      retry: true,
    })
    .on("change", (info: any) => {
      console.log("User Companies DB sync change:", info);
    })
    .on("error", (err: any) => {
      console.error("User Companies DB sync error:", err);
    });

  // Sync orgcharts database (partitioned)
  orgchartsDB
    .sync(remoteOrgchartsDB, {
      live: true,
      retry: true,
    })
    .on("change", (info: any) => {
      console.log("Orgcharts DB sync change:", info);
    })
    .on("error", (err: any) => {
      console.error("Orgcharts DB sync error:", err);
    });

  // Sync chartofaccounts database (partitioned)
  chartOfAccountsDB
    .sync(remoteChartOfAccountsDB, {
      live: true,
      retry: true,
    })
    .on("change", (info: any) => {
      console.log("Chart of Accounts DB sync change:", info);
    })
    .on("error", (err: any) => {
      console.error("Chart of Accounts DB sync error:", err);
    });
}

// Initialize databases with indexes
export async function initializeDatabases() {
  try {
    // Create indexes for users
    await usersDB.createIndex({
      index: { fields: ["email"] },
    });

    await usersDB.createIndex({
      index: { fields: ["type"] },
    });

    // Create indexes for sessions
    await sessionsDB.createIndex({
      index: { fields: ["userId"] },
    });

    await sessionsDB.createIndex({
      index: { fields: ["expiresAt"] },
    });

    // Create indexes for inquiries
    await inquiriesDB.createIndex({
      index: { fields: ["email"] },
    });

    await inquiriesDB.createIndex({
      index: { fields: ["status"] },
    });

    await inquiriesDB.createIndex({
      index: { fields: ["createdAt"] },
    });

    // Create indexes for companies
    await companiesDB.createIndex({
      index: { fields: ["type"] },
    });

    await companiesDB.createIndex({
      index: { fields: ["createdAt"] },
    });

    // Create indexes for user_companies
    await userCompaniesDB.createIndex({
      index: { fields: ["userId"] },
    });

    await userCompaniesDB.createIndex({
      index: { fields: ["companyId"] },
    });

    await userCompaniesDB.createIndex({
      index: { fields: ["userId", "companyId"] },
    });

    console.log("Databases initialized successfully");
  } catch (error) {
    console.error("Error initializing databases:", error);
  }
}

// Types
export interface User {
  _id: string;
  _rev?: string;
  type: "user";
  email: string;
  password: string; // hashed
  fullname: string;
  verified: boolean;
  verificationCode?: string;
  resetToken?: string;
  resetTokenExpiry?: number;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  createdAt: number;
  updatedAt: number;
  profile?: {
    avatar?: string;
    dob?: string;
    gender?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}

export interface Session {
  _id: string;
  _rev?: string;
  type: "session";
  userId: string;
  token: string;
  expiresAt: number;
  createdAt: number;
}

export interface Inquiry {
  _id: string;
  _rev?: string;
  type: "inquiry";
  name: string;
  email: string;
  company?: string;
  phone?: string;
  message: string;
  attachments?: Array<{
    name: string;
    type: string;
    size: number;
    data: string; // base64
  }>;
  status: "pending" | "in-progress" | "resolved" | "closed";
  response?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Company {
  _id: string;
  _rev?: string;
  type: "workspace" | "supplier" | "customer";
  title: string;
  logo?: string;
  website?: string;
  businessId?: string;
  taxId?: string;
  residence: string;
  industry: string;
  contact?: {
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  settings?: {
    country: string;
    currency: string;
    timezone: string;
    language: string;
    twoFactorRequired: boolean;
    twoFactorDeadline: string | null;
    passwordChangeDays: number;
  };
  createdAt: number;
  updatedAt: number;
}

export interface UserCompany {
  _id: string;
  _rev?: string;
  type: "user_company";
  userId: string;
  companyId: string;
  role: "owner" | "admin" | "member";
  createdAt: number;
}

export interface OrgChart {
  _id: string; // Format: company:{companyId}:orgchart_{version}
  _rev?: string;
  type: "orgchart";
  companyId: string;
  version: number;
  name: string;
  data: any; // Структура оргчарта
  createdAt: number;
  updatedAt: number;
}

export interface ChartOfAccounts {
  _id: string; // Format: company:{companyId}:account_{accountCode}
  _rev?: string;
  type: "account";
  companyId: string;
  accountCode: string;
  accountName: string;
  accountType: "asset" | "liability" | "equity" | "revenue" | "expense";
  parentAccount?: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}
