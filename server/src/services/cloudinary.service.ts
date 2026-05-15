import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

// Configure Cloudinary
if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

export const cloudinaryService = {
  /**
   * Uploads a base64 Data URL to Cloudinary.
   */
  async uploadFile(dataUrl: string, folder: string, roomId: string) {
    if (!env.CLOUDINARY_CLOUD_NAME) {
      throw new AppError('Cloudinary is not configured on the server.', 500);
    }

    try {
      const result = await cloudinary.uploader.upload(dataUrl, {
        folder,
        resource_type: 'raw',
        tags: [roomId],
      });

      return {
        secure_url: result.secure_url,
        public_id: result.public_id,
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new AppError('Failed to upload file to Cloudinary.', 500);
    }
  },

  /**
   * Deletes multiple files from Cloudinary by their public IDs.
   * This handles the deletion in chunks to avoid URL length limits on the API.
   */
  async deleteFilesByPublicIds(publicIds: string[]) {
    if (!env.CLOUDINARY_CLOUD_NAME || publicIds.length === 0) {
      return;
    }

    console.log(`Cloudinary: Attempting to delete ${publicIds.length} files...`);

    // Cloudinary's delete_resources API can handle up to 100 public IDs per request
    const chunkSize = 100;
    for (let i = 0; i < publicIds.length; i += chunkSize) {
      const chunk = publicIds.slice(i, i + chunkSize);
      try {
        const response = await cloudinary.api.delete_resources(chunk);
        console.log(`Cloudinary: Deleted chunk of ${chunk.length} files.`, response.deleted);
      } catch (error) {
        // We log the error but don't throw it, so room deletion can continue even if cleanup partially fails
        console.error('Cloudinary batch deletion error:', error);
      }
    }
  },
};
