import { s3Client } from '../services/s3client'
import {
  PutObjectCommand,
  HeadObjectCommand
} from '@aws-sdk/client-s3'

interface UploadImageParams {
  file: {
    buffer: Buffer
    mimetype: string
    originalname: string
  }
  acl: string
}

export const uploadImage = async ({
  file
}: UploadImageParams) => {
  try {
    if (!process.env.SPACES_BUCKET) {
      throw new Error(
        'SPACES_BUCKET environment variable is not defined'
      )
    }

    const filename = `${Date.now()}-${file.originalname}`
    const params = {
      Bucket: process.env.SPACES_BUCKET!,
      Key: `images/${filename}`,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read' as const
    }

    const result = await s3Client.send(
      new PutObjectCommand(params)
    )

    const imageUrl = `https://${process.env.SPACES_BUCKET}.fra1.digitaloceanspaces.com/images/${filename}`

    // Verify the upload immediately
    try {
      const headCommand = new HeadObjectCommand({
        Bucket: process.env.SPACES_BUCKET!,
        Key: `images/${filename}`
      })

      await s3Client.send(headCommand)
    } catch (e) {
      console.warn('Could not verify upload:', e)
    }

    return imageUrl
  } catch (error) {
    console.error('Error uploading image:', error)
    throw new Error('Failed to upload image')
  }
}
