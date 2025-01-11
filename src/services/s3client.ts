import { S3 } from '@aws-sdk/client-s3'

if (!process.env.SPACES_KEY || !process.env.SPACES_SECRET) {
  throw new Error('Missing S3 credentials')
}

const s3Client = new S3({
  forcePathStyle: false,
  endpoint: 'https://fra1.digitaloceanspaces.com',
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.SPACES_KEY,
    secretAccessKey: process.env.SPACES_SECRET
  }
})

export { s3Client }
