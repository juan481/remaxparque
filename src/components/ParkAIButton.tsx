'use client';
import { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, Loader2 } from 'lucide-react';

interface Msg { role: 'user' | 'assistant'; content: string; }

export default function ParkAIButton() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: 'Hola! Soy Park, tu asistente de RE/MAX Parque. Puedo ayudarte con documentos, procesos de venta, alquiler y operatoria de oficina. En que te ayudo?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    try {
      const res = await fetch('/api/park/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history: messages.slice(-6) }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply ?? 'No pude generar una respuesta. Intenta de nuevo.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error de conexion. Verificá que la API de Park este configurada.' }]);
    }
    setLoading(false);
  }

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col items-end gap-3">
      {open && (
        <div className="w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-slide-up flex flex-col" style={{maxHeight:'520px'}}>
          <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{background:'linear-gradient(135deg,#0C2749,#0043ff)'}}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-black text-white text-base leading-none">Park IA</p>
                <p className="text-xs text-blue-200 mt-0.5">Asistente RE/MAX Parque</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors duration-200">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{background:'#f7f5ee', minHeight:'240px'}}>
            {messages.map((m, i) => (
              <div key={i} className={cn('flex items-end gap-2', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{background:'#0043ff'}}>
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={cn(
                  'max-w-64 px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                  m.role === 'user' ? 'text-white rounded-br-sm' : 'text-gray-700 bg-white shadow-sm rounded-bl-sm'
                )} style={m.role === 'user' ? {background:'#0043ff'} : {}}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-end gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{background:'#0043ff'}}>
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-1">
                  {[0,150,300].map(d => (
                    <span key={d} className="w-2 h-2 rounded-full animate-bounce" style={{background:'#0043ff',animationDelay:d+'ms'}} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-4 bg-white border-t border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Preguntale algo a Park..."
                className="flex-1 px-4 py-2.5 text-sm bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-[#0043ff] transition-colors duration-200"
                disabled={loading}
              />
              <button onClick={send} disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-40 flex-shrink-0"
                style={{background:'#0043ff'}}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 px-5 py-3.5 rounded-full shadow-2xl text-white font-bold text-base transition-all duration-200 hover:scale-105 active:scale-95"
        style={{background:'linear-gradient(135deg,#0C2749,#0043ff)'}}>
        <Sparkles className="w-5 h-5" />
        {open ? <span>Cerrar</span> : <span>Park IA</span>}
      </button>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
