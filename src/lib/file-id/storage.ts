import { parseFileId } from "./index";

/**
 * Before the storage fix, media handlers stored the parser's numeric Telegram
 * file identifier instead of the opaque file_id accepted by Bot API methods.
 * Keep recognizing those values for voting/removal, but never send them to Telegram.
 */
export function isLegacyMediaId(value: string): boolean {
  return /^\d+$/.test(value);
}

export function getSendableMediaIds(values: readonly string[]): string[] {
  return values.filter((value) => value.length > 0 && !isLegacyMediaId(value));
}

export function getLegacyMediaId(fileId: string): string | null {
  try {
    return parseFileId(fileId).id.toString();
  } catch {
    return null;
  }
}

export function matchesStoredMediaId(storedId: string, fileId: string, legacyId: string | null): boolean {
  return storedId === fileId || (legacyId !== null && isLegacyMediaId(storedId) && storedId === legacyId);
}
