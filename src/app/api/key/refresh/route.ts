import { NextResponse } from 'next/server';
import { refreshKey } from '@/lib/keyAuth';

export async function POST() {
  try {
    const keyData = refreshKey();
    return NextResponse.json({
      key: keyData.currentKey,
      createdAt: keyData.createdAt,
      expiresAt: keyData.expiresAt,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to refresh key' },
      { status: 500 }
    );
  }
}
