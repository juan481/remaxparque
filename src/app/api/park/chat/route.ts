import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const ASSISTANT_ID = 'asst_8weWMhxXCVic6CB3vyhqVVL1';

// ─── Template definitions (for local doc generation) ────────────────────────
const TEMPLATE_TRIGGERS: Record<string, string[]> = {
  'recibo-sena':          ['recibo de sena', 'recibo sena'],
  'contrato-alquiler':    ['contrato de alquiler', 'contrato alquiler'],
  'reserva-propiedad':    ['reserva de propiedad'],
  'autorizacion-visita':  ['autorizacion de visita', 'autorizacion visita'],
  'recibo-alquiler':      ['recibo de alquiler', 'recibo mensual de alquiler'],
};

const TEMPLATE_DEFS: Record<string, { name: string; fields: Array<{ key: string; label: string; type: string; required: boolean }> }> = {
  'recibo-sena': {
    name: 'Recibo de Seña',
    fields: [
      { key: 'monto',       label: 'Monto de la seña',    type: 'text', required: true },
      { key: 'comprador',   label: 'Nombre del comprador',  type: 'text', required: true },
      { key: 'propietario', label: 'Nombre del propietario', type: 'text', required: true },
      { key: 'direccion',   label: 'Dirección del inmueble', type: 'text', required: true },
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
      { key: 'direccion',   label: 'Dirección del inmueble', type: 'text', required: true },
      { key: 'monto',       label: 'Monto mensual',          type: 'text', required: true },
      { key: 'inicio',      label: 'Fecha de inicio',        type: 'date', required: true },
      { key: 'duracion',    label: 'Duración (meses)',       type: 'text', required: true },
      { key: 'agente',      label: 'Nombre del agente',      type: 'text', required: false },
    ],
  },
  'reserva-propiedad': {
    name: 'Reserva de Propiedad',
    fields: [
      { key: 'reservante',  label: 'Nombre del reservante',  type: 'text', required: true },
      { key: 'dni',         label: 'DNI',                    type: 'text', required: true },
      { key: 'direccion',   label: 'Dirección',              type: 'text', required: true },
      { key: 'precio',      label: 'Precio acordado',        type: 'text', required: true },
      { key: 'reserva',     label: 'Monto de reserva',       type: 'text', required: true },
      { key: 'fecha',       label: 'Fecha',                  type: 'date', required: true },
      { key: 'agente',      label: 'Nombre del agente',      type: 'text', required: false },
    ],
  },
  'autorizacion-visita': {
    name: 'Autorización de Visita',
    fields: [
      { key: 'visitante',   label: 'Nombre del visitante',   type: 'text', required: true },
      { key: 'direccion',   label: 'Dirección a visitar',    type: 'text', required: true },
      { key: 'fecha',       label: 'Fecha y hora',           type: 'text', required: true },
      { key: 'propietario', label: 'Nombre del propietario', type: 'text', required: true },
      { key: 'agente',      label: 'Nombre del agente',      type: 'text', required: false },
    ],
  },
  'recibo-alquiler': {
    name: 'Recibo de Alquiler Mensual',
    fields: [
      { key: 'inquilino',   label: 'Nombre del inquilino',   type: 'text', required: true },
      { key: 'direccion',   label: 'Dirección',              type: 'text', required: true },
      { key: 'mes',         label: 'Mes y año',              type: 'text', required: true },
      { key: 'monto',       label: 'Monto abonado',          type: 'text', required: true },
      { key: 'fecha_pago',  label: 'Fecha de pago',          type: 'date', required: true },
      { key: 'agente',      label: 'Nombre del agente',      type: 'text', required: false },
    ],
  },
};

// ─── Strict document intent detection ───────────────────────────────────────
// Only triggers when user EXPLICITLY asks to generate/create a document
const EXPLICIT_GENERATE_VERBS = [
  'generame', 'generá', 'genera un', 'generar un',
  'haceme', 'hacé', 'hacer un',
  'armarme', 'armame', 'armá', 'armar un',
  'necesito generar', 'necesito armar', 'necesito hacer',
  'quiero generar', 'quiero armar', 'quiero hacer',
  'podés generar', 'podes generar', 'podés armar', 'podes armar',
  'creame', 'creá', 'crear un',
];

function detectDocumentIntent(msg: string): string | null {
  const lower = msg.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  // Must have an explicit generation verb to proceed
  const hasExplicitVerb = EXPLICIT_GENERATE_VERBS.some(v => lower.includes(v));
  if (!hasExplicitVerb) return null;

  // Check for specific template triggers
  for (const [slug, triggers] of Object.entries(TEMPLATE_TRIGGERS)) {
    if (triggers.some(t => lower.includes(t))) return slug;
  }

  // Generic document menu (explicit verb + generic doc words)
  if (lower.includes('documento') || lower.includes('formulario') ||
      lower.includes('contrato') || lower.includes('recibo')) {
    return 'menu';
  }

  return null;
}

// ─── OpenAI Assistants API helpers ──────────────────────────────────────────
function oaiHeaders(apiKey: string) {
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'OpenAI-Beta': 'assistants=v2',
  };
}

async function createThread(apiKey: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/threads', {
    method: 'POST',
    headers: oaiHeaders(apiKey),
    body: JSON.stringify({}),
  });
  const data = await res.json();
  return data.id as string;
}

