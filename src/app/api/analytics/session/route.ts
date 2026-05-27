import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const { userId, parque } = await req.json();
    if (!userId) return NextResponse.json({ ok: false }, { status: 400 });

    const admin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await admin.from('analytics_events').insert({
      user_id: userId,
      event_type: 'session_start',
      parque: parque ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Non-critical — never surface errors to client
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
