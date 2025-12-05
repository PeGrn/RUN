import * as Minio from 'minio';
import { nanoid } from 'nanoid';

// Client S3 lazy-initialized
let s3ClientInstance: Minio.Client | null = null;

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'run-project';

function getS3Client(): Minio.Client {
  if (!s3ClientInstance) {
    if (!process.env.S3_ENDPOINT) {
      throw new Error('S3_ENDPOINT non configuré dans les variables d\'environnement');
    }
    if (!process.env.S3_ACCESS_KEY) {
      throw new Error('S3_ACCESS_KEY non configuré dans les variables d\'environnement');
    }
    if (!process.env.S3_SECRET_KEY) {
      throw new Error('S3_SECRET_KEY non configuré dans les variables d\'environnement');
    }


    s3ClientInstance = new Minio.Client({
      endPoint: process.env.S3_ENDPOINT,
      port: process.env.S3_PORT ? Number(process.env.S3_PORT) : undefined,
      useSSL: process.env.S3_USE_SSL === 'true',
      accessKey: process.env.S3_ACCESS_KEY,
      secretKey: process.env.S3_SECRET_KEY,
      region: process.env.S3_REGION || 'us-east-1',
    });
  }
  return s3ClientInstance;
}

/**
 * Crée le bucket s'il n'existe pas (évite l'erreur 404/NoSuchBucket)
 */
async function ensureBucketExists(): Promise<void> {
  const client = getS3Client();
  try {
    const exists = await client.bucketExists(BUCKET_NAME);
    if (!exists) {
      await client.makeBucket(BUCKET_NAME, process.env.S3_REGION || 'us-east-1');
    }
  } catch (error: any) {
    // Le bucket existe probablement déjà, on continue
  }
}

/**
 * Upload un fichier vers MinIO
 */
export async function uploadToS3(
  file: Buffer,
  originalName: string,
  contentType: string = 'application/octet-stream'
) {
  try {
    await ensureBucketExists();

    const client = getS3Client();

    const safeName = (typeof originalName === 'string' && originalName.trim() !== '')
        ? originalName
        : 'file.bin';

    const cleanFileName = safeName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\-_.]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '');

    const uniqueId = nanoid(8);
    const key = `training-sessions/${uniqueId}-${cleanFileName}`;

    const metadata = {
      'Content-Type': contentType || 'application/octet-stream',
      'x-amz-meta-original-name': originalName
    };

    await client.putObject(
      BUCKET_NAME,
      key,
      file,
      file.length,
      metadata
    );

    return {
      success: true,
      key,
      url: '' // Pas d'URL publique pour un bucket privé
    };

  } catch (error: any) {
    console.error('Erreur upload MinIO:', error.message || error);
    throw new Error(`Upload failed: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Génère une URL temporaire pour télécharger un fichier (privé)
 * @param key - Clé du fichier dans le bucket
 * @param expiresIn - Durée de validité en secondes (défaut: 1 heure)
 */
export async function getSignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
  try {
    const client = getS3Client();
    return await client.presignedGetObject(BUCKET_NAME, key, expiresIn);
  } catch (error) {
    console.error('Erreur génération URL signée:', error);
    throw error;
  }
}

/**
 * Récupère le contenu d'un fichier (Buffer)
 */
export async function getS3Object(key: string): Promise<Buffer | null> {
  try {
    const client = getS3Client();
    const stream = await client.getObject(BUCKET_NAME, key);

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', (err) => reject(err));
    });
  } catch (error) {
    console.error('Erreur lecture fichier S3:', error);
    return null;
  }
}