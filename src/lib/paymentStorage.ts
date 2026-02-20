import { openDB, DBSchema, IDBPDatabase } from "idb";

export interface TripPayment {
  id: string;
  trip_id: string;
  user_id?: string | null;
  amount: number;
  currency: string;
  description?: string | null;
  payer_name?: string | null;
  created_at: string;
  updated_at: string;
}

interface PaymentDB extends DBSchema {
  payments: {
    key: string;
    value: TripPayment;
  };
}

const DB_NAME = "chravelPaymentDB";
const STORE_NAME = "payments";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<PaymentDB>> | null = null;

export async function getPaymentDB(): Promise<IDBPDatabase<PaymentDB>> {
  if (!dbPromise) {
    dbPromise = openDB<PaymentDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

export async function savePaymentLocal(payment: TripPayment): Promise<void> {
  const db = await getPaymentDB();
  await db.put(STORE_NAME, payment);
}

export async function loadPaymentsLocal(tripId: string): Promise<TripPayment[]> {
  try {
    const db = await getPaymentDB();
    const all = await db.getAll(STORE_NAME);
    const filtered = all
      .filter((p) => p.trip_id === tripId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return filtered;
  } catch (error) {
    console.error("Error loading payments from IndexedDB:", error);
    return [];
  }
}

export async function deletePaymentLocal(id: string): Promise<void> {
  const db = await getPaymentDB();
  await db.delete(STORE_NAME, id);
}

export async function clearPaymentsLocal(tripId: string): Promise<void> {
  const db = await getPaymentDB();
  const payments = await loadPaymentsLocal(tripId);
  const tx = db.transaction(STORE_NAME, "readwrite");
  await Promise.all(payments.map((p) => tx.store.delete(p.id)));
  await tx.done;
}
