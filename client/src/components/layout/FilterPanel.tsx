import { SlidersHorizontal, RotateCcw, Filter } from 'lucide-react';

const FilterPanel = () => {
  return (
    <aside className="w-72 bg-bg-secondary border-l border-border p-4 overflow-y-auto">
      {/* Başlıq */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-gray-400" />
          <span className="font-semibold text-sm">Filterlər</span>
        </div>
        <button className="text-xs text-gray-400 hover:text-accent-cyan flex items-center gap-1">
          <RotateCcw size={12} /> Sıfırla
        </button>
      </div>

      {/* Tarix aralığı */}
      <FilterSection title="Tarix aralığı">
        <input
          type="text"
          defaultValue="15 May 2024 - 21 May 2024"
          className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-xs text-gray-300"
        />
      </FilterSection>

      {/* Kateqoriya */}
      <FilterSection title="Kateqoriya">
        <select className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-xs text-gray-300">
          <option>Hamısı</option>
        </select>
      </FilterSection>

      {/* Mənbə */}
      <FilterSection title="Mənbə">
        <select className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-xs text-gray-300">
          <option>Bütün mənbələr</option>
        </select>
      </FilterSection>

      {/* Region */}
      <FilterSection title="Region">
        <select className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-xs text-gray-300">
          <option>Bakı</option>
        </select>
      </FilterSection>

      {/* Teqlər */}
      <FilterSection title="Teqlər">
        <div className="flex flex-wrap gap-2">
          <Tag>metro</Tag>
          <Tag>nəqliyyat</Tag>
          <button className="w-6 h-6 rounded-md bg-bg-primary border border-border flex items-center justify-center text-gray-400 hover:text-accent-cyan">
            +
          </button>
        </div>
      </FilterSection>

      {/* Tətbiq et */}
      <button className="w-full mt-4 py-2.5 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white text-sm font-medium hover:opacity-90 flex items-center justify-center gap-2">
        <Filter size={14} /> Filtrləri tətbiq et
      </button>

      {/* API Access */}
      <div className="mt-6 p-3 rounded-lg bg-bg-primary border border-border">
        <div className="text-xs text-gray-400 mb-1">API Access</div>
        <div className="text-[10px] text-gray-500 mb-2">
          JSON, CSV, GeoJSON
        </div>
        <button className="text-xs text-accent-cyan hover:underline">
          API Docs →
        </button>
      </div>
    </aside>
  );
};

const FilterSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="mb-4">
    <label className="block text-xs text-gray-400 mb-1.5">{title}</label>
    {children}
  </div>
);

const Tag = ({ children }: { children: React.ReactNode }) => (
  <span className="px-2.5 py-1 rounded-md bg-bg-primary border border-border text-xs text-gray-300">
    {children}
  </span>
);

export default FilterPanel;