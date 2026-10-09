import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User as UserIcon, LogOut, ChevronDown, ShieldCheck, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAuthModal } from '../../context/AuthModalContext';

const UserMenu = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { open } = useAuthModal();
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpenMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ---------- LOGIN OLMAYAN — user ikonu ----------
  if (!isAuthenticated) {
    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpenMenu(v => !v)}
          className="w-9 h-9 rounded-full bg-bg-primary border border-border flex items-center justify-center text-gray-400 hover:text-accent-cyan hover:border-accent-cyan/50 transition"
        >
          <UserIcon size={18} />
        </button>

        {openMenu && (
          <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-bg-card border border-border shadow-2xl overflow-hidden z-50">
            <button
              onClick={() => { open('signin'); setOpenMenu(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-200 hover:bg-bg-hover hover:text-accent-cyan transition text-left"
            >
              <LogIn size={14} /> Daxil ol
            </button>
            <div className="h-px bg-border" />
            <button
              onClick={() => { open('signup'); setOpenMenu(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-200 hover:bg-bg-hover hover:text-accent-cyan transition text-left"
            >
              <UserPlus size={14} /> Qeydiyyat
            </button>
          </div>
        )}
      </div>
    );
  }

  // ---------- LOGIN OLAN — avatar + dropdown ----------
  const handleLogout = async () => {
    await logout();
    setOpenMenu(false);
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
        onClick={() => setOpenMenu(v => !v)}
        className="flex items-center gap-2 rounded-lg hover:bg-bg-hover p-1 pr-2 transition"
      >
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center text-white text-xs font-semibold">
            {initials}
          </div>
        )}
        <ChevronDown size={12} className={`text-gray-500 transition ${openMenu ? 'rotate-180' : ''}`} />
      </button>

      {openMenu && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-bg-card border border-border shadow-2xl overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck size={12} className="text-accent-cyan" />
              <span className="text-[10px] uppercase tracking-wider text-gray-500">Hesab</span>
            </div>
            <div className="text-sm text-gray-200 truncate">{user?.name}</div>
            <div className="text-[11px] text-gray-500 truncate">{user?.email}</div>
          </div>

          <Link
            to="/profile"
            onClick={() => setOpenMenu(false)}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-300 hover:bg-bg-hover hover:text-accent-cyan transition"
          >
            <UserIcon size={13} /> Profil
          </Link>

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