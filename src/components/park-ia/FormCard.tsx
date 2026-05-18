'use client';
import { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { FormField } from './ChatInterface';

interface Props {
  templateSlug: string;
  templateName: string;
  fields: FormField[];
  onSubmit: (slug: string, data: Record<string, string>) => void;
}

export default function FormCard({ templateSlug, templateName, fields, onSubmit }: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitted(true);
    await onSubmit(templateSlug, values);
    setSubmitting(false);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 w-full max-w-xs sm:max-w-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#0043ff15' }}>
          <FileText className="w-4 h-4" style={{ color: '#0043ff' }} />
        </div>
        <p className="text-sm font-bold" style={{ color: '#0C2749' }}>{templateName}</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-2.5">
        {fields.map(f => (
          <div key={f.key}>
            <label className="block text-xs font-bold mb-1 text-gray-500">{f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}</label>
            <input
              type={f.type === 'date' ? 'date' : 'text'}
              required={f.required}
              value={values[f.key] ?? ''}
              onChange={e => setValues(prev => ({ ...prev, [f.key]: e.target.value }))}
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#0043ff] transition-colors"
              placeholder={f.label}
            />
          </div>
        ))}
        <button type="submit" disabled={submitting}
          className="w-full py-2.5 mt-1 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg,#0043ff,#0C2749)' }}>
          {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</> : 'Generar documento'}
        </button>
      </form>
    </div>
  );
}
