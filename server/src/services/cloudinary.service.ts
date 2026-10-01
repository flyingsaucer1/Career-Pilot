import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { env } from '../config/env';

// Configure Cloudinary SDK once
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file buffer to Cloudinary.
 * @param buffer   Raw file buffer
 * @param folder   Destination folder in Cloudinary (e.g. "careerpilot/resumes")
 * @param publicId Optional public ID; auto-generated if omitted
 * @param mimeType MIME type of the file (used to set resource_type correctly)
 */
export const uploadBuffer = (
  buffer: Buffer,
  folder: string,
  publicId?: string,
  _mimeType?: string
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'raw',
        type: 'authenticated',
        use_filename: false,
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary upload failed'));
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(buffer);
  });
};

/**
 * Delete a file from Cloudinary by public ID.
 */
export type StorageDeliveryType = 'upload' | 'authenticated';

/** Convert a legacy public raw asset without changing its public ID. */
export const promoteFileToAuthenticated = async (publicId: string): Promise<string> => {
  const result = await cloudinary.uploader.rename(publicId, publicId, {
    resource_type: 'raw',
    type: 'upload',
    to_type: 'authenticated',
    overwrite: false,
    invalidate: true,
  });
  return result.secure_url as string;
};

/** A retry may find that Cloudinary changed type before MongoDB was updated. */
export const getAuthenticatedFileUrl = async (publicId: string): Promise<string | null> => {
  try {
    const resource = await cloudinary.api.resource(publicId, { resource_type: 'raw', type: 'authenticated' });
    return resource.secure_url as string;
  } catch (error) {
    if ((error as { http_code?: number }).http_code === 404) return null;
    throw error;
  }
};

export const downloadFile = async (
  publicId: string,
  format: 'pdf' | 'docx',
  deliveryType: StorageDeliveryType
): Promise<Buffer> => {
  const signedUrl = cloudinary.utils.private_download_url(publicId, format, {
    resource_type: 'raw',
    type: deliveryType,
    expires_at: Math.floor(Date.now() / 1000) + 60,
  });
  try {
    const response = await fetch(signedUrl, { signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new Error(`Cloudinary returned ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.length || bytes.length > 5 * 1024 * 1024) throw new Error('Invalid stored file size');
    return bytes;
  } catch {
    throw Object.assign(new Error('Stored file is temporarily unavailable. Please try again.'), {
      statusCode: 503, isOperational: true,
    });
  }
};

export const deleteFile = async (publicId: string, deliveryType: StorageDeliveryType = 'upload'): Promise<void> => {
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: 'raw', type: deliveryType, invalidate: true,
  });
  if (result.result !== 'ok' && result.result !== 'not found') {
    throw Object.assign(new Error('File storage deletion failed. Please try again.'), { statusCode: 503, isOperational: true });
  }
};