async function addMessage(apiKey: string, threadId: string, content: string): Promise<boolean> {
  const res = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
    method: 'POST',
    headers: oaiHeaders(apiKey),
    body: JSON.stringify({ role: 'user', content }),
  });
  return res.ok;
}

async function runAssistant(apiKey: string, threadId: string, additionalInstructions: string): Promise<string> {
  const res = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
    method: 'POST',
    headers: oaiHeaders(apiKey),
    body: JSON.stringify({
      assistant_id: ASSISTANT_ID,
      additional_instructions: additionalInstructions,
    }),
  });
  const data = await res.json();
  return data.id as string;
}

async function pollRun(apiKey: string, threadId: string, runId: string): Promise<string> {
  const terminal = ['completed', 'failed', 'cancelled', 'expired', 'incomplete'];
  let status = 'queued';
  let attempts = 0;

  while (!terminal.includes(status) && attempts < 25) {
    await new Promise(r => setTimeout(r, 900));
    const res = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
      headers: oaiHeaders(apiKey),
    });
    const data = await res.json();
    status = data.status;
    attempts++;
  }

  return status;
}

async function getLastAssistantMessage(apiKey: string, threadId: string): Promise<string> {
  const res = await fetch(
    `https://api.openai.com/v1/threads/${threadId}/messages?order=desc&limit=5`,
    { headers: oaiHeaders(apiKey) }
  );
  const data = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const assistantMsg = data.data?.find((m: any) => m.role === 'assistant');
  const raw: string = assistantMsg?.content?.[0]?.text?.value ?? '';
  // Strip OpenAI citation markers like 【4:0†source】
  return raw.replace(/【\d+:\d+†[^】]*】/g, '').trim();
}

// ─── Main route ─────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, thread_id } = body as { message: string; thread_id?: string };

    if (!message?.trim()) return NextResponse.json({ reply: 'Mensaje vacío.' });

    // ── 1. Auth check ────────────────────────────────────────────────────────
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ reply: 'No autorizado.' }, { status: 401 });

    // ── 2. Fetch user profile for parque context ─────────────────────────────
    const admin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: profile } = await admin
      .from('profiles')
      .select('parque, jurisdiccion')
      .eq('id', user.id)
      .single();

    // Build parque context string injected per-run
    let parqueContext = '';
    const parque = profile?.parque ?? '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const jurisdiccion = (profile as any)?.jurisdiccion ?? '';

    if (parque === 'parque1' || parque === 'parque 1') {
      parqueContext = 'El usuario pertenece al Parque 1.';
      if (jurisdiccion === 'pba') {
        parqueContext += ' Su jurisdicción es Provincia de Buenos Aires (PBA). Usá solo documentos y procesos marcados como parque1_pba o parque1.';
      } else if (jurisdiccion === 'caba') {
        parqueContext += ' Su jurisdicción es Ciudad Autónoma de Buenos Aires (CABA). Usá solo documentos y procesos marcados como parque1_caba o parque1.';
      } else {
        parqueContext += ' Usá documentos y procesos marcados como parque1.';
      }
    } else if (parque === 'parque3' || parque === 'parque 3') {
      parqueContext = 'El usuario pertenece al Parque 3. Usá solo documentos y procesos marcados como parque3.';
    } else {
      parqueContext = 'No se pudo determinar el parque del usuario. Si la consulta es sobre documentos legales o procesos específicos de parque, preguntale si es del Parque 1 o Parque 3 antes de responder.';
    }

    // ── 3. Check for explicit document generation intent (local, no API) ─────
    const intent = detectDocumentIntent(message);
    if (intent && intent !== 'menu' && TEMPLATE_DEFS[intent]) {
      const tpl = TEMPLATE_DEFS[intent];
      return NextResponse.json({
        reply: `Claro! Te armo el ${tpl.name}. Completá los datos:`,
        form_request: { template_slug: intent, template_name: tpl.name, fields: tpl.fields },
        thread_id: thread_id ?? null,
      });
    }
    if (intent === 'menu') {
      const list = Object.values(TEMPLATE_DEFS).map(t => `- ${t.name}`).join('\n');
      return NextResponse.json({
        reply: `Puedo generarte estos documentos:\n\n${list}\n\nDecime cuál necesitás y te armo el formulario.`,
        thread_id: thread_id ?? null,
      });
    }

    // ── 4. OpenAI Assistants API ─────────────────────────────────────────────
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ reply: 'Park IA no está configurada. Contactá al administrador.' });
    }

    // Get or create thread
    let threadId = thread_id ?? null;

    if (!threadId) {
      threadId = await createThread(apiKey);
    }

    // Add user message (retry with new thread if stale)
    const added = await addMessage(apiKey, threadId, message);
    if (!added) {
      threadId = await createThread(apiKey);
      await addMessage(apiKey, threadId, message);
    }

    // Run assistant with parque context
    const runId = await runAssistant(apiKey, threadId, parqueContext);
    const finalStatus = await pollRun(apiKey, threadId, runId);

    if (finalStatus !== 'completed') {
      return NextResponse.json({
        reply: 'Estoy tardando más de lo esperado. Intentá de nuevo en un momento.',
        thread_id: threadId,
      });
    }

    // Get assistant reply
    const reply = await getLastAssistantMessage(apiKey, threadId);

    return NextResponse.json({
      reply: reply || 'No pude generar una respuesta.',
      thread_id: threadId,
    });

  } catch (e) {
    console.error('Park chat error:', e);
    return NextResponse.json({ reply: 'Ocurrió un error inesperado. Intentá de nuevo.' });
  }
}
