import { Search, Sun, Moon, User, Globe, Command } from 'lucide-react';

const Topbar = () => {
  return (
    <header className="h-16 bg-bg-secondary border-b border-border flex items-center justify-between px-6">
      {/* Axtarış */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            placeholder='Məlumat axtar... (məs. "metro sərnişin", "iqtisadi göstəricilər")'
            className="w-full bg-bg-primary border border-border rounded-lg pl-10 pr-20 py-2 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-accent-cyan/50"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-gray-500">
            <Command size={12} />K
          </div>
        </div>
      </div>

      {/* Sağ tərəf */}
      <div className="flex items-center gap-3 ml-6">
        <div className="flex items-center bg-bg-primary rounded-lg border border-border overflow-hidden text-xs">
          <button className="px-3 py-1.5 bg-accent-cyan/10 text-accent-cyan">AZ</button>
          <button className="px-3 py-1.5 text-gray-400 hover:text-white">RU</button>
          <button className="px-3 py-1.5 text-gray-400 hover:text-white">EN</button>
        </div>

        <button className="p-2 rounded-lg hover:bg-bg-hover text-gray-400 hover:text-white">
          <Sun size={18} />
        </button>

        <button className="w-9 h-9 rounded-full bg-bg-primary border border-border flex items-center justify-center text-gray-400 hover:text-white">
          <User size={18} />
        </button>
      </div>
    </header>
  );
};

export default Topbar;