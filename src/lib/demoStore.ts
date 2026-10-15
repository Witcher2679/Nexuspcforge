import type { StoreProduct } from '@/data/storeCatalog';

const ORDERS_KEY = 'nexus-pc-lab-demo-orders';
const REQUESTS_KEY = 'nexus-pc-lab-demo-requests';
const CART_KEY = 'nexus-pc-lab-demo-cart';
const DB_NAME = 'nexus-pc-lab-requests';
const DB_VERSION = 1;
const IMAGE_STORE = 'images';

export type DemoCartLine = { productId: string; quantity: number };

export type CustomerDetails = {
  fullName: string;
  phone: string;
  address1: string;
  address2: string;
  landmark: string;
  city: string;
  state: string;
  pinCode: string;
  email: string;
  notes: string;
};

export type SavedOrderLine = {
  productId: string;
  name: string;
  brand: string;
  model: string;
  category: string;
  specs: string;
  imageUrl?: string;
  imageAlt: string;
  unitPrice: number;
  quantity: number;
};

export type DemoOrder = {
  id: string;
  createdAt: string;
  status: 'Demo Order Placed';
  customer: CustomerDetails;
  lines: SavedOrderLine[];
  total: number;
  buildOrder: boolean;
  compatibilityNotes: string[];
};

export type SavedRequest = {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  partName: string;
  category: string;
  quantity: number;
  description: string;
  brand: string;
  model: string;
  budget: number | null;
  referenceUrl: string;
  notes: string;
  imageIds: string[];
  status: 'Demo Request Submitted';
};

function readList<T>(key: string): T[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}

function writeList<T>(key: string, value: T[]) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function readOrders() {
  try {
    return readList<DemoOrder>(ORDERS_KEY);
  } catch {
    return [];
  }
}

export function readRequests() {
  try {
    return readList<SavedRequest>(REQUESTS_KEY);
  } catch {
    return [];
  }
}

export function readCart() {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(CART_KEY) ?? '[]');
    return Array.isArray(parsed)
      ? parsed.filter((line): line is DemoCartLine => (
        line && typeof line.productId === 'string' &&
        Number.isInteger(line.quantity) && line.quantity > 0
      ))
      : [];
  } catch {
    return [];
  }
}

export function saveCart(lines: DemoCartLine[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(lines));
}

export function addCartProduct(productId: string, products: StoreProduct[]) {
  const product = products.find((item) => item.id === productId);
  if (!product || product.demoStock < 1) return readCart();
  const current = readCart();
  const found = current.find((line) => line.productId === productId);
  if (found) {
    return current.map((line) => line.productId === productId
      ? { ...line, quantity: Math.min(product.demoStock, line.quantity + 1) }
      : line);
  }
  return [...current, { productId, quantity: 1 }];
}

export function newDemoOrderId(existing: DemoOrder[]) {
  const year = new Date().getFullYear();
  const largest = existing.reduce((max, order) => {
    const match = order.id.match(new RegExp(`^NPF-DEMO-${year}-(\\d+)`));
    return Math.max(max, match ? Number(match[1]) : 0);
  }, 0);
  const sequence = String(largest + 1).padStart(3, '0');
  const suffix = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().slice(0, 8).toUpperCase()
    : `${Date.now().toString(36).toUpperCase()}`;
  return `NPF-DEMO-${year}-${sequence}-${suffix}`;
}

export function newRequestId(existing: SavedRequest[]) {
  const year = new Date().getFullYear();
  const largest = existing.reduce((max, request) => {
    const match = request.id.match(new RegExp(`^NPF-REQ-${year}-(\\d+)`));
    return Math.max(max, match ? Number(match[1]) : 0);
  }, 0);
  const sequence = String(largest + 1).padStart(3, '0');
  const suffix = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().slice(0, 8).toUpperCase()
    : `${Date.now().toString(36).toUpperCase()}`;
  return `NPF-REQ-${year}-${sequence}-${suffix}`;
}

