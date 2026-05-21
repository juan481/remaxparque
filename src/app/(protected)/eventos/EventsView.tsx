'use client';
import { useState, useTransition } from 'react';
import { Calendar, ExternalLink, CheckCircle, Clock, Images, UserCheck } from 'lucide-react';
import { inscribirseAEvento, cancelarInscripcion } from './_actions';

interface Event {
  id: string; title: string; content: string | null;
  date: string; urgency: string; category?: string;
  drive_url?: string; image_url?: string;
}

interface Props {
  events: Event[];
  userId: string;
  registeredIds: string[];
}

const urgColor: Record<string,string> = { urgente:'#ff1200', importante:'#D97706', normal:'#0043ff' };
const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

export default function EventsView({ events, userId, registeredIds }: Props) {
  const [tab, setTab] = useState<'proximos'|'pasados'>('proximos');
  const now = new Date();

  const future = events
    .filter(e => new Date(e.date) >= now)
    .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const past = events
    .filter(e => new Date(e.date) < now)
    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const tabs = [
    { key: 'proximos', label: 'Próximos', count: future.length, color: '#059669' },
    { key: 'pasados',  label: 'Pasados',  count: past.length,   color: '#9CA3AF' },
  ] as const;

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-white rounded-2xl p-1.5 border border-gray-100 shadow-sm w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200"
            style={tab === t.key
              ? { background: '#0C2749', color: '#fff' }
              : { color: '#9CA3AF' }}>
            {t.label}
            <span className="text-xs px-1.5 py-0.5 rounded-full font-black"
              style={tab === t.key ? { background:'rgba(255,255,255,0.2)', color:'#fff' } : { background:'#f3f4f6', color: t.color }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Proximos */}
      {tab === 'proximos' && (
        <div className="space-y-4">
          {future.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-200" />
              <p className="font-bold text-gray-400">No hay eventos próximos programados</p>
            </div>
          ) : future.map(ev => (
            <FutureCard key={ev.id} ev={ev} isRegistered={registeredIds.includes(ev.id)} />
          ))}
        </div>
      )}

      {/* Pasados */}
      {tab === 'pasados' && (
        <div className="space-y-4">
          {past.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
              <Clock className="w-12 h-12 mx-auto mb-3 text-gray-200" />
              <p className="font-bold text-gray-400">Todavía no hay eventos pasados</p>
            </div>
          ) : past.map(ev => (
            <PastCard key={ev.id} ev={ev} />
          ))}
        </div>
      )}
    </div>
  );
}

function FutureCard({ ev, isRegistered }: { ev: Event; isRegistered: boolean }) {
  const [pending, startTransition] = useTransition();
  const [registered, setRegistered] = useState(isRegistered);
  const d = new Date(ev.date);
  const color = urgColor[ev.urgency] ?? '#0043ff';

  function handleInscribirse() {
    startTransition(async () => {
      if (registered) {
        await cancelarInscripcion(ev.id);
        setRegistered(false);
      } else {
        await inscribirseAEvento(ev.id);
        setRegistered(true);
      }
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="flex items-stretch">
        {/* Date block */}
        <div className="w-20 flex-shrink-0 flex flex-col items-center justify-center py-4 text-white" style={{background: color}}>
          <p className="text-xs font-bold uppercase opacity-80">{MONTHS[d.getMonth()]}</p>
          <p className="text-3xl font-black leading-none">{d.getDate()}</p>
          <p className="text-xs opacity-70 mt-0.5">{d.getFullYear()}</p>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {ev.category && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize"
                  style={{background: color + '18', color}}>
                  {ev.category}
                </span>
              )}
              <span className="text-xs text-gray-400">
                {d.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'})}hs
              </span>
            </div>
            <h3 className="font-black text-base leading-tight" style={{color:'#0C2749'}}>{ev.title}</h3>
            {ev.content && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{ev.content}</p>
            )}
          </div>

          {/* Inscribirse */}
          <div className="flex-shrink-0">
            {registered ? (
              <button onClick={handleInscribirse} disabled={pending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all border-2 hover:bg-red-50 disabled:opacity-60"
                style={{borderColor:'#059669', color:'#059669'}}>
                <CheckCircle className="w-4 h-4" />
                {pending ? 'Procesando...' : 'Inscripto'}
              </button>
            ) : (
              <button onClick={handleInscribirse} disabled={pending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60 shadow-sm"
                style={{background: color}}>
                <UserCheck className="w-4 h-4" />
                {pending ? 'Procesando...' : 'Inscribirse'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PastCard({ ev }: { ev: Event }) {
  const d = new Date(ev.date);
  const color = urgColor[ev.urgency] ?? '#0043ff';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex">
      {/* Thumbnail */}
      <div className="w-24 sm:w-36 flex-shrink-0 relative overflow-hidden" style={{background:'#f3f4f6'}}>
        {ev.image_url ? (
          <img src={ev.image_url} alt={ev.title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{background: color + '18'}}>
            <Images className="w-8 h-8" style={{color, opacity:0.4}} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 mb-1">
            {d.toLocaleDateString('es-AR',{day:'2-digit',month:'long',year:'numeric'})}
          </p>
          <h3 className="font-black text-base leading-tight" style={{color:'#0C2749'}}>{ev.title}</h3>
          {ev.content && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{ev.content}</p>
          )}
        </div>

        {ev.drive_url && (
          <a href={ev.drive_url} target="_blank" rel="noopener noreferrer"
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-80"
            style={{background:'#F5F3FF', color:'#7C3AED'}}>
            <ExternalLink className="w-3.5 h-3.5" /> Ver materiales
          </a>
        )}
      </div>
    </div>
  );
}