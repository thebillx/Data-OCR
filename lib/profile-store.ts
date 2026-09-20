import type { CardData } from "./card-data";

const DB_NAME = "mock-card-studio";
const DB_VERSION = 1;
const PROFILE_STORE = "profiles";

export const PROFILE_SCHEMA_VERSION = 1 as const;

export type ProfileCrop = { zoom: number; x: number; y: number };

export type SavedProfile = {
  id: string;
  name: string;
  schemaVersion: typeof PROFILE_SCHEMA_VERSION;
  data: CardData;
  photo: Blob | null;
  photoName: string;
  photoKey: string | null;
  crop: ProfileCrop;
  createdAt: string;
  updatedAt: string;
};

export type SaveProfileInput = {
  id?: string;
  name: string;
  data: CardData;
  photo: Blob | null;
  photoName: string;
  photoKey: string | null;
  crop: ProfileCrop;
};

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed"));
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
  });
}

function openProfilesDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PROFILE_STORE)) {
        const store = db.createObjectStore(PROFILE_STORE, { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("เปิดพื้นที่เก็บ Profile ไม่สำเร็จ"));
  });
}

function cloneDate(value: CardData["birth"]) {
  return { day: value.day, month: value.month, year: value.year };
}

export function cloneCardData(data: CardData): CardData {
  return {
    ...data,
    birth: cloneDate(data.birth),
    issue: cloneDate(data.issue),
    expiry: cloneDate(data.expiry),
  };
}

export function profileFingerprint(
  data: CardData,
  crop: ProfileCrop,
  photoKey: string | null,
): string {
  return JSON.stringify({ data, crop, photoKey });
}

function validCrop(value: unknown): value is ProfileCrop {
  if (typeof value !== "object" || value === null) return false;
  const crop = value as Partial<ProfileCrop>;
  return [crop.zoom, crop.x, crop.y].every((part) => typeof part === "number" && Number.isFinite(part));
}

function validCardData(value: unknown): value is CardData {
  if (typeof value !== "object" || value === null) return false;
  const data = value as Partial<CardData>;
  const textKeys = ["idNumber", "firstTh", "middleTh", "lastTh", "firstEn", "middleEn", "lastEn", "address", "issuer", "issuerCode"] as const;
  if (!textKeys.every((key) => typeof data[key] === "string")) return false;
  if (data.title !== null && !["mr", "mrs", "miss", "boy", "girl"].includes(String(data.title))) return false;
  if (data.expiryMode !== "date" && data.expiryMode !== "lifetime") return false;
  for (const key of ["birth", "issue", "expiry"] as const) {
    const date = data[key];
    if (typeof date !== "object" || date === null) return false;
    if (typeof date.day !== "string" || typeof date.month !== "string" || typeof date.year !== "string") return false;
  }
  return true;
}

export function normalizeProfile(value: unknown): SavedProfile | null {
  if (typeof value !== "object" || value === null) return null;
  const profile = value as Partial<SavedProfile>;
  if (profile.schemaVersion !== PROFILE_SCHEMA_VERSION) return null;
  if (typeof profile.id !== "string" || !profile.id) return null;
  if (typeof profile.name !== "string" || !profile.name.trim()) return null;
  if (!validCardData(profile.data) || !validCrop(profile.crop)) return null;
  if (profile.photo !== null && !(profile.photo instanceof Blob)) return null;
  if (typeof profile.photoName !== "string") return null;
  if (profile.photoKey !== null && typeof profile.photoKey !== "string") return null;
  if (typeof profile.createdAt !== "string" || typeof profile.updatedAt !== "string") return null;
  return {
    ...profile,
    name: profile.name.trim(),
    data: cloneCardData(profile.data),
    crop: { ...profile.crop },
  } as SavedProfile;
}

export async function listProfiles(): Promise<SavedProfile[]> {
  const db = await openProfilesDb();
  try {
    const transaction = db.transaction(PROFILE_STORE, "readonly");
    const records = await requestResult(transaction.objectStore(PROFILE_STORE).getAll());
    await transactionDone(transaction);
    return records
      .map(normalizeProfile)
      .filter((profile): profile is SavedProfile => profile !== null)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } finally {
    db.close();
  }
}

export async function getProfile(id: string): Promise<SavedProfile | null> {
  const db = await openProfilesDb();
  try {
    const transaction = db.transaction(PROFILE_STORE, "readonly");
    const value = await requestResult(transaction.objectStore(PROFILE_STORE).get(id));
    await transactionDone(transaction);
    return normalizeProfile(value);
  } finally {
    db.close();
  }
}

export async function saveProfile(input: SaveProfileInput): Promise<SavedProfile> {
  const name = input.name.trim();
  if (!name) throw new Error("กรุณาตั้งชื่อ Profile");

  const previous = input.id ? await getProfile(input.id) : null;
  const now = new Date().toISOString();
  const profile: SavedProfile = {
    id: input.id ?? crypto.randomUUID(),
    name,
    schemaVersion: PROFILE_SCHEMA_VERSION,
    data: cloneCardData(input.data),
    photo: input.photo,
    photoName: input.photoName,
    photoKey: input.photoKey,
    crop: { ...input.crop },
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
  };

  const db = await openProfilesDb();
  try {
    const transaction = db.transaction(PROFILE_STORE, "readwrite");
    transaction.objectStore(PROFILE_STORE).put(profile);
    await transactionDone(transaction);
  } finally {
    db.close();
  }
  return profile;
}

export async function deleteProfile(id: string): Promise<void> {
  const db = await openProfilesDb();
  try {
    const transaction = db.transaction(PROFILE_STORE, "readwrite");
    transaction.objectStore(PROFILE_STORE).delete(id);
    await transactionDone(transaction);
  } finally {
    db.close();
  }
}

export async function requestPersistentStorage(): Promise<boolean | null> {
  if (!navigator.storage?.persist) return null;
  try {
    return await navigator.storage.persist();
  } catch {
    return null;
  }
}
