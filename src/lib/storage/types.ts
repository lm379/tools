
export interface StorageService {
  getUploadUrl(key: string, contentType: string, expiresIn?: number): Promise<{ uploadUrl: string; publicUrl: string }>;
  deleteFile(key: string): Promise<void>;
  deleteFiles(keys: string[]): Promise<void>;
}
