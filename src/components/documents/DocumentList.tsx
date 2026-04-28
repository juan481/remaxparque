'use client';
import { useState } from 'react';
import type { Document } from '@/types/database';
import DocumentCard from './DocumentCard';
import SearchBar from '@/components/shared/SearchBar';

const TIPOS = ['contrato', 'formulario', 'proceso'];
const CATEGORIAS = ['ventas', 'alquileres', 'uif', 'admin'];

export default function DocumentList({ documents }: { documents: Document[] }) {
  const [search, setSearch] = useState('');
  const [tipo, setTipo] = useState('');
  const [categoria, setCategoria] = useState('');

  const filtered = documents.filter(doc => {
    const matchSearch = !search || doc.title.toLowerCase().includes(search.toLowerCase());
    const matchTipo = !tipo || doc.type === tipo;
    const matchCat = !categoria || doc.category === categoria;
    return matchSearch && matchTipo && matchCat;
  });

  const grouped = filtered.reduce<Record<string, Document[]>>((acc, doc) => {
    const key = doc.category ?? 'otros';
    if (!acc[key]) acc[key] = [];
    acc[key].push(doc);
    return acc;
  }, {});

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar documentos..." />
        <select value={tipo} onChange={e => setTipo(e.target.value)}
          className="bg-white/5 border border-white/10 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#003DA5]">
          <option value="">Todos los tipos</option>
          {TIPOS.map(t => <option key={t} value={t} className="bg-[#0A1628]">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
        <select value={categoria} onChange={e => setCategoria(e.target.value)}
          className="bg-white/5 border border-white/10 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#003DA5]">
          <option value="">Todas las categor�as</option>
          {CATEGORIAS.map(c => <option key={c} value={c} className="bg-[#0A1628]">{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-4">??</p>
          <p className="font-medium">No se encontraron documentos</p>
          <p className="text-sm mt-1">Intent� con otros filtros</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, docs]) => (
            <div key={category}>
              <h2 className="text-gray-400 text-xs uppercase tracking-wider mb-3 capitalize">
                {category} ({docs.length})
              </h2>
              <div className="space-y-3">
                {docs.map(doc => <DocumentCard key={doc.id} document={doc} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
