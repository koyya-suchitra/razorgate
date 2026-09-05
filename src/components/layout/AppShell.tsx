import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Bot,
  Store,
  ShieldCheck,
  UserCheck,
  Receipt,
  History,
  SlidersHorizontal,
  ChevronDown,
  Menu,
  X,
  Lock,
  User,
  Sliders,
  CreditCard,
  Shield,
  LogOut,
} from 'lucide-react';
import { useRazorGate } from '../../context/RazorGateContext';
import { useAuth } from '../../context/AuthContext';

interface AppShellProps {
  children: React.ReactNode;
}

const operateRoutes = [
  { path: '/command-center', label: 'Command Center', icon: <LayoutDashboard className="w-4 h-4" /> },
  { path: '/ai-buyer', label: 'AI Buyer', icon: <Bot className="w-4 h-4" /> },
  { path: '/catalog', label: 'Catalog', icon: <Store className="w-4 h-4" /> },
  { path: '/guard', label: 'Transaction Guard', icon: <ShieldCheck className="w-4 h-4" /> },
  { path: '/approvals', label: 'Approvals', icon: <UserCheck className="w-4 h-4" />, badge: true },
];

const observeRoutes = [
  { path: '/transactions', label: 'Transactions', icon: <Receipt className="w-4 h-4" /> },
  { path: '/audit', label: 'Audit Trail', icon: <History className="w-4 h-4" /> },
  { path: '/policies', label: 'Policies', icon: <SlidersHorizontal className="w-4 h-4" /> },
];

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/command-center': { title: 'Command Center', subtitle: 'Monitor and control transactions initiated by your AI buyer.' },
  '/ai-buyer': { title: 'AI Buyer', subtitle: 'Describe what you want to purchase. RazorGate enforces your transaction controls.' },
  '/catalog': { title: 'Catalog', subtitle: 'Structured product and merchant data for AI-driven commerce.' },
  '/guard': { title: 'Transaction Guard', subtitle: 'Every AI-initiated payment passes through RazorGate before money can move.' },
  '/approvals': { title: 'Approvals', subtitle: 'Transactions requiring your authorization.' },
  '/transactions': { title: 'Transactions', subtitle: 'Complete history of AI-initiated transactions and authorization decisions.' },
  '/audit': { title: 'Audit Trail', subtitle: 'Every AI decision and money action is traceable.' },
  '/policies': { title: 'Policies', subtitle: 'Control what your AI buyer is allowed to purchase.' },
  '/account': { title: 'Account', subtitle: 'Your Firebase account details and profile.' },
  '/settings/spending': { title: 'Spending Controls', subtitle: 'Configure limits enforced by the Transaction Guard.' },
  '/settings/payments': { title: 'Payment Settings', subtitle: 'Configure payment execution mode and gateway.' },
  '/settings/security': { title: 'Security', subtitle: 'Manage your authentication and account security.' },
};

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { transactions } = useRazorGate();
  const { displayName, photoURL, initials, logout } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pendingApprovalsCount = transactions.filter(
    (t) => t.decision === 'HUMAN_APPROVAL_REQUIRED' || t.paymentStatus === 'PENDING_APPROVAL'
  ).length;

  const currentPath = location.pathname;
  const pageMeta = pageTitles[currentPath] || { title: 'RazorGate', subtitle: 'Payment Control Plane' };

  const handleSignOut = async () => {
    setProfileDropdownOpen(false);
    await logout();
    navigate('/login');
  };

  const NavButton: React.FC<{
    path: string;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    onClick?: () => void;
  }> = ({ path, label, icon, badge, onClick }) => {
    const isActive = currentPath === path;
    return (
      <button
        onClick={() => { navigate(path); onClick?.(); }}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
          isActive
            ? 'bg-blue-50 text-blue-700 font-semibold'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span className={isActive ? 'text-blue-600' : 'text-slate-400'}>{icon}</span>
          <span>{label}</span>
        </div>
        {badge !== undefined && badge > 0 && (
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-white">
            {badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Persistent Left Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200 bg-white shrink-0 z-30 select-none">
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight text-slate-900 uppercase">RazorGate</div>
            <div className="text-[11px] text-slate-500 font-medium">Payment Control Plane</div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Operate</div>
            <nav className="space-y-0.5">
              {operateRoutes.map((item) => (
                <NavButton
                  key={item.path}
                  path={item.path}
                  label={item.label}
                  icon={item.icon}
                  badge={item.badge ? pendingApprovalsCount : undefined}
                />
              ))}
            </nav>
          </div>

          <div>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Observe</div>
            <nav className="space-y-0.5">
              {observeRoutes.map((item) => (
                <NavButton key={item.path} path={item.path} label={item.label} icon={item.icon} />
              ))}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>System Operational</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 pl-4">Demo Environment</div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-200 bg-white px-6 sm:px-8 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">{pageMeta.title}</h1>
                <span className="hidden md:inline-block text-xs text-slate-300">|</span>
                <span className="hidden md:inline-block text-xs text-slate-500">{pageMeta.subtitle}</span>
              </div>
            </div>
          </div>

          {/* Right Header */}
          <div className="flex items-center gap-3">
            {/* Demo Environment Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              <span>Demo Environment</span>
            </div>

            {/* User Profile Dropdown */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-xs font-medium cursor-pointer"
              >
                {photoURL ? (
                  <img src={photoURL} alt={displayName} className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
                    {initials}
                  </div>
                )}
                <span className="text-slate-800 font-semibold hidden sm:inline">{displayName}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-lg py-1.5 text-xs text-slate-700 z-50">
                  <div className="px-3.5 py-2.5 border-b border-slate-100">
                    <div className="font-bold text-slate-900">{displayName}</div>
                    <div className="text-[11px] text-slate-400">Demo Account</div>
                  </div>

                  <div className="py-1">
                    <DropdownItem
                      icon={<User className="w-3.5 h-3.5 text-slate-400" />}
                      label="Account"
                      onClick={() => { navigate('/account'); setProfileDropdownOpen(false); }}
                    />
                    <DropdownItem
                      icon={<Sliders className="w-3.5 h-3.5 text-slate-400" />}
                      label="Spending Controls"
                      onClick={() => { navigate('/settings/spending'); setProfileDropdownOpen(false); }}
                    />
                    <DropdownItem
                      icon={<CreditCard className="w-3.5 h-3.5 text-slate-400" />}
                      label="Payment Settings"
                      onClick={() => { navigate('/settings/payments'); setProfileDropdownOpen(false); }}
                    />
                    <DropdownItem
                      icon={<Shield className="w-3.5 h-3.5 text-slate-400" />}
                      label="Security"
                      onClick={() => { navigate('/settings/security'); setProfileDropdownOpen(false); }}
                    />
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <DropdownItem
                      icon={<LogOut className="w-3.5 h-3.5 text-slate-400" />}
                      label="Sign out"
                      onClick={handleSignOut}
                      danger
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-slate-200 bg-white p-4 space-y-4 z-30">
            <div>
              <div className="px-3 mb-1.5 text-[10px] font-bold uppercase text-slate-400">Operate</div>
              <div className="space-y-1">
                {operateRoutes.map((item) => (
                  <NavButton
                    key={item.path}
                    path={item.path}
                    label={item.label}
                    icon={item.icon}
                    badge={item.badge ? pendingApprovalsCount : undefined}
                    onClick={() => setMobileMenuOpen(false)}
                  />
                ))}
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <div className="px-3 mb-1.5 text-[10px] font-bold uppercase text-slate-400">Observe</div>
              <div className="space-y-1">
                {observeRoutes.map((item) => (
                  <NavButton
                    key={item.path}
                    path={item.path}
                    label={item.label}
                    icon={item.icon}
                    onClick={() => setMobileMenuOpen(false)}
                  />
                ))}
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>System Operational — Demo Environment</span>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
};

const DropdownItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}> = ({ icon, label, onClick, danger }) => (
  <button
    onClick={onClick}
    className={`w-full px-3.5 py-1.5 text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors ${
      danger ? 'text-red-600 hover:text-red-700' : ''
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);
