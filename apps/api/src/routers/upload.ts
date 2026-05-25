import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from '../trpc.js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getServerEnv } from '@repo/config';

// ============================================================
// Upload Router — MinIO presigned URLs
// ============================================================

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (s3Client) return s3Client;

  const env = getServerEnv();
  s3Client = new S3Client({
    endpoint: `${env.MINIO_USE_SSL ? 'https' : 'http'}://${env.MINIO_ENDPOINT}`,
    region: 'us-east-1',
    credentials: {
      accessKeyId: env.MINIO_ACCESS_KEY,
      secretAccessKey: env.MINIO_SECRET_KEY,
    },
    forcePathStyle: true,
  });

  return s3Client;
}

export const uploadRouter = router({
  // Get presigned URL for direct upload to MinIO
  getPresignedUrl: protectedProcedure
    .input(
      z.object({
        filename: z.string().min(1).max(255),
        contentType: z.enum(ALLOWED_TYPES),
        fileSize: z.number().int().positive().max(MAX_FILE_SIZE),
        folder: z.enum(['restaurants', 'food-items', 'avatars']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const env = getServerEnv();
      const client = getS3Client();

      // Generate unique key
      const ext = input.filename.split('.').pop() ?? 'jpg';
      const key = `${input.folder}/${ctx.user.id}/${Date.now()}.${ext}`;

      const command = new PutObjectCommand({
        Bucket: env.MINIO_BUCKET,
        Key: key,
        ContentType: input.contentType,
        ContentLength: input.fileSize,
        Metadata: {
          'uploaded-by': ctx.user.id,
        },
      });

      const presignedUrl = await getSignedUrl(client, command, {
        expiresIn: 3600, // 1 hour
      });

      const publicUrl = `${env.MINIO_USE_SSL ? 'https' : 'http'}://${env.MINIO_ENDPOINT}/${env.MINIO_BUCKET}/${key}`;

      return {
        presignedUrl,
        publicUrl,
        key,
      };
    }),
});
