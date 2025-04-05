const crypto = require("crypto");
const logger = require('../config/winston.config.js')

const secretKey = "your-32-byte-secret-key"; // Use a 256-bit key for AES-256

const encryptData = (data) => {
  const iv = crypto.randomBytes(16); // Initialization vector
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(secretKey, "utf-8"),
    iv
  );
  let encrypted = cipher.update(JSON.stringify(data), "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted; // Return iv and encrypted data
};

const decryptData = (encryptedKey) => {
  const [ivHex, encryptedData] = encryptedKey.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(secretKey, "utf-8"),
    iv
  );
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return JSON.parse(decrypted); // Convert the string back to an object
};

export { encryptData, decryptData };
