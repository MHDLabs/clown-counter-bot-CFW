export class BinaryReader {
  private pos = 0;

  constructor(private readonly buffer: Uint8Array) {}

  read(bytes: number): Uint8Array {
    const part = this.buffer.subarray(this.pos, this.pos + bytes);
    this.pos += bytes;
    return part;
  }

  skip(bytes: number): void {
    this.pos += bytes;
  }

  readUInt32LE(): number {
    return this.view().getUint32(this.advance(4), true);
  }

  readInt32LE(): number {
    return this.view().getInt32(this.advance(4), true);
  }

  readBigInt64LE(): bigint {
    return this.view().getBigInt64(this.advance(8), true);
  }

  private advance(n: number): number {
    const p = this.pos;
    this.pos += n;
    return p;
  }

  private view(): DataView {
    return new DataView(this.buffer.buffer, this.buffer.byteOffset, this.buffer.byteLength);
  }
}
