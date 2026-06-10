import { NextResponse } from 'next/server';
import { getOrCreateKey, getKeyInfo } from '@/lib/keyAuth';

export async function GET() {
  try {
    const keyData = getOrCreateKey();
    return NextResponse.json({
      key: keyData.currentKey,
      createdAt: keyData.createdAt,
      expiresAt: keyData.expiresAt,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to get key' },
      { status: 500 }
    );
  }
}
