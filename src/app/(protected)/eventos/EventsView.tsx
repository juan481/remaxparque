'use client';
import { useState, useTransition } from 'react';
import {
  Calendar, ChevronLeft, ChevronRight,
  ExternalLink, CheckCircle, Clock, Images, UserCheck,
  X, MapPin, Mail, Wifi,
} from 'lucide-react';
import { inscribirseAEvento, cancelarInscripcion } from './_actions';
import SectionSearchBar from '@/components/shared/SectionSearchBar';

interface Event {
  id: string; title: string; content: string | null;
  date: string; urgency: string; category?: string;
  drive_url?: string; image_url?: string;
  location?: string; event_online?: boolean;
}

interface Props {
  events: Event[];
  userId: string;
  registeredIds: string[];
}

const urgColor: Record<string, string> = {
  ventas: '#0043ff', capacitacion: '#7C3AED', otras: '#059669',
  // legacy fallbacks
  urgente: '#ff1200', importante: '#D97706', normal: '#0043ff',
};
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const DAYS_ES = ['Lu','Ma','Mi','Ju','Vi','Sa','Do'];

export default function EventsView({ events, userId, registeredIds }: Props) {
  const [tab, setTab] = useState<'proximos' | 'pasados'>('proximos');
  const [searchQuery, setSearchQuery] = useState('');
  const [calMonth, setCalMonth] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [registeredSet, setRegisteredSet] = useState(() => new Set(registeredIds));

  const now = new Date();

  // Filter events by search query
  const filteredEvents = searchQuery.length >= 2
    ? events.filter(e =>
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.content ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.location ?? '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : events;

  const future = filteredEvents
    .filter(e => new Date(e.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const past = filteredEvents
    .filter(e => new Date(e.date) < now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Build day → events map for calendar
  const eventsByDay: Record<string, Event[]> = {};
  for (const ev of events) {
    const d = new Date(ev.date);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!eventsByDay[key]) eventsByDay[key] = [];
    eventsByDay[key].push(ev);
  }

  const year = calMonth.getFullYear();
  const month = calMonth.getMonth();
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDow + 6) % 7; // convert to Monday-first
  const calCells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function handleRegistrationChange(id: string, reg: boolean) {
    setRegisteredSet(s => {
      const n = new Set(s);
      reg ? n.add(id) : n.delete(id);
      return n;
    });
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Mini Calendar */}
      <div className="lg:w-72 flex-shrink-0">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>
            <p className="font-black text-sm" style={{ color: '#0C2749' }}>
              {MONTHS_ES[month]} {year}
            </p>
            <button onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {DAYS_ES.map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-gray-400 py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px">
            {calCells.map((day, i) => {
              if (!day) return <div key={`e-${i}`} className="aspect-square" />;
              const key = `${year}-${month}-${day}`;
              const dayEvents = eventsByDay[key] ?? [];
              const hasEvents = dayEvents.length > 0;
              const today = new Date();
              const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
              const color = hasEvents ? (urgColor[dayEvents[0].urgency] ?? '#0043ff') : undefined;

              return (
                <button key={day}
                  onClick={() => hasEvents && setSelectedEvent(dayEvents[0])}
                  className={`aspect-square flex items-center justify-center text-[11px] font-bold rounded-lg transition-all relative
                    ${hasEvents ? 'cursor-pointer hover:scale-110 hover:shadow-md' : 'cursor-default'}
                  `}
                  style={hasEvents
                    ? { background: color, color: '#fff' }
                    : { color: isToday ? '#0043ff' : '#6B7280', fontWeight: isToday ? '900' : undefined }
                  }>
                  {day}
                  {isToday && !hasEvents && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#0043ff]" />
                  )}
                  {hasEvents && dayEvents.length > 1 && (
                    <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-white text-[8px] font-black flex items-center justify-center shadow"
                      style={{ color }}>
                      {dayEvents.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5">
            {[{ c: 'urgente', l: 'Urgente' }, { c: 'importante', l: 'Importante' }, { c: 'normal', l: 'Normal' }].map(({ c, l }) => (
              <div key={c} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: urgColor[c] }} />
                <span className="text-xs text-gray-500">{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Events list */}
      <div className="flex-1 min-w-0">
        {/* Search — scoped to Eventos */}
        <SectionSearchBar
          placeholder="Buscar eventos, capacitaciones..."
          onSearch={setSearchQuery}
          quickTags={[
            { label: 'Ventas', value: 'ventas' },
            { label: 'Capacitación', value: 'capacitacion' },
            { label: 'Online', value: 'online' },
          ]}
        />

        <div className="flex gap-2 mb-6 bg-white rounded-2xl p-1.5 border border-gray-100 shadow-sm w-fit">
          {(['proximos', 'pasados'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200"
              style={tab === t ? { background: '#0C2749', color: '#fff' } : { color: '#9CA3AF' }}>
              {t === 'proximos' ? 'Próximos' : 'Pasados'}
              <span className="text-xs px-1.5 py-0.5 rounded-full font-black"
                style={tab === t
                  ? { background: 'rgba(255,255,255,0.2)', color: '#fff' }
                  : { background: '#f3f4f6', color: '#9CA3AF' }}>
                {t === 'proximos' ? future.length : past.length}
              </span>
            </button>
          ))}
        </div>

        {tab === 'proximos' && (
          <div className="space-y-4">
            {future.length === 0 ? (
              <EmptyCard icon={Calendar} text="No hay eventos próximos programados" />
            ) : future.map(ev => (
              <FutureCard key={ev.id} ev={ev}
                isRegistered={registeredSet.has(ev.id)}
                onOpenDetail={() => setSelectedEvent(ev)}
                onRegistrationChange={handleRegistrationChange}
              />
            ))}
          </div>
        )}

        {tab === 'pasados' && (
          <div className="space-y-4">
            {past.length === 0 ? (
              <EmptyCard icon={Clock} text="Todavía no hay eventos pasados" />
            ) : past.map(ev => (
              <PastCard key={ev.id} ev={ev} onOpenDetail={() => setSelectedEvent(ev)} />
            ))}
          </div>
        )}
      </div>

      {selectedEvent && (
        <EventModal
          ev={selectedEvent}
          isRegistered={registeredSet.has(selectedEvent.id)}
          onClose={() => setSelectedEvent(null)}
          onRegistrationChange={handleRegistrationChange}
        />
      )}
    </div>
  );
}

function EmptyCard({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
      <Icon className="w-12 h-12 mx-auto mb-3 text-gray-200" />
      <p className="font-bold text-gray-400">{text}</p>
    </div>
  );
}

function FutureCard({ ev, isRegistered, onOpenDetail, onRegistrationChange }: {
  ev: Event; isRegistered: boolean;
  onOpenDetail: () => void;
  onRegistrationChange: (id: string, reg: boolean) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [registered, setRegistered] = useState(isRegistered);
  const d = new Date(ev.date);
  const color = urgColor[ev.urgency] ?? '#0043ff';

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    startTransition(async () => {
      if (registered) {
        await cancelarInscripcion(ev.id);
        setRegistered(false);
        onRegistrationChange(ev.id, false);
      } else {
        await inscribirseAEvento(ev.id);
        setRegistered(true);
        onRegistrationChange(ev.id, true);
      }
    });
  }

  return (
    <div onClick={onOpenDetail}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer">
      <div className="flex items-stretch">
        <div className="w-20 flex-shrink-0 flex flex-col items-center justify-center py-4 text-white" style={{ background: color }}>
          <p className="text-xs font-bold uppercase opacity-80">{MONTHS_SHORT[d.getMonth()]}</p>
          <p className="text-3xl font-black leading-none">{d.getDate()}</p>
          <p className="text-xs opacity-70 mt-0.5">{d.getFullYear()}</p>
        </div>
        <div className="flex-1 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs text-gray-400">
                {d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}hs
              </span>
              {ev.event_online && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 flex items-center gap-1">
                  <Wifi className="w-3 h-3" /> Online
                </span>
              )}
              {ev.location && !ev.event_online && (
                <span className="text-xs text-gray-400 flex items-center gap-1 truncate max-w-[160px]">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{ev.location}</span>
                </span>
              )}
            </div>
            <h3 className="font-black text-base leading-tight" style={{ color: '#0C2749' }}>{ev.title}</h3>
            {ev.content && <p className="text-sm text-gray-500 mt-1 line-clamp-1">{ev.content}</p>}
          </div>
          <div className="flex-shrink-0" onClick={e => e.stopPropagation()}>
            {registered ? (
              <button onClick={handleClick} disabled={pending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all border-2 hover:bg-red-50 disabled:opacity-60"
                style={{ borderColor: '#059669', color: '#059669' }}>
                <CheckCircle className="w-4 h-4" />
                {pending ? 'Procesando...' : 'Inscripto'}
              </button>
            ) : (
              <button onClick={handleClick} disabled={pending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60 shadow-sm"
                style={{ background: color }}>
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

function PastCard({ ev, onOpenDetail }: { ev: Event; onOpenDetail: () => void }) {
  const d = new Date(ev.date);
  const color = urgColor[ev.urgency] ?? '#0043ff';

  return (
    <div onClick={onOpenDetail}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex cursor-pointer">
      <div className="w-24 sm:w-36 flex-shrink-0 relative overflow-hidden" style={{ background: '#f3f4f6' }}>
        {ev.image_url ? (
          <img src={ev.image_url} alt={ev.title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: color + '18' }}>
            <Images className="w-8 h-8" style={{ color, opacity: 0.4 }} />
          </div>
        )}
      </div>
      <div className="flex-1 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 mb-1">
            {d.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
          <h3 className="font-black text-base leading-tight" style={{ color: '#0C2749' }}>{ev.title}</h3>
          {ev.content && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{ev.content}</p>}
        </div>
        {ev.drive_url && (
          <a href={ev.drive_url} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-80"
            style={{ background: '#F5F3FF', color: '#7C3AED' }}>
            <ExternalLink className="w-3.5 h-3.5" /> Ver materiales
          </a>
        )}
      </div>
    </div>
  );
}

function EventModal({ ev, isRegistered, onClose, onRegistrationChange }: {
  ev: Event; isRegistered: boolean;
  onClose: () => void;
  onRegistrationChange: (id: string, reg: boolean) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [registered, setRegistered] = useState(isRegistered);
  const [justRegistered, setJustRegistered] = useState(false);
  const d = new Date(ev.date);
  const color = urgColor[ev.urgency] ?? '#0043ff';
  const isFuture = d >= new Date();

  function handleInscribirse() {
    startTransition(async () => {
      if (registered) {
        await cancelarInscripcion(ev.id);
        setRegistered(false);
        setJustRegistered(false);
        onRegistrationChange(ev.id, false);
      } else {
        await inscribirseAEvento(ev.id);
        setRegistered(true);
        setJustRegistered(true);
        onRegistrationChange(ev.id, true);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={e => e.stopPropagation()}>

        {/* Coloured header */}
        <div className="p-6 pb-5" style={{ background: color }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {ev.event_online && (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full mb-3 bg-white/20 text-white">
                  <Wifi className="w-3 h-3" /> Online
                </span>
              )}
              <h2 className="text-xl font-black text-white leading-tight">{ev.title}</h2>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center flex-shrink-0 transition-colors">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Details */}
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap gap-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + '18' }}>
                <Calendar className="w-4 h-4" style={{ color }} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Fecha</p>
                <p className="text-sm font-bold capitalize" style={{ color: '#0C2749' }}>
                  {d.toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + '18' }}>
                <Clock className="w-4 h-4" style={{ color }} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Horario</p>
                <p className="text-sm font-bold" style={{ color: '#0C2749' }}>
                  {d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}hs
                </p>
              </div>
            </div>
          </div>

          {ev.location && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + '18' }}>
                <MapPin className="w-4 h-4" style={{ color }} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Ubicación</p>
                <p className="text-sm font-bold" style={{ color: '#0C2749' }}>{ev.location}</p>
              </div>
            </div>
          )}

          {ev.content && (
            <p className="text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">{ev.content}</p>
          )}

          {isFuture && (
            <div className="border-t border-gray-100 pt-4 space-y-3">
              {justRegistered && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-green-50">
                  <Mail className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-700 leading-relaxed">
                    <span className="font-bold">¡Te inscribiste!</span> Nos contactaremos a tu correo electrónico (el que usás para iniciar sesión) para enviarte más información.
                  </p>
                </div>
              )}
              {registered ? (
                <button onClick={handleInscribirse} disabled={pending}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all border-2 hover:bg-red-50 disabled:opacity-60"
                  style={{ borderColor: '#059669', color: '#059669' }}>
                  <CheckCircle className="w-4 h-4" />
                  {pending ? 'Procesando...' : 'Inscripto — clic para cancelar'}
                </button>
              ) : (
                <button onClick={handleInscribirse} disabled={pending}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60 shadow-sm"
                  style={{ background: color }}>
                  <UserCheck className="w-4 h-4" />
                  {pending ? 'Procesando...' : 'Inscribirse al evento'}
                </button>
              )}
            </div>
          )}

          {!isFuture && ev.drive_url && (
            <div className="border-t border-gray-100 pt-4">
              <a href={ev.drive_url} target="_blank" rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-80"
                style={{ background: '#F5F3FF', color: '#7C3AED' }}>
                <ExternalLink className="w-4 h-4" /> Ver materiales y fotos
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
