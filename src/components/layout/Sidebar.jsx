import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { THEME, LAYOUT } from '@/constants/ui';
import { LayoutDashboard, FileText, CheckCircle, Users, Box, Hammer, Package, UserCog, ChevronLeft, Briefcase } from 'lucide-react';

const Sidebar = ({ isCollapsed, setIsCollapsed, isHovered, setIsHovered, isAdmin }) => {
  const showFull = !isCollapsed || isHovered;
  const pathname = usePathname();
  
  const allMenuItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, adminOnly: true },
    { name: 'Quotations Draft', href: '/quotations-draft', icon: FileText },
    { name: 'Quotations Approved', href: '/quotations-approved', icon: CheckCircle },
    { name: 'Confirmed Orders', href: '/confirmed-orders', icon: Briefcase },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Materials List', href: '/materials', icon: Box },
    { name: 'Labor & Processes', href: '/labor-rates', icon: Hammer },
    { name: 'Extra Parts List', href: '/bop-library', icon: Package },
    { name: 'User Management', href: '/admin/users', icon: UserCog, adminOnly: true },
  ];

  // Filter items based on role
  const menuItems = allMenuItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <aside 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed left-0 top-0 h-full border-r border-zinc-200 bg-white shadow-xl transition-all duration-300 ease-in-out"
      style={{ 
        zIndex: THEME.Z_INDEX.SIDEBAR, 
        width: showFull ? LAYOUT.SIDEBAR_WIDTH : '80px' 
      }}
    >
      <div 
        className="flex items-center justify-between border-b border-zinc-100 px-4"
        style={{ height: LAYOUT.HEADER_HEIGHT }}
      >
        {showFull && (
          <div className="flex w-full items-center justify-center py-2 h-12">
            <img src="/KE_Logo.png" alt="Kaivalya Engineering" className="h-full w-auto object-contain max-w-[160px]" />
          </div>
        )}
        {!showFull && (
          <div className="mx-auto h-12 w-12 overflow-hidden flex items-center justify-center">
            <img src="/KE_Logo_Minimised_Sidebar.png" alt="Logo" className="h-full w-full object-contain" />
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-400 shadow-sm transition-transform hover:text-brand-primary ${isCollapsed ? 'rotate-180' : ''}`}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>
      
      <nav className="space-y-1 p-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              title={!showFull ? item.name : ''}
              className={`group flex items-center transition-all duration-300 ${
                isActive 
                  ? 'bg-brand-primary text-zinc-950 shadow-lg shadow-brand-primary/40 font-black' 
                  : 'text-zinc-600 hover:bg-brand-primary/10 hover:text-brand-primary'
              } ${!showFull ? 'justify-center rounded-lg p-2.5' : 'rounded-xl px-4 py-3'}`}
              style={showFull ? { fontSize: THEME.FONT_SIZE.BASE } : {}}
            >
              <Icon
                className={`${
                  isActive ? 'text-zinc-950' : 'text-zinc-400 group-hover:text-brand-primary'
                } ${!showFull ? 'h-6 w-6' : 'mr-3 h-5.5 w-5.5'}`}
              />
              {showFull && <span className="overflow-hidden whitespace-nowrap">{item.name}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
