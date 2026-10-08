import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User as UserIcon, LogOut, ChevronDown, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const UserMenu = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Kənara klik → bağla
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Login olmayan → "Daxil ol" düyməsi
  if (!isAuthenticated) {
    return (
      <Link
        to="/login"
        className="px-4 py-2 rounded-lg bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan text-xs font-medium hover:bg-accent-cyan/20 transition"
      >
        Daxil ol
      </Link>
    );
  }

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    navigate('/');
  };

  const initials = (user?.name || user?.email || '?')
    .split(/[\s@]/)
    .map(s => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 rounded-lg hover:bg-bg-hover p-1 pr-2 transition"
      >
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center text-white text-xs font-semibold">
            {initials}
          </div>
        )}
        <ChevronDown size={12} className={`text-gray-500 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-bg-card border border-border shadow-2xl overflow-hidden z-50">
          {/* User info */}
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck size={12} className="text-accent-cyan" />
              <span className="text-[10px] uppercase tracking-wider text-gray-500">Hesab</span>
            </div>
            <div className="text-sm text-gray-200 truncate">{user?.name}</div>
            <div className="text-[11px] text-gray-500 truncate">{user?.email}</div>
          </div>

          {/* Actions */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-300 hover:bg-bg-hover hover:text-red-400 transition"
          >
            <LogOut size={13} /> Çıxış
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;