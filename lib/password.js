// แฮชรหัสผ่านด้วย scrypt (built-in crypto — ไม่ต้องลง dependency เพิ่ม)
// รูปแบบที่เก็บใน DB: "<salt hex>:<hash hex>" — server-only ห้าม import ใน client
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  if (!stored || !stored.includes(":")) return false;
  const [salt, hash] = stored.split(":");
  const hashBuf = Buffer.from(hash, "hex");
  const testBuf = scryptSync(password, salt, 64);
  // เทียบแบบ constant-time กัน timing attack
  return hashBuf.length === testBuf.length && timingSafeEqual(hashBuf, testBuf);
}

// สร้าง token แบบสุ่ม (ใช้กับลิงก์รีเซ็ตรหัสผ่าน)
export function randomToken() {
  return randomBytes(32).toString("hex");
}
