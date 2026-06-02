import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

// Helper to check if S3 is configured
export function isS3Configured(): boolean {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_S3_BUCKET &&
    process.env.AWS_REGION
  );
}

// Initialize S3 Client
let s3Client: S3Client | null = null;
if (isS3Configured()) {
  console.log('📦 [S3] Initializing AWS S3 Client...');
  s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
} else {
  console.log('⚠️ [S3] AWS S3 is not configured. Falling back to local disk storage.');
}

/**
 * Uploads a file from local temp path to S3 (or returns local relative path if S3 is unconfigured)
 */
export async function uploadFile(
  localFilePath: string,
  originalName: string,
  mimeType: string,
  sessionId: string
): Promise<{ url: string; key: string }> {
  const fileExtension = path.extname(originalName);
  const fileKey = `sessions/${sessionId}/${Date.now()}_${path.basename(originalName)}`;

  if (s3Client && isS3Configured()) {
    try {
      const fileStream = fs.createReadStream(localFilePath);
      const bucketName = process.env.AWS_S3_BUCKET!;
      
      console.log(`📤 [S3] Uploading "${originalName}" to S3 bucket "${bucketName}" as key "${fileKey}"...`);
      
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: fileKey,
          Body: fileStream,
          ContentType: mimeType,
        })
      );

      const url = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
      console.log(`✅ [S3] Upload successful. S3 URL: ${url}`);
      
      return { url, key: fileKey };
    } catch (err: any) {
      console.error('❌ [S3 Upload Error]:', err.message);
      throw new Error(`S3 Upload failed: ${err.message}`);
    }
  } else {
    // Local fallback: copy file to a persistent local uploads folder
    const uploadsDir = path.join(process.cwd(), 'uploads', sessionId);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const destPath = path.join(uploadsDir, originalName);
    fs.copyFileSync(localFilePath, destPath);
    console.log(`💾 [Local Storage] File saved locally to: ${destPath}`);
    
    // Return relative URL path
    return {
      url: `/uploads/${sessionId}/${originalName}`,
      key: destPath,
    };
  }
}

/**
 * Deletes a file from S3 (or local path if S3 is unconfigured)
 */
export async function deleteFile(fileKeyOrPath: string): Promise<void> {
  if (s3Client && isS3Configured() && !fileKeyOrPath.startsWith('/uploads/') && !path.isAbsolute(fileKeyOrPath)) {
    try {
      const bucketName = process.env.AWS_S3_BUCKET!;
      console.log(`🗑️ [S3] Deleting object "${fileKeyOrPath}" from S3 bucket "${bucketName}"...`);
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: fileKeyOrPath,
        })
      );
      console.log(`✅ [S3] Deletion successful.`);
    } catch (err: any) {
      console.error('❌ [S3 Deletion Error]:', err.message);
    }
  } else {
    // Local deletion
    try {
      if (fs.existsSync(fileKeyOrPath)) {
        fs.unlinkSync(fileKeyOrPath);
        console.log(`🗑️ [Local Storage] Local file deleted: ${fileKeyOrPath}`);
      }
    } catch (err: any) {
      console.error('❌ [Local Deletion Error]:', err.message);
    }
  }
}
