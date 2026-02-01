
import React, { useState } from 'react';
import { LayoutDashboard, ShoppingCart, Table, Package2, Users, ChevronDown, LogOut, Database } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [dataMasterOpen, setDataMasterOpen] = useState(false);

  const isOwner = user?.role === 'owner';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;
  const isDataMasterActive = ['/suppliers', '/products', '/employees'].includes(location.pathname);

  // Data Master sub-links based on role
  const dataMasterLinks = [
    // Only employee can see Supplier and Produk
    ...(!isOwner ? [
      { name: 'Supplier', path: '/suppliers', icon: Package2 },
      { name: 'Produk', path: '/products', icon: Package2 },
    ] : []),
    // Only owner can see Karyawan
    ...(isOwner ? [{ name: 'Karyawan', path: '/employees', icon: Users }] : []),
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white text-slate-600 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col border-r border-slate-200`}>
        
        {/* Logo Area */}
        <div className="h-24 flex items-center px-8">
          <div>
            <h1 className="font-heading font-extrabold text-slate-900 text-2xl tracking-tighter leading-none uppercase">Saputra Jaya</h1>
            <div className="h-1.5 w-6 bg-indigo-600 mt-2.5"></div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-8 px-5 space-y-2">
          
          {/* Owner-only links */}
          {isOwner && (
            <>
              <Link
                to="/dashboard"
                onClick={() => setIsOpen(false)}
                className={`group flex items-center gap-4 rounded-2xl px-5 py-4 text-[11px] font-black uppercase tracking-widest transition-all duration-200 ${
                  isActive('/dashboard')
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                    : 'hover:bg-slate-50 hover:text-slate-900 text-slate-400'
                }`}
              >
                <LayoutDashboard className={`h-5 w-5 ${isActive('/dashboard') ? 'text-white' : 'text-slate-300 group-hover:text-slate-500'}`} />
                Dashboard
              </Link>

              <Link
                to="/plan"
                onClick={() => setIsOpen(false)}
                className={`group flex items-center gap-4 rounded-2xl px-5 py-4 text-[11px] font-black uppercase tracking-widest transition-all duration-200 ${
                  isActive('/plan')
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                    : 'hover:bg-slate-50 hover:text-slate-900 text-slate-400'
                }`}
              >
                <ShoppingCart className={`h-5 w-5 ${isActive('/plan') ? 'text-white' : 'text-slate-300 group-hover:text-slate-500'}`} />
                Penentuan Jumlah Pembelian Barang
              </Link>

              <Link
                to="/data"
                onClick={() => setIsOpen(false)}
                className={`group flex items-center gap-4 rounded-2xl px-5 py-4 text-[11px] font-black uppercase tracking-widest transition-all duration-200 ${
                  isActive('/data')
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                    : 'hover:bg-slate-50 hover:text-slate-900 text-slate-400'
                }`}
              >
                <Table className={`h-5 w-5 ${isActive('/data') ? 'text-white' : 'text-slate-300 group-hover:text-slate-500'}`} />
                Data Historis
              </Link>
            </>
          )}

          {/* Employee-only: POS */}
          {!isOwner && (
            <Link
              to="/pos"
              onClick={() => setIsOpen(false)}
              className={`group flex items-center gap-4 rounded-2xl px-5 py-4 text-[11px] font-black uppercase tracking-widest transition-all duration-200 ${
                isActive('/pos')
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                  : 'hover:bg-slate-50 hover:text-slate-900 text-slate-400'
              }`}
            >
              <ShoppingCart className={`h-5 w-5 ${isActive('/pos') ? 'text-white' : 'text-slate-300 group-hover:text-slate-500'}`} />
              POS
            </Link>
          )}

          {/* Data Master - Dropdown (for both roles) */}
          <div>
            <button
              onClick={() => setDataMasterOpen(!dataMasterOpen)}
              className={`group flex items-center justify-between w-full rounded-2xl px-5 py-4 text-[11px] font-black uppercase tracking-widest transition-all duration-200 ${
                isDataMasterActive
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'hover:bg-slate-50 hover:text-slate-900 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-4">
                <Database className={`h-5 w-5 ${isDataMasterActive ? 'text-indigo-500' : 'text-slate-300 group-hover:text-slate-500'}`} />
                Data Master
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${dataMasterOpen ? 'rotate-180' : ''} ${isDataMasterActive ? 'text-indigo-500' : 'text-slate-300'}`} />
            </button>

            {/* Submenu */}
            {dataMasterOpen && (
              <div className="ml-6 mt-2 space-y-1">
                {dataMasterLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-all duration-200 ${
                      isActive(link.path)
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'hover:bg-slate-50 hover:text-slate-900 text-slate-400'
                    }`}
                  >
                    <link.icon className={`h-4 w-4 ${isActive(link.path) ? 'text-white' : 'text-slate-300 group-hover:text-slate-500'}`} />
                    {link.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* User Info & Logout */}
        <div className="p-8 bg-slate-50/50 border-t border-slate-100">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-slate-900 font-heading font-black border border-slate-200 text-xl tracking-tighter shadow-sm">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-sm font-heading font-extrabold text-slate-900 tracking-tighter uppercase">{user?.name || 'User'}</p>
              <p className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-[0.25em] font-black">{isOwner ? 'Pemilik' : 'Karyawan'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-[10px] font-black text-slate-400 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all uppercase tracking-widest"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
