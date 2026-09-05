/**
 * Zero-Crash Payload Hygiene Utility
 * Recursively strips undefined keys and normalizes data before passing to Firestore.
 */
export function sanitizeFirestorePayload<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeFirestorePayload(item)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj as Record<string, any>)) {
      if (value !== undefined) {
        sanitized[key] = sanitizeFirestorePayload(value);
      }
    }
    return sanitized as T;
  }

  return obj;
}
