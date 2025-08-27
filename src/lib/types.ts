export type FileKind = 'text' | 'image' | 'video';

export interface FileRecord {
  id: string;
  kind: FileKind;
  title: string;
  path: string;
  url: string;
  size: number;
  mime: string;
  checksum?: string;
  meta?: Record<string, any>;
  createdAt: string;
  createdBy?: string | null;
}

export interface DBAdapter {
  init(): Promise<void>;
  createFile(rec: Omit<FileRecord, 'id' | 'createdAt'>): Promise<FileRecord>;
  listFiles(kind?: FileKind, limit?: number): Promise<FileRecord[]>;
  deleteFile(id: string): Promise<void>;
}

export interface StorageAdapter {
  saveObject(key: string, data: ArrayBuffer | Uint8Array, contentType: string): Promise<{ key: string; url: string }>;
  saveText(key: string, text: string, contentType?: string): Promise<{ key: string; url: string }>;
  publicUrl(key: string): string;
  deleteObject(key: string): Promise<void>;
}
