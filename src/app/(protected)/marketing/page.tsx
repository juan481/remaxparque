'use client';
import { useState } from 'react';
import { Camera, Share2, MessageCircle, Image, FileText, Video, Download, ExternalLink, Megaphone } from 'lucide-react';

const CATS = [
  { id: 'historias', label: 'Historias', icon: Camera, color: '#E1306C', bg: '#FDF2F8', canvaTag: 'Stories IG' },
  { id: 'posts', label: 'Posts', icon: Image, color: '#0043ff', bg: '#EFF6FF', canvaTag: 'Feed cuadrado' },
  { id: 'reels', label: 'Reels', icon: Video, color: '#7C3AED', bg: '#F5F3FF', canvaTag: 'Reels/TikTok' },
  { id: 'nueva-imagen', label: 'Nueva imagen', icon: Share2, color: '#059669', bg: '#ECFDF5', canvaTag: 'Branding' },
  { id: 'fuentes', label: 'Fuentes', icon: FileText, color: '#D97706', bg: '#FFFBEB', canvaTag: 'Tipografias' },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: '#25D366', bg: '#F0FDF4', canvaTag: 'Mensajes' },
];
const PLANTILLAS = [
  { id:'1', cat:'historias', title:'Historia apertura de propiedad', desc:'Template para anunciar nuevas propiedades', type:'JPG 1080x1920', canvaUrl:'#' },
  { id:'2', cat:'historias', title:'Stories testimonios clientes', desc:'Formato stories para compartir resenas', type:'JPG 1080x1920', canvaUrl:'#' },
  { id:'3', cat:'posts', title:'Post captacion de propiedad', desc:'Diseno cuadrado para publicar en feed', type:'JPG 1080x1080', canvaUrl:'#' },
  { id:'4', cat:'posts', title:'Infografia proceso de venta', desc:'Carrusel con los 5 pasos del proceso', type:'JPG x5', canvaUrl:'#' },
  { id:'5', cat:'reels', title:'Presentacion de propiedad', desc:'Plantilla animada para Reels', type:'MP4 1080x1920', canvaUrl:'#' },
  { id:'6', cat:'nueva-imagen', title:'Banner Facebook portada', desc:'Imagen corporativa para portada', type:'JPG 820x312', canvaUrl:'#' },
  { id:'7', cat:'whatsapp', title:'Mensaje de seguimiento', desc:'Texto de contacto para clientes', type:'Texto', canvaUrl:'#' },
  { id:'8', cat:'fuentes', title:'Pack tipografia Gotham', desc:'Fuentes corporativas RE/MAX', type:'ZIP Fonts', canvaUrl:'#' },
];
const EVENTOS_FOTOS = [
  { title: 'Fiesta fin de ano Grupo Parque', date: 'Dic 2025' },
  { title: 'Retiro fin de ano Grupo Parque', date: 'Nov 2025' },
  { title: 'Reunion mensual Nov 2025', date: 'Nov 2025' },
  { title: 'Trimestral Oct 2025', date: 'Oct 2025' },
  { title: 'Reunion mensual Sept 2025', date: 'Sept 2025' },
];

export default function MarketingPage() {
  const [activecat, setActiveCat] = useState('all');
  const filtered = activecat === 'all' ? PLANTILLAS : PLANTILLAS.filter(p => p.cat === activecat);
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black" style={{color:'#0C2749'}}>Marketing</h1>
        <p className="text-gray-500 mt-1">Plantillas de Canva y recursos para tus redes y comunicaciones</p>
      </div>
      <section className="mb-10">
        <h2 className="text-xl font-black mb-5" style={{color:'#0C2749'}}>Plantillas y recursos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {CATS.map(({ id, label, icon: Icon, color, bg, canvaTag }) => (
            <button key={id} onClick={() => setActiveCat(activecat === id ? 'all' : id)}
              className="bg-white rounded-2xl border-2 p-4 flex flex-col items-center gap-3 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group"
              style={{borderColor: activecat === id ? color : 'transparent'}}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-200" style={{background:bg}}>
                <Icon className="w-6 h-6" style={{color}} />
              </div>
              <span className="text-sm font-bold text-gray-700">{label}</span>
              <span className="text-xs text-gray-400">{canvaTag}</span>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filtered.map(item => {
            const cat = CATS.find(c => c.id === item.cat);
            return (
              <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden group">
                <div className="h-36 flex items-center justify-center relative overflow-hidden" style={{background: cat ? cat.bg : '#f3f4f6'}}>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-14 h-14 rounded-2xl bg-white/80 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                      {cat && <cat.icon className="w-7 h-7" style={{color: cat.color}} />}
                    </div>
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-white/80" style={{color: cat?.color ?? '#666'}}>{item.type}</span>
                  </div>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center" style={{background:'rgba(0,67,255,0.08)'}}>
                    <div className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center">
                      <ExternalLink className="w-5 h-5" style={{color:'#0043ff'}} />
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-sm leading-tight mb-1" style={{color:'#0C2749'}}>{item.title}</h3>
                  <p className="text-xs text-gray-400 mb-4">{item.desc}</p>
                  <a href={item.canvaUrl} target="_blank" rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-xl border-2 transition-all duration-200 hover:text-white hover:bg-[#0043ff] hover:border-[#0043ff]"
                    style={{borderColor:'#0043ff', color:'#0043ff'}}>
                    <ExternalLink className="w-4 h-4" /> Abrir en Canva
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <section>
        <h2 className="text-xl font-black mb-5" style={{color:'#0C2749'}}>Imagenes de eventos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {EVENTOS_FOTOS.map((ev, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer">
              <div className="h-36 flex items-center justify-center relative overflow-hidden" style={{background:'linear-gradient(135deg,#0C2749,#0043ff)'}}>
                <Image className="w-10 h-10 text-white/20" />
                <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Download className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="p-3">
                <p className="text-xs font-bold leading-tight" style={{color:'#0C2749'}}>{ev.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{ev.date}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <Megaphone className="w-10 h-10 mx-auto mb-3" style={{color:'#0043ff'}} />
          <h3 className="text-base font-black mb-1" style={{color:'#0C2749'}}>Mas contenido en camino</h3>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">El equipo de marketing sube plantillas y recursos oficiales. Volve seguido para ver las novedades.</p>
        </div>
      </section>
    </div>
  );
}
