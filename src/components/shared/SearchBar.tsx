'use client';

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChange, placeholder = 'Buscar...' }: Props) {
  return (
    <div className="relative flex-1 min-w-[200px]">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">??</span>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 text-gray-300 placeholder-gray-600 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-[#003DA5]"
      />
    </div>
  );
}
