import { openDB, DBSchema, IDBPDatabase } from "idb";

interface ChatMessage {
  id: string;
  text: string;
  url?: string;
  type: "text" | "image" | "video";
  alt?: string;
  timestamp: number;
  userId?: string;
  userName?: string;
}

interface ChatDB extends DBSchema {
  messages: {
    key: string;
    value: ChatMessage;
    indexes: { "by-timestamp": number };
  };
}

const DB_NAME = "chravelChatDB";
const STORE_NAME = "messages";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<ChatDB>> | null = null;

export async function getDB(): Promise<IDBPDatabase<ChatDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ChatDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          store.createIndex("by-timestamp", "timestamp");
        }
      },
    });
  }
  return dbPromise;
}

export async function saveMessages(messages: ChatMessage[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  await Promise.all(messages.map((msg) => tx.store.put(msg)));
  await tx.done;
}

export async function saveMessage(message: ChatMessage): Promise<void> {
  const db = await getDB();
  await db.put(STORE_NAME, message);
}

export async function loadMessages(): Promise<ChatMessage[]> {
  try {
    const db = await getDB();
    const messages = await db.getAllFromIndex(STORE_NAME, "by-timestamp");
    return messages || [];
  } catch (error) {
    console.error("Error loading messages from IndexedDB:", error);
    return [];
  }
}

export async function clearMessages(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  await tx.store.clear();
  await tx.done;
}

export async function deleteMessage(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

export type { ChatMessage };
