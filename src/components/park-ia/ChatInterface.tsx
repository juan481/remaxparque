'use client';
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2, Mic, MicOff } from 'lucide-react';
import FormCard from './FormCard';

export interface FormField { key: string; label: string; type: string; required: boolean; }
export interface Msg {
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'form_request' | 'doc_ready';
  formData?: { template_slug: string; template_name: string; fields: FormField[]; };
  docUrl?: string;
  docFilename?: string;
}

interface Props {
  initialMessages?: Msg[];
  fullPage?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecognition = any;

export default function ChatInterface({ initialMessages, fullPage = false }: Props) {
  const [messages, setMessages] = useState<Msg[]>(
    initialMessages ?? [{ role: 'assistant', content: 'Hola! Soy Park, tu asistente de RE/MAX Parque. Puedo ayudarte con documentos, procesos de venta, alquiler y generacion de formularios. En que te ayudo?' }]
  );
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<AnyRecognition>(null);

  useEffect(() => {
    const w = window as AnyRecognition;
    const SpeechRec = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRec) return;
    setVoiceSupported(true);
    const rec = new SpeechRec();
    rec.lang = 'es-AR';
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e: AnyRecognition) => {
      let transcript = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      setInput(transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  function toggleVoice() {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      setInput('');
      recognitionRef.current.start();
      setListening(true);
    }
  }

  async function send(text?: string) {
    const userMsg = (text ?? input).trim();
    if (!userMsg || loading) return;
    setInput('');
    if (listening) { recognitionRef.current?.stop(); setListening(false); }
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    try {
      const res = await fetch('/api/park/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history: messages.slice(-6) }),
      });
      const data = await res.json();
      if (data.form_request) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.reply ?? 'Completa los datos para generar el documento:',
          type: 'form_request',
          formData: data.form_request,
        }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply ?? 'No pude generar una respuesta.' }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error de conexion. Intenta de nuevo.' }]);
    }
    setLoading(false);
  }

  async function handleFormSubmit(templateSlug: string, formData: Record<string, string>) {
    setMessages(prev => [...prev, { role: 'user', content: 'Datos enviados. Generando documento...' }]);
    setLoading(true);
    try {
      const res = await fetch('/api/park/generate-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_slug: templateSlug, data: formData }),
      });
      const result = await res.json();
      if (result.html) {
        const blob = new Blob([result.html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Documento listo! Podes descargarlo y abrirlo en el navegador para imprimir o guardar como PDF.',
          type: 'doc_ready',
          docUrl: url,
          docFilename: result.filename ?? 'documento.html',
        }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: result.error ?? 'No pude generar el documento.' }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error al generar el documento.' }]);
    }
    setLoading(false);
  }

  return (
    <div className={`flex flex-col ${fullPage ? 'h-full' : ''}`}>
      <div className={`${fullPage ? 'flex-1 min-h-0' : 'min-h-[240px]'} overflow-y-auto p-4 space-y-3`} style={{ background: '#f7f5ee' }}>
        {messages.map((m, i) => (
          <div key={i} className={`flex items-end gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#0043ff' }}>
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            <div className="max-w-xs sm:max-w-sm lg:max-w-md">
              <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'text-white rounded-br-sm' : 'text-gray-700 bg-white shadow-sm rounded-bl-sm'}`}
                style={m.role === 'user' ? { background: '#0043ff' } : {}}>
                {m.content}
              </div>
              {m.type === 'form_request' && m.formData && (
                <div className="mt-2">
                  <FormCard
                    templateSlug={m.formData.template_slug}
                    templateName={m.formData.template_name}
                    fields={m.formData.fields}
                    onSubmit={handleFormSubmit}
                  />
                </div>
              )}
              {m.type === 'doc_ready' && m.docUrl && (
                <div className="mt-2">
                  <a href={m.docUrl} download={m.docFilename}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
                    style={{ background: '#059669' }}>
                    Descargar documento
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-end gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#0043ff' }}>
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-1">
              {[0, 150, 300].map(d => (
                <span key={d} className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#0043ff', animationDelay: d + 'ms' }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          {voiceSupported && (
            <button onClick={toggleVoice}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0 ${listening ? 'text-white' : 'text-gray-400 bg-gray-100 hover:bg-gray-200'}`}
              style={listening ? { background: '#ff1200' } : {}}
              title={listening ? 'Detener' : 'Hablar'}>
              {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          )}
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={listening ? 'Escuchando...' : 'Preguntale algo a Park...'}
            className="flex-1 px-4 py-2.5 text-sm bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-[#0043ff] transition-colors duration-200"
            disabled={loading}
          />
          <button onClick={() => send()} disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-40 flex-shrink-0"
            style={{ background: '#0043ff' }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        {listening && (
          <p className="text-xs text-center mt-2" style={{ color: '#ff1200' }}>Escuchando... habla ahora</p>
        )}
      </div>
    </div>
  );
}