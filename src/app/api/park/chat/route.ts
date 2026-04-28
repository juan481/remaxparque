import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { message, history } = await request.json();
    if (!message?.trim()) {
      return NextResponse.json({ reply: 'Mensaje vacio.' });
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const orFilter = 'title.ilike.%' + message + '%,legal_excerpt.ilike.%' + message + '%,keywords.cs.{' + message + '}';
    const { data: docs } = await admin
      .from('documents')
      .select('title, legal_excerpt, keywords, category, type')
      .eq('status', 'vigente')
      .or('title.ilike.%' + message + '%,legal_excerpt.ilike.%' + message + '%')
      .limit(4);

    const contextLines = (docs ?? []).map(d =>
      '[' + (d.category ?? 'doc') + '] ' + d.title + ': ' + (d.legal_excerpt ?? '(sin resumen disponible)')
    );
    const context = contextLines.length > 0
      ? contextLines.join('\n\n')
      : 'No se encontraron documentos especificos para esta consulta.';

    const systemContent = 'Sos Park, el asistente inteligente de RE/MAX Parque. Ayudas a agentes inmobiliarios de Argentina con preguntas sobre documentos legales, procesos de venta/alquiler, operatoria de oficina y procedimientos internos.' +
      '\n\nDocumentos relevantes encontrados en la base de datos:\n' + context +
      '\n\nReglas importantes:\n' +
      '- Responde en espanol argentino, informal y amigable (vos, estas, tenes, etc.)\n' +
      '- Se conciso y preciso, maximo 3 parrafos\n' +
      '- Si un documento es relevante, mencionalo por nombre\n' +
      '- Si no tenes certeza de algo, decilo claramente\n' +
      '- Para documentos especificos, decile que los busque en la seccion Legales de la plataforma';

    const openaiMessages = [
      { role: 'system', content: systemContent },
      ...((history ?? []).slice(-6).map((m: {role:string,content:string}) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }))),
      { role: 'user', content: message }
    ];

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ reply: 'Park IA no esta configurada todavia. Contacta al administrador para agregar la clave de OpenAI.' });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: openaiMessages,
        max_tokens: 600,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('OpenAI error:', err);
      return NextResponse.json({ reply: 'Estoy teniendo problemas para conectarme. Intenta de nuevo en un momento.' });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content ?? 'No pude generar una respuesta.';

    return NextResponse.json({ reply });
  } catch (e) {
    console.error('Park chat error:', e);
    return NextResponse.json({ reply: 'Ocurrio un error inesperado. Intenta de nuevo.' });
  }
}
