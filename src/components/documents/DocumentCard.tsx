'use client';
import { useState } from 'react';
import type { Document } from '@/types/database';
import { cn } from '@/lib/utils';

export default function DocumentCard({ document: doc }: { document: Document }) {
  const [expanded, setExpanded] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    if (!doc.file_url) return;
    setDownloading(true);
    try {
      // Track download event
      await fetch('/api/documents/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: doc.id }),
      });
      window.open(doc.file_url, '_blank');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all">
      <div className="flex items-start justify-between gap-4">
        {/* Left: info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full',
              doc.status === 'vigente' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
            )}>
              {doc.status.toUpperCase()}
            </span>
            {/* Applicability tags */}
            {doc.parque_visibility?.map(p => (
              <span key={p} className="text-xs bg-[#003DA5]/20 text-blue-400 px-2 py-0.5 rounded-full">
                {p === 'parque1' ? 'Parque 1' : p === 'parque3' ? 'Parque 3' : p}
              </span>
            ))}
            {doc.applicable_roles?.map(r => (
              <span key={r} className="text-xs bg-white/5 text-gray-400 px-2 py-0.5 rounded-full capitalize">{r}</span>
            ))}
          </div>

          <h3 className="text-white font-medium">{doc.title}</h3>

          {doc.version && (
            <p className="text-gray-500 text-xs mt-0.5">v{doc.version} � {doc.effective_date ?? ''}</p>
          )}

          {/* Changelog expander */}
          {doc.changelog_summary && (
            <div className="mt-2">
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-[#003DA5] hover:underline flex items-center gap-1"
              >
                {expanded ? '?' : '?'} �ltimos cambios
              </button>
              {expanded && (
                <p className="text-gray-400 text-sm mt-2 bg-white/5 rounded-lg p-3">
                  {doc.changelog_summary}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex flex-col gap-2 shrink-0">
          {doc.file_url && (
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-1.5 bg-[#003DA5] hover:bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
            >
              <span>?</span> {downloading ? '...' : 'PDF'}
            </button>
          )}
          {doc.file_size_kb && (
            <span className="text-gray-600 text-xs text-center">{(doc.file_size_kb / 1024).toFixed(1)} MB</span>
          )}
        </div>
      </div>
    </div>
  );
}