export function makeOrder(
  lines: DemoCartLine[],
  products: StoreProduct[],
  customer: CustomerDetails,
  buildOrder: boolean,
  compatibilityNotes: string[],
): DemoOrder | null {
  if (!lines.length) return null;
  const orders = readOrders();
  const safeLines: SavedOrderLine[] = [];
  for (const line of lines) {
    const product = products.find((item) => item.id === line.productId);
    if (!product || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > product.demoStock) {
      return null;
    }
    safeLines.push({
      productId: product.id,
      name: product.name,
      brand: product.brand,
      model: product.model,
      category: product.category,
      specs: product.specs,
      imageUrl: product.imageUrl,
      imageAlt: product.imageAlt,
      unitPrice: product.price,
      quantity: line.quantity,
    });
  }
  const total = safeLines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  if (!Number.isFinite(total) || total <= 0) return null;
  return {
    id: newDemoOrderId(orders),
    createdAt: new Date().toISOString(),
    status: 'Demo Order Placed',
    customer,
    lines: safeLines,
    total,
    buildOrder,
    compatibilityNotes,
  };
}

export function saveOrder(order: DemoOrder) {
  const orders = readOrders();
  if (orders.some((saved) => saved.id === order.id)) {
    throw new Error('This demo order has already been saved.');
  }
  writeList(ORDERS_KEY, [order, ...orders]);
  saveCart([]);
}

export function saveRequest(request: SavedRequest) {
  const requests = readRequests();
  if (requests.some((saved) => saved.id === request.id)) {
    throw new Error('This demo request has already been saved.');
  }
  writeList(REQUESTS_KEY, [request, ...requests]);
}

export function deleteRequest(id: string) {
  writeList(REQUESTS_KEY, readRequests().filter((request) => request.id !== id));
}

export function clearOrders() {
  localStorage.removeItem(ORDERS_KEY);
}

export function getImageDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('This browser does not support local image storage.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IMAGE_STORE)) {
        db.createObjectStore(IMAGE_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open image storage.'));
  });
}

export async function saveRequestImage(file: File) {
  const db = await getImageDatabase();
  const id = crypto.randomUUID();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(IMAGE_STORE, 'readwrite');
    transaction.objectStore(IMAGE_STORE).put(file, id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not save this image.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Image save was cancelled.'));
  });
  db.close();
  return id;
}

export async function readRequestImage(id: string) {
  const db = await getImageDatabase();
  const file = await new Promise<Blob | null>((resolve, reject) => {
    const request = db.transaction(IMAGE_STORE, 'readonly').objectStore(IMAGE_STORE).get(id);
    request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : null);
    request.onerror = () => reject(request.error ?? new Error('Could not read this image.'));
  });
  db.close();
  return file;
}

export async function deleteRequestImages(ids: string[]) {
  if (!ids.length || !('indexedDB' in window)) return;
  const db = await getImageDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(IMAGE_STORE, 'readwrite');
    const store = transaction.objectStore(IMAGE_STORE);
    ids.forEach((id) => store.delete(id));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not delete stored images.'));
  });
  db.close();
}

export function validateCustomer(customer: CustomerDetails) {
  const errors: Partial<Record<keyof CustomerDetails, string>> = {};
  if (!customer.fullName.trim()) errors.fullName = 'Enter your full name.';
  if (!/^(?:\+91[\s-]?)?[6-9]\d{9}$/.test(customer.phone.replace(/[()\s-]/g, ''))) {
    errors.phone = 'Enter a valid 10-digit Indian mobile number.';
  }
  if (!customer.address1.trim()) errors.address1 = 'Enter your address line 1.';
  if (!customer.city.trim()) errors.city = 'Enter your city.';
  if (!customer.state.trim()) errors.state = 'Enter your state.';
  if (!/^\d{6}$/.test(customer.pinCode.trim())) errors.pinCode = 'Enter a valid 6-digit PIN code.';
  if (customer.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }
  return errors;
}
