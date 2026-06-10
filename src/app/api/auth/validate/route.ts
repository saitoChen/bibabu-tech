import { NextRequest, NextResponse } from 'next/server';
import { validateKey } from '@/lib/keyAuth';

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
      const keyData = await import('@/lib/keyAuth').then(m => m.getOrCreateKey());
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
