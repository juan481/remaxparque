import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import { Calendar, ArrowLeft, Tag } from 'lucide-react';
import Link from 'next/link';

const urgColor: Record<string,string> = { urgente:'#ff1200', importante:'#D97706', normal:'#0043ff' };
const urgLabel: Record<string,string> = { urgente:'Urgente', importante:'Importante', normal:'Novedad' };

export default async function NovedadDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: n } = await admin
    .from('news')
    .select('id,title,content,urgency,category,published_at,created_at,image_url')
    .eq('id', id)
    .eq('is_published', true)
    .neq('category', 'evento')
    .single();

  if (!n) notFound();

  const color = urgColor[n.urgency] ?? '#0043ff';
  const label = urgLabel[n.urgency] ?? 'Novedad';
  const date = new Date(n.published_at ?? n.created_at).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/novedades" className="inline-flex items-center gap-2 text-sm font-bold mb-6 hover:gap-3 transition-all duration-200" style={{color:'#0043ff'}}>
        <ArrowLeft className="w-4 h-4" /> Volver a novedades
      </Link>

      <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {n.image_url && (
          <div className="h-64 sm:h-80 relative overflow-hidden">
            <img src={n.image_url} alt={n.title} className="absolute inset-0 w-full h-full object-cover" />
          </div>
        )}

        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className="text-xs font-bold px-3 py-1 rounded-full text-white" style={{background: color}}>
              {label}
            </span>
            {n.category && n.category !== 'general' && (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 capitalize">
                <Tag className="w-3 h-3" /> {n.category}
              </span>
            )}
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> {date}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black leading-tight mb-6" style={{color:'#0C2749'}}>
            {n.title}
          </h1>

          {n.content && (
            <div className="text-gray-600 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
              {n.content}
            </div>
          )}
        </div>
      </article>
    </div>
  );
}