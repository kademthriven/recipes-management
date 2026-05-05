const {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} = require('@aws-sdk/client-s3');
const fs = require('fs/promises');
const path = require('path');

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    : undefined,
});

const getBucketName = () => {
  const value = process.env.AWS_S3_BUCKET;

  if (!value) return '';

  if (value.startsWith('s3://')) {
    return value.replace('s3://', '').split('/')[0];
  }

  if (value.startsWith('http://') || value.startsWith('https://')) {
    const host = new URL(value).hostname;
    return host.split('.s3')[0];
  }

  return value;
};

const hasS3Config = () => (
  process.env.AWS_ACCESS_KEY_ID
  && process.env.AWS_SECRET_ACCESS_KEY
  && getBucketName()
  && !process.env.AWS_ACCESS_KEY_ID.startsWith('your_')
  && !process.env.AWS_SECRET_ACCESS_KEY.startsWith('your_')
);

const uploadLocally = async (file, folder) => {
  const uploadDir = path.join(__dirname, '..', '..', 'uploads', folder);
  const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '-');
  const fileName = `${Date.now()}-${safeName}`;

  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, fileName), file.buffer);

  return `/uploads/${folder}/${fileName}`;
};

const encodeS3Key = key => key.split('/').map(part => encodeURIComponent(part)).join('/');

const getS3ProxyUrl = key => `/api/files/s3/${encodeS3Key(key)}`;

const getS3KeyFromUrl = (fileUrl) => {
  if (!fileUrl) return '';

  if (fileUrl.startsWith('/api/files/s3/')) {
    return decodeURIComponent(fileUrl.replace('/api/files/s3/', ''));
  }

  if (fileUrl.startsWith('s3://')) {
    return decodeURIComponent(fileUrl.replace(/^s3:\/\/[^/]+\//, ''));
  }

  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return decodeURIComponent(new URL(fileUrl).pathname.replace(/^\/+/, ''));
  }

  return '';
};

const uploadToS3 = async (file, folder = 'recipes') => {
  if (!hasS3Config()) {
    return uploadLocally(file, folder);
  }

  const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '-');
  const params = {
    Bucket: getBucketName(),
    Key: `${folder}/${Date.now()}-${safeName}`,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  if (process.env.AWS_S3_ACL && process.env.AWS_S3_ACL.toLowerCase() !== 'none') {
    params.ACL = process.env.AWS_S3_ACL;
  }

  try {
    await s3.send(new PutObjectCommand(params));
    return getS3ProxyUrl(params.Key);
  } catch (error) {
    if (params.ACL) {
      const retryParams = { ...params };
      delete retryParams.ACL;

      try {
        await s3.send(new PutObjectCommand(retryParams));
        return getS3ProxyUrl(retryParams.Key);
      } catch (retryError) {
        throw new Error(`Failed to upload file to S3: ${retryError.message}`);
      }
    }

    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
};

const getS3Object = async (key) => {
  if (!hasS3Config()) {
    throw new Error('S3 is not configured');
  }

  return s3.send(new GetObjectCommand({
    Bucket: getBucketName(),
    Key: key,
  }));
};

const deleteFromS3 = async (fileUrl) => {
  try {
    if (!hasS3Config() || !fileUrl) {
      return false;
    }

    const key = getS3KeyFromUrl(fileUrl);

    if (!key) {
      return false;
    }

    const params = {
      Bucket: getBucketName(),
      Key: key,
    };

    await s3.send(new DeleteObjectCommand(params));
    return true;
  } catch (error) {
    throw new Error(`Failed to delete file from S3: ${error.message}`);
  }
};

module.exports = {
  uploadToS3,
  deleteFromS3,
  getS3Object,
};
