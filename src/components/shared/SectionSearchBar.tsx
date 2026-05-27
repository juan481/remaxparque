'use client';
import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface QuickTag { label: string; value: string; }

interface Props {
  placeholder?: string;
  defaultValue?: string;
  /** If provided, search filters locally (client mode — no page reload) */
  onSearch?: (q: string) => void;
  quickTags?: QuickTag[];
}

/**
 * Reusable section-scoped search bar.
 * - Without onSearch: submits to the same URL as ?q= (server-rendered sections)
 * - With onSearch: calls the callback (client-rendered sections)
 */
export default function SectionSearchBar({
  placeholder = 'Buscar en esta sección...',
  defaultValue = '',
  onSearch,
  quickTags,
}: Props) {
  const [value, setValue] = useState(defaultValue);
  const router = useRouter();

  function submit(v: string) {
    if (onSearch) {
      onSearch(v);
    } else {
      const url = new URL(window.location.href);
      if (v) url.searchParams.set('q', v);
      else url.searchParams.delete('q');
      router.push(url.pathname + (url.search || ''));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit(value);
  }

  function handleClear() {
    setValue('');
    submit('');
  }

  return (
    <div className="mb-6">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={value}
            onChange={e => {
              setValue(e.target.value);
              // client mode: filter as user types (debounce in effect would be nicer but this is fine)
              if (onSearch) onSearch(e.target.value);
            }}
            placeholder={placeholder}
            className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-shadow"
          />
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
            >
              <X className="w-3 h-3 text-gray-500" />
            </button>
          )}
        </div>
        {!onSearch && (
          <button
            type="submit"
            className="px-5 py-3 text-white text-sm font-semibold rounded-xl transition-all hover:opacity-90 active:scale-95 shadow-sm"
            style={{ background: '#0043ff' }}
          >
            Buscar
          </button>
        )}
      </form>

      {quickTags && quickTags.length > 0 && (
        <div className="flex gap-2 mt-3 flex-wrap">
          {quickTags.map(tag => (
            <button
              key={tag.value}
              type="button"
              onClick={() => { setValue(tag.value); submit(tag.value); }}
              className="text-xs px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
            >
              {tag.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
