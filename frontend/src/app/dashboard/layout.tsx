'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userInitial, setUserInitial] = useState<string>('?');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }

    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserRole(user.role);
      setUserInitial(user.firstName ? user.firstName.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase());
    }

    // Check local storage for dark mode preference
    if (localStorage.getItem('theme') === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [router]);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const isActive = (path: string) => pathname === path;

  // Map paths to readable titles
  const getPageTitle = (path: string) => {
    if (path === '/dashboard') return 'Dashboard';
    if (path.includes('/projects')) return 'Projects';
    if (path.includes('/tasks')) return 'Tasks';
    if (path.includes('/teams')) return 'Teams';
    if (path.includes('/issues')) return 'Issues';
    if (path.includes('/settings')) return 'Settings';
    if (path.includes('/users')) return 'Users';
    return 'Dashboard';
  };

  return (
    <div className={`min-h-screen flex bg-blue-50/50 dark:bg-gray-900 font-sans text-gray-800 dark:text-gray-100 selection:bg-brand-cyan selection:text-white transition-colors duration-300`}>

      {/* Slim/Expanded Navigation Rail */}
      <aside
        className={`${isSidebarExpanded ? 'w-64' : 'w-20'} bg-gray-900 border-r border-gray-800 flex flex-col items-center py-6 fixed inset-y-0 left-0 z-30 shadow-2xl transition-all duration-300 ease-in-out`}
      >
        {/* Logo & Expand Toggle */}
        <div className="w-full flex items-center justify-between px-4 mb-8">
          <div className={`w-10 h-10 bg-linear-to-br from-brand-cyan to-brand-teal rounded-xl flex items-center justify-center text-white shadow-lg cursor-pointer hover:rotate-12 transition-transform duration-300 shrink-0`}>
            <LogoIcon className="w-6 h-6" />
          </div>

          {isSidebarExpanded && (
            <span className="font-bold text-white tracking-wider ml-3 animate-fade-in truncate">PM System</span>
          )}

          <button
            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
            className="w-6 h-6 rounded-full bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center hover:bg-gray-700 transition-all absolute -right-3 top-8 border border-gray-700 shadow-md transform hover:scale-110"
          >
            {isSidebarExpanded ? <ChevronLeftIcon className="w-3 h-3" /> : <ChevronRightIcon className="w-3 h-3" />}
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 flex flex-col gap-2 w-full px-3 overflow-y-auto scrollbar-hide">
          {/* {userRole !== 'admin' && (
            <>
              <TooltipNavItem href="/dashboard" icon={<DashboardIcon />} label="Home" active={isActive('/dashboard')} expanded={isSidebarExpanded} />
              <TooltipNavItem href="/dashboard/projects" icon={<FolderIcon />} label="Projects" active={isActive('/dashboard/projects')} expanded={isSidebarExpanded} />
              <TooltipNavItem href="/dashboard/tasks" icon={<ListIcon />} label="My Tasks" active={isActive('/dashboard/tasks')} expanded={isSidebarExpanded} />
              <TooltipNavItem href="/dashboard/teams" icon={<UsersIcon />} label="Teams" active={isActive('/dashboard/teams')} expanded={isSidebarExpanded} />
              <TooltipNavItem href="/dashboard/issues" icon={<BugIcon />} label="Issues" active={isActive('/dashboard/issues')} expanded={isSidebarExpanded} />

              <div className="my-2 border-t border-gray-800 w-full"></div>
            </>
          )}

          {(userRole === 'admin') && (
            <TooltipNavItem href="/dashboard/admin/users" icon={<AdminIcon />} label="User Management" active={isActive('/dashboard/admin/users')} expanded={isSidebarExpanded} />
          )} */}

          {userRole === 'admin' ? (
            <TooltipNavItem href="/dashboard/admin/users" icon={<AdminIcon />} label="User Management" active={isActive('/dashboard/admin/users')} expanded={isSidebarExpanded} />
          ) : userRole === 'user' ? (
              <>
              <TooltipNavItem href="/dashboard" icon={<DashboardIcon />} label="Home" active={isActive('/dashboard')} expanded={isSidebarExpanded} />
              <TooltipNavItem href="/dashboard/tasks" icon={<ListIcon />} label="My Tasks" active={isActive('/dashboard/tasks')} expanded={isSidebarExpanded} />
              <TooltipNavItem href="/dashboard/issues" icon={<BugIcon />} label="Issues" active={isActive('/dashboard/issues')} expanded={isSidebarExpanded} />

              <div className="my-2 border-t border-gray-800 w-full"></div>
            </>
          ) : ( // comment --> userRole != admin & user
            <>
              <TooltipNavItem href="/dashboard" icon={<DashboardIcon />} label="Home" active={isActive('/dashboard')} expanded={isSidebarExpanded} />
              <TooltipNavItem href="/dashboard/projects" icon={<FolderIcon />} label="Projects" active={isActive('/dashboard/projects')} expanded={isSidebarExpanded} />
              <TooltipNavItem href="/dashboard/tasks" icon={<ListIcon />} label="My Tasks" active={isActive('/dashboard/tasks')} expanded={isSidebarExpanded} />
              <TooltipNavItem href="/dashboard/teams" icon={<UsersIcon />} label="Teams" active={isActive('/dashboard/teams')} expanded={isSidebarExpanded} />
              <TooltipNavItem href="/dashboard/issues" icon={<BugIcon />} label="Issues" active={isActive('/dashboard/issues')} expanded={isSidebarExpanded} />

              <div className="my-2 border-t border-gray-800 w-full"></div>
            </>
          )}



          <TooltipNavItem href="/dashboard/settings" icon={<SettingsIcon />} label="Settings" active={isActive('/dashboard/settings')} expanded={isSidebarExpanded} />
        </nav>

        {/* Bottom Actions */}
        <div className="mt-auto flex flex-col gap-4 w-full px-3 items-center">

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className={`w-full flex items-center ${isSidebarExpanded ? 'justify-start px-3' : 'justify-center'} py-2 rounded-xl text-gray-400 hover:bg-gray-800/50 hover:text-brand-yellow transition-all`}
            title="Toggle Dark Mode"
          >
            {isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            {isSidebarExpanded && <span className="ml-3 text-sm font-medium">Theme</span>}
          </button>

          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${isSidebarExpanded ? 'justify-start px-3' : 'justify-center'} py-2 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all`}
            title="Logout"
          >
            <LogoutIcon className="w-5 h-5" />
            {isSidebarExpanded && <span className="ml-3 text-sm font-medium">Logout</span>}
          </button>

          {/* User Avatar */}
          <div className={`w-full flex items-center ${isSidebarExpanded ? 'justify-start px-3 py-2 bg-gray-800/50 rounded-xl' : 'justify-center'} mt-2`}>
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-brand-peach to-brand-yellow flex items-center justify-center text-gray-900 font-bold text-xs shrink-0 border border-gray-700">
              {userInitial}
            </div>
            {isSidebarExpanded && (
              <div className="ml-3 truncate">
                <p className="text-sm font-bold text-white truncate">My Account</p>
                <p className={`text-xs truncate capitalize ${userRole === 'admin' ? 'text-brand-peach' : 'text-brand-cyan'}`}>
                  {userRole?.replace('_', ' ')}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Layout Content */}
      <div className={`flex-1 ${isSidebarExpanded ? 'ml-64' : 'ml-20'} flex flex-col min-h-screen transition-all duration-300 ease-in-out`}>

        {/* Top Context Bar */}
        <header className="h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20 px-8 flex items-center justify-between transition-colors duration-300">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-black text-gray-800 dark:text-gray-100 tracking-tight transition-colors">{getPageTitle(pathname)}</h1>
            {/* Breadcrumb-ish indicator */}
            <div className="hidden md:flex items-center text-xs font-bold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full uppercase tracking-wider transition-colors">
              {userRole?.replace('_', ' ') || 'Guest'} Mode
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Search Bar */}
            <div className="relative hidden md:block group">
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 w-64 bg-gray-100 dark:bg-gray-800 border-transparent rounded-xl text-sm font-medium focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-brand-cyan focus:outline-none transition-all dark:text-white"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-cyan transition-colors">
                <SearchIcon className="w-4 h-4" />
              </div>
            </div>

            <button className="relative w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-brand-cyan dark:hover:text-brand-cyan transition-all">
              <BellIcon className="w-5 h-5" />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-y-auto bg-linear-to-br from-blue-50/50 via-white to-cyan-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 transition-colors duration-300">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function TooltipNavItem({ href, icon, label, active, expanded }: { href: string, icon: React.ReactNode, label: string, active: boolean, expanded: boolean }) {
  return (
    <Link
      href={href}
      className={`group flex items-center ${expanded ? 'justify-start px-3' : 'justify-center'} w-full py-0.5 relative`}
    >
      <div className={`
                ${expanded ? 'w-full h-10 px-3 gap-3 rounded-lg' : 'w-10 h-10 rounded-xl'} 
                flex items-center 
                ${!expanded && 'justify-center'}
                transition-all duration-200
                ${active
          ? 'bg-linear-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
          : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
            `}>
        <div className={`${expanded ? 'w-5 h-5' : 'w-6 h-6'} transition-all`}>{icon}</div>

        {expanded && (
          <span className={`text-sm font-bold ${active ? 'text-white' : 'text-gray-300 group-hover:text-white'} animate-fade-in whitespace-nowrap`}>
            {label}
          </span>
        )}
      </div>

      {/* Tooltip (Fixed Position to avoid clipping) */}
      {!expanded && (
        <div className="fixed left-24 px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[100] border border-gray-700 shadow-xl hidden group-hover:block">
          {label}
          {/* Arrow */}
          <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45 border-l border-b border-gray-700"></div>
        </div>
      )}
    </Link>
  );
}

// Icons
function LogoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  )
}

function DashboardIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="3" y="3" width="7" height="7" rx="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="14" y="3" width="7" height="7" rx="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="14" y="14" width="7" height="7" rx="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="3" y="14" width="7" height="7" rx="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

function BugIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 14.5v.01M12 13c0 2-2 2-2 5h4c0-3-2-3-2-5zm0-2c2.5 0 5-2.5 5-5S14.5 1 12 1 7 3.5 7 6s2.5 5 5 5z" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function AdminIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  )
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
    </svg>
  )
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
    </svg>
  )
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  )
}
