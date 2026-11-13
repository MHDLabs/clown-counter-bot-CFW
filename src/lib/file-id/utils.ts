import type { BinaryReader } from "@/lib/file-id/binary-reader";

export function posMod(a: number, b: number): number {
  const rest = a % b;
  return rest < 0 ? rest + Math.abs(b) : rest;
}

export function base64urlDecode(input: string): Uint8Array {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

export function rleDecode(binary: Uint8Array): Uint8Array {
  const output: number[] = [];
  let last: number | null = null;

  for (const cur of binary) {
    if (last === 0) {
      for (let i = 0; i < cur; i++) output.push(0);
      last = null;
    } else {
      if (last !== null) output.push(last);
      last = cur;
    }
  }

  if (last !== null) output.push(last);
  return Uint8Array.from(output);
}

export function unpackTlString(reader: BinaryReader): Uint8Array {
  const length = reader.read(1)[0]!;
  if (length > 254) throw new Error("length too big for a single field");
  let str: Uint8Array;
  let fill: number;

  if (length === 254) {
    const bytes = reader.read(3);
    const length3 = bytes[0]! + bytes[1]! * 256 + bytes[2]! * 65536;
    fill = posMod(-length3, 4);
    str = reader.read(length3);
  } else {
    fill = posMod(-(length + 1), 4);
    str = reader.read(length);
  }

  reader.skip(fill);
  return str;
}

export function unpackNullTerminatedString(input: Uint8Array): Uint8Array {
  const end = input.indexOf(0);
  return input.subarray(0, end < 0 ? input.length : end);
}

export function parseVersion(decoded: Uint8Array): { data: Uint8Array; version: number; subVersion: number } {
  const version = decoded.at(-1) ?? 0;
  let data = decoded.subarray(0, decoded.length - 1);
  let subVersion = 0;

  if (version === 4) {
    subVersion = data.at(-1) ?? 0;
    data = data.subarray(0, data.length - 1);
  }

  return { data, version, subVersion };
}
