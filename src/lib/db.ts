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

// Remote databases for sync
export const remoteUsersDB = new PouchDB(`${COUCHDB_URL}/users`);
export const remoteSessionsDB = new PouchDB(`${COUCHDB_URL}/sessions`);

// Setup sync
export function setupSync() {
  // Sync users database
  usersDB
    .sync(remoteUsersDB, {
      live: true,
      retry: true,
    })
    .on("change", (info) => {
      console.log("Users DB sync change:", info);
    })
    .on("error", (err) => {
      console.error("Users DB sync error:", err);
    });

  // Sync sessions database
  sessionsDB
    .sync(remoteSessionsDB, {
      live: true,
      retry: true,
    })
    .on("change", (info) => {
      console.log("Sessions DB sync change:", info);
    })
    .on("error", (err) => {
      console.error("Sessions DB sync error:", err);
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
