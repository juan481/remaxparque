import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const TEMPLATE_TRIGGERS: Record<string, string[]> = {
  'recibo-sena':          ['sena', 'senal', 'recibo sena', 'recibo de sena'],
  'contrato-alquiler':    ['contrato alquiler', 'contrato de alquiler', 'armar contrato'],
  'reserva-propiedad':    ['reserva', 'reservar', 'reserva de propiedad'],
  'autorizacion-visita':  ['visita', 'autorizacion visita', 'autorizar visita'],
  'recibo-alquiler':      ['recibo alquiler', 'recibo mensual', 'recibo de alquiler'],
};

const TEMPLATE_DEFS: Record<string, { name: string; fields: Array<{ key: string; label: string; type: string; required: boolean }> }> = {
  'recibo-sena': {
    name: 'Recibo de Se\u00f1a',
    fields: [
      { key: 'monto',       label: 'Monto de la se\u00f1a',   type: 'text', required: true },
      { key: 'comprador',   label: 'Nombre del comprador',  type: 'text', required: true },
      { key: 'propietario', label: 'Nombre del propietario', type: 'text', required: true },
      { key: 'direccion',   label: 'Direcci\u00f3n del inmueble', type: 'text', required: true },
      { key: 'fecha',       label: 'Fecha',                  type: 'date', required: true },
      { key: 'agente',      label: 'Nombre del agente',      type: 'text', required: false },
    ],
  },
  'contrato-alquiler': {
    name: 'Contrato de Alquiler',
    fields: [
      { key: 'propietario', label: 'Nombre del propietario',  type: 'text', required: true },
      { key: 'inquilino',   label: 'Nombre del inquilino',   type: 'text', required: true },
      { key: 'dni',         label: 'DNI del inquilino',      type: 'text', required: true },
      { key: 'direccion',   label: 'Direcci\u00f3n del inmueble', type: 'text', required: true },
      { key: 'monto',       label: 'Monto mensual',          type: 'text', required: true },
      { key: 'inicio',      label: 'Fecha de inicio',        type: 'date', required: true },
      { key: 'duracion',    label: 'Duraci\u00f3n (meses)',  type: 'text', required: true },
      { key: 'agente',      label: 'Nombre del agente',      type: 'text', required: false },
    ],
  },
  'reserva-propiedad': {
    name: 'Reserva de Propiedad',
    fields: [
      { key: 'reservante',  label: 'Nombre del reservante',  type: 'text', required: true },
      { key: 'dni',         label: 'DNI',                    type: 'text', required: true },
      { key: 'direccion',   label: 'Direcci\u00f3n',        type: 'text', required: true },
      { key: 'precio',      label: 'Precio acordado',        type: 'text', required: true },
      { key: 'reserva',     label: 'Monto de reserva',       type: 'text', required: true },
      { key: 'fecha',       label: 'Fecha',                  type: 'date', required: true },
      { key: 'agente',      label: 'Nombre del agente',      type: 'text', required: false },
    ],
  },
  'autorizacion-visita': {
    name: 'Autorizaci\u00f3n de Visita',
    fields: [
      { key: 'visitante',   label: 'Nombre del visitante',   type: 'text', required: true },
      { key: 'direccion',   label: 'Direcci\u00f3n a visitar', type: 'text', required: true },
      { key: 'fecha',       label: 'Fecha y hora',           type: 'text', required: true },
      { key: 'propietario', label: 'Nombre del propietario', type: 'text', required: true },
      { key: 'agente',      label: 'Nombre del agente',      type: 'text', required: false },
    ],
  },
  'recibo-alquiler': {
    name: 'Recibo de Alquiler Mensual',
    fields: [
      { key: 'inquilino',   label: 'Nombre del inquilino',   type: 'text', required: true },
      { key: 'direccion',   label: 'Direcci\u00f3n',        type: 'text', required: true },
      { key: 'mes',         label: 'Mes y a\u00f1o',        type: 'text', required: true },
      { key: 'monto',       label: 'Monto abonado',          type: 'text', required: true },
      { key: 'fecha_pago',  label: 'Fecha de pago',          type: 'date', required: true },
      { key: 'agente',      label: 'Nombre del agente',      type: 'text', required: false },
    ],
  },
};

function detectDocumentIntent(msg: string): string | null {
  const lower = msg.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const [slug, triggers] of Object.entries(TEMPLATE_TRIGGERS)) {
    if (triggers.some(t => lower.includes(t))) return slug;
  }
  if (lower.includes('generar') || lower.includes('armar') || lower.includes('hacer') || lower.includes('necesito un')) {
    if (lower.includes('documento') || lower.includes('formulario') || lower.includes('contrato') || lower.includes('recibo')) {
      return 'menu';
    }
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const { message, history } = await request.json();
    if (!message?.trim()) return NextResponse.json({ reply: 'Mensaje vacio.' });

    const intent = detectDocumentIntent(message);
    if (intent && intent !== 'menu' && TEMPLATE_DEFS[intent]) {
      const tpl = TEMPLATE_DEFS[intent];
      return NextResponse.json({
        reply: 'Claro! Te armo el ' + tpl.name + '. Completa los datos:',
        form_request: { template_slug: intent, template_name: tpl.name, fields: tpl.fields },
      });
    }
    if (intent === 'menu') {
      const list = Object.values(TEMPLATE_DEFS).map(t => '- ' + t.name).join('\n');
      return NextResponse.json({
        reply: 'Puedo generarte estos documentos:\n\n' + list + '\n\nDecime cual necesitas y te armo el formulario.',
      });
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

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
      '\n\nDocumentos relevantes en la base de datos:\n' + context +
      '\n\nTambien podes generar formularios/documentos: recibo de sena, contrato de alquiler, reserva de propiedad, autorizacion de visita, recibo de alquiler mensual.' +
      '\n\nReglas:\n' +
      '- Responde en espanol argentino, informal (vos, estas, tenes)\n' +
      '- Se conciso, maximo 3 parrafos\n' +
      '- Para documentos especificos, decile que los busque en la seccion Legales\n' +
      '- Si el usuario quiere generar un documento, decile que lo pida directamente';

    const openaiMessages = [
      { role: 'system', content: systemContent },
      ...((history ?? []).slice(-6).map((m: { role: string; content: string }) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      }))),
      { role: 'user', content: message },
    ];

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ reply: 'Park IA no esta configurada. Contacta al administrador.' });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: openaiMessages, max_tokens: 600, temperature: 0.7 }),
    });

    if (!response.ok) return NextResponse.json({ reply: 'Estoy teniendo problemas. Intenta de nuevo en un momento.' });
    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content ?? 'No pude generar una respuesta.';
    return NextResponse.json({ reply });
  } catch (e) {
    console.error('Park chat error:', e);
    return NextResponse.json({ reply: 'Ocurrio un error inesperado. Intenta de nuevo.' });
  }
}
