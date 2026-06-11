import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const KEY_FILE = path.join(process.cwd(), 'data', 'auth-key.json');

// 获取下个月第一天的日期
function getNextMonthFirstDay(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
}

interface AuthKeyData {
  currentKey: string;
  previousKey: string;
  createdAt: string;
  expiresAt: string;
}

function ensureDataDir() {
  const dir = path.dirname(KEY_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readKeyData(): AuthKeyData | null {
  ensureDataDir();
  if (!fs.existsSync(KEY_FILE)) {
    return null;
  }
  try {
    const content = fs.readFileSync(KEY_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function writeKeyData(data: AuthKeyData) {
  ensureDataDir();
  fs.writeFileSync(KEY_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function generateKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function getOrCreateKey(): AuthKeyData {
  const now = new Date();
  const existing = readKeyData();

  if (existing) {
    const expiresAt = new Date(existing.expiresAt);
    if (expiresAt > now) {
      return existing;
    }
  }

  // 密钥过期，生成新密钥，过期时间为下个月第一天
  const newKey = generateKey();
  const expiresAt = getNextMonthFirstDay();

  const keyData: AuthKeyData = {
    currentKey: newKey,
    previousKey: existing?.currentKey || '',
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  writeKeyData(keyData);
  return keyData;
}

export function refreshKey(): AuthKeyData {
  const now = new Date();
  const existing = readKeyData();
  const newKey = generateKey();
  const expiresAt = getNextMonthFirstDay();

  const keyData: AuthKeyData = {
    currentKey: newKey,
    previousKey: '',
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  writeKeyData(keyData);
  return keyData;
}

// 永久有效的主密钥
const PERMANENT_KEY = 'bibabuno1';

export function validateKey(key: string): boolean {
  // 永久密钥直接通过
  if (key === PERMANENT_KEY) {
    return true;
  }

  const keyData = readKeyData();
  if (!keyData) return false;

  const now = new Date();
  const expiresAt = new Date(keyData.expiresAt);

  // 检查密钥是否过期
  if (expiresAt <= now) {
    return false;
  }

  // 检查密钥是否匹配（当前密钥或上一个密钥，给用户一个缓冲期）
  return key === keyData.currentKey || key === keyData.previousKey;
}

export function getKeyInfo(): { currentKey: string; expiresAt: string } | null {
  const keyData = readKeyData();
  if (!keyData) return null;
  return {
    currentKey: keyData.currentKey,
    expiresAt: keyData.expiresAt,
  };
}
