import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const ENCODING = "hex";
const ENCODING_UTF8 = "utf8";

export function encrypt(text: string, key: string): string {
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(key, "utf-8"),
    iv
  );

  let encrypted = cipher.update(text, ENCODING_UTF8, ENCODING);
  encrypted += cipher.final(ENCODING);

  const authTag = cipher.getAuthTag();

  return `${iv.toString(ENCODING)}:${encrypted}:${authTag.toString(ENCODING)}`;
}

export function decrypt(encryptedData: string, key: string): string {
  // Split the encrypted data into IV, encrypted text, and authTag
  const [ivHex, encryptedText, authTagHex] = encryptedData.split(":");

  // Convert the hex strings to Buffers
  const iv = Buffer.from(ivHex, ENCODING);
  const encryptedBuffer = Buffer.from(encryptedText, ENCODING);
  const authTag = Buffer.from(authTagHex, ENCODING);

  // Create a decipher with the correct key and IV
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(key, "utf-8"),
    iv
  );

  // Set the authentication tag (used for additional authenticated data in AES-GCM)
  decipher.setAuthTag(authTag);

  // Decrypt the message (no need for input encoding if using Buffer)
  let decrypted = decipher.update(encryptedBuffer); // First buffer chunk
  decrypted = Buffer.concat([decrypted, decipher.final()]); // Concatenate final decrypted chunk

  // Convert the decrypted Buffer to a UTF-8 string
  return decrypted.toString(ENCODING_UTF8); // Convert to UTF-8 string
}
