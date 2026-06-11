import { NextRequest, NextResponse } from 'next/server';
import { validateKey, getOrCreateKey } from '@/lib/keyAuth';

// 永久有效的主密钥
const PERMANENT_KEY = 'bibabuno1';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key } = body;

    if (!key) {
      return NextResponse.json(
        { valid: false, error: 'Key is required' },
        { status: 400 }
      );
    }

    const isValid = validateKey(key);

    if (isValid) {
      // 永久密钥不返回过期时间
      if (key === PERMANENT_KEY) {
        return NextResponse.json({
          valid: true,
        });
      }

      const keyData = getOrCreateKey();
      return NextResponse.json({
        valid: true,
        expiresAt: keyData.expiresAt,
      });
    } else {
      return NextResponse.json({
        valid: false,
        error: 'Invalid or expired key',
      });
    }
  } catch {
    return NextResponse.json(
      { valid: false, error: 'Validation failed' },
      { status: 500 }
    );
  }
}
