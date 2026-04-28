'use client';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, MapPin, Clock, ArrowRight, Images } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  urgency: string;
  category?: string;
  drive_url?: string;
}

const urgColor: Record<string,string> = { urgente: '#ff1200', importante: '#D97706', normal: '#0043ff' };

const DAYS = ['Dom','Lun','Mar','Mie','Jue','Vie','Sab'];
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function EventsCalendar({ events }: { events: Event[] }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<string | null>(null);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const eventDates = new Set(events.map(e => {
    const d = new Date(e.date);
    return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate();
  }));

  function prevMonth() { if (month === 0) { setMonth(11); setYear(y => y - 1); } else { setMonth(m => m - 1); } }
  function nextMonth() { if (month === 11) { setMonth(0); setYear(y => y + 1); } else { setMonth(m => m + 1); } }

  function dayKey(d: number) { return year + '-' + month + '-' + d; }
  function hasEvent(d: number) { return eventDates.has(dayKey(d)); }

  const selectedEvents = selected
    ? events.filter(e => {
        const d = new Date(e.date);
        return dayKey(d.getDate()) === selected &&
          d.getFullYear() === year && d.getMonth() === month;
      })
    : [];

  const upcoming = events
    .filter(e => new Date(e.date) >= new Date(today.toDateString()))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 6);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4" style={{background:'#0C2749'}}>
            <button onClick={prevMonth} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors duration-200">
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <h3 className="text-white font-black">{MONTHS[month]} {year}</h3>
            <button onClick={nextMonth} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors duration-200">
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-7 mb-2">
              {DAYS.map(d => (
                <div key={d} className="text-center text-xs font-bold text-gray-400 py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({length: firstDay}).map((_, i) => <div key={'e'+i} />)}
              {Array.from({length: daysInMonth}).map((_, i) => {
                const day = i + 1;
                const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
                const hasEv = hasEvent(day);
                const isSelected = selected === dayKey(day);
                return (
                  <button key={day} onClick={() => setSelected(isSelected ? null : dayKey(day))}
                    className="relative w-full aspect-square rounded-xl flex items-center justify-center text-sm font-semibold transition-all duration-150"
                    style={{
                      background: isSelected ? '#0043ff' : isToday ? '#EFF6FF' : 'transparent',
                      color: isSelected ? '#fff' : isToday ? '#0043ff' : '#374151',
                      fontWeight: isToday || hasEv ? '800' : '500',
                    }}>
                    {day}
                    {hasEv && !isSelected && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full" style={{background:'#ff1200'}} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {selectedEvents.length > 0 && (
          <div className="mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h4 className="text-sm font-black mb-3" style={{color:'#0C2749'}}>Eventos del dia</h4>
            {selectedEvents.map(ev => (
              <div key={ev.id} className="flex items-start gap-3 mb-3 last:mb-0">
                <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0" style={{background: urgColor[ev.urgency] ?? '#0043ff'}} />
                <div>
                  <p className="text-sm font-bold" style={{color:'#0C2749'}}>{ev.title}</p>
                  {ev.time && <p className="text-xs text-gray-400">{ev.time}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="lg:col-span-2">
        <h3 className="text-lg font-black mb-4" style={{color:'#0C2749'}}>Proximos eventos</h3>
        {upcoming.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p className="font-bold text-gray-400">Sin eventos proximos</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcoming.map(ev => {
              const d = new Date(ev.date);
              const color = urgColor[ev.urgency] ?? '#0043ff';
              return (
                <div key={ev.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex items-start gap-5">
                  <div className="w-16 flex-shrink-0 rounded-2xl overflow-hidden text-center" style={{background: color}}>
                    <div className="py-2">
                      <p className="text-white/80 text-xs font-bold uppercase">{MONTHS[d.getMonth()].slice(0,3)}</p>
                      <p className="text-white font-black text-3xl leading-none">{d.getDate()}</p>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1 flex-wrap">
                      <h4 className="font-black text-base leading-tight" style={{color:'#0C2749'}}>{ev.title}</h4>
                      {ev.category && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{background: color + '15', color}}>{ev.category}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      {ev.time && (
                        <span className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                          <Clock className="w-3.5 h-3.5" /> {ev.time}
                        </span>
                      )}
                      {ev.location && (
                        <span className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                          <MapPin className="w-3.5 h-3.5" /> {ev.location}
                        </span>
                      )}
                    </div>
                  </div>
                  {ev.drive_url && (
                    <a href={ev.drive_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl transition-all duration-200 hover:opacity-80 flex-shrink-0"
                      style={{background:'#F5F3FF', color:'#7C3AED'}}>
                      <Images className="w-3 h-3" /> Ver fotos
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
