import { NextResponse } from 'next/server';

function isAllowedImageUrl(url) {
  try {
    const parsed = new URL(url);
    const trusted = new URL(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
    return (
      parsed.protocol === 'https:' &&
      parsed.hostname === trusted.hostname &&
      parsed.pathname.startsWith('/storage/')
    );
  } catch {
    return false;
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    if (!isAllowedImageUrl(url)) {
      return NextResponse.json({ error: 'URL not allowed.' }, { status: 400 });
    }

    const response = await fetch(url);
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: response.status });
    }

    const arrayBuffer = await response.arrayBuffer();
    
    // Pass along the content type
    const contentType = response.headers.get('content-type') || 'image/png';
    
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
