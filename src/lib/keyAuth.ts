import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const KEY_FILE = path.join(process.cwd(), 'data', 'auth-key.json');

// 配置：密钥更新周期（毫秒）
// 调试阶段：3分钟 = 3 * 60 * 1000 = 180000
// 生产环境：每月1号更新
export const KEY_UPDATE_INTERVAL = 3 * 60 * 1000; // 3分钟，调试阶段
// export const KEY_UPDATE_INTERVAL = 30 * 24 * 60 * 60 * 1000; // 30天，生产环境

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

  // 密钥过期，生成新密钥
  const newKey = generateKey();
  const expiresAt = new Date(now.getTime() + KEY_UPDATE_INTERVAL);

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
  const expiresAt = new Date(now.getTime() + KEY_UPDATE_INTERVAL);

  const keyData: AuthKeyData = {
    currentKey: newKey,
    previousKey: existing?.currentKey || '',
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  writeKeyData(keyData);
  return keyData;
}

export function validateKey(key: string): boolean {
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
