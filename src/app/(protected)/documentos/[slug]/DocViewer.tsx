'use client';
import { useState } from 'react';
import { Loader2, AlertCircle, Maximize2, Minimize2 } from 'lucide-react';

interface Props {
  fileUrl: string;
  fileName: string | null;
}

function getExt(name: string | null, url: string): string {
  const s = (name ?? url).split('?')[0];
  return (s.split('.').pop() ?? '').toLowerCase();
}

export default function DocViewer({ fileUrl, fileName }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const ext = getExt(fileName, fileUrl);
  const isImg = ['jpg', 'jpeg', 'png'].includes(ext);
  const isPdf = ext === 'pdf';

  // Google Docs viewer for Office formats
  const viewerSrc = isPdf
    ? fileUrl
    : `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;

  const height = expanded ? '90vh' : '70vh';

  if (isImg) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex items-center justify-center p-6"
        style={{ minHeight: '300px' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={fileUrl} alt={fileName ?? 'documento'}
          className="max-w-full max-h-[70vh] object-contain rounded-xl shadow"
          onError={() => setError(true)} />
        {error && <ErrorState />}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      style={{ height }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Vista previa · Solo lectura
        </p>
        <button onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors">
          {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          {expanded ? 'Reducir' : 'Expandir'}
        </button>
      </div>

      {/* Viewer */}
      <div className="relative flex-1" style={{ height: 'calc(100% - 41px)' }}>
        {loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" style={{ color: '#0043ff' }} />
              <p className="text-sm font-semibold text-gray-400">Cargando documento...</p>
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <ErrorState />
          </div>
        )}
        <iframe
          src={viewerSrc}
          className="w-full h-full border-0"
          title="Vista previa del documento (solo lectura)"
          onLoad={() => setLoading(false)}
          onError={() => { setLoading(false); setError(true); }}
          // Prevent editing: sandboxed, no downloads from iframe toolbar
          sandbox="allow-scripts allow-same-origin allow-popups"
          style={{ display: error ? 'none' : 'block' }}
        />
      </div>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="text-center py-12">
      <AlertCircle className="w-10 h-10 mx-auto mb-3" style={{ color: '#D97706' }} />
      <p className="font-semibold text-gray-600">No se pudo cargar la vista previa</p>
      <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">
        Algunos formatos no admiten previsualización en línea.
        Descargá el archivo para verlo.
      </p>
    </div>
  );
}
