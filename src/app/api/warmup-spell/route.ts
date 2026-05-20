import { NextResponse } from 'next/server';

let warmedUp = false;

export async function POST() {
  try {
    if (warmedUp) {
      return NextResponse.json({ status: 'already-warmed', warmedUp: true });
    }

    const { isWordCorrect, getWordSuggestions, getCacheStats } = await import('@/lib/dictionary');

    await isWordCorrect('teste');
    await getWordSuggestions('casa');
    
    warmedUp = true;
    
    const stats = getCacheStats();
    return NextResponse.json({ 
      status: 'warmed', 
      warmedUp: true,
      cacheStats: stats 
    });
  } catch (error) {
    console.error('[warmup-spell] Failed:', error);
    return NextResponse.json({ 
      status: 'error', 
      warmedUp: false,
      error: String(error) 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ warmedUp });
}