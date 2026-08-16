import { Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import {
  LayoutDashboard,
  ShoppingCart,
  ScanLine,
  Users,
  IdCard,
  Handshake,
  Ticket,
  BarChart3,
  Wallet,
  UserCog,
  Settings,
  Menu,
  X,
  LogOut,
  Waves,
} from 'lucide-react'
import type { SessionUser } from '@/lib/session.server'
import { logout } from '@/server/auth.functions'
import { ROLE_LABELS } from '@/lib/roles'

type NavItem = {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  roles: SessionUser['role'][]
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Panel', icon: LayoutDashboard, roles: ['admin', 'encargado', 'control_ingreso', 'consulta'] },
  { to: '/venta', label: 'Venta rápida', icon: ShoppingCart, roles: ['admin', 'encargado'] },
  { to: '/ingreso', label: 'Control de ingreso', icon: ScanLine, roles: ['admin', 'encargado', 'control_ingreso'] },
  { to: '/personas', label: 'Personas', icon: Users, roles: ['admin', 'encargado', 'consulta'] },
  { to: '/socios', label: 'Socios', icon: IdCard, roles: ['admin', 'encargado', 'consulta'] },
  { to: '/convenios', label: 'Convenios', icon: Handshake, roles: ['admin', 'consulta'] },
  { to: '/planes', label: 'Planes y tarifas', icon: Ticket, roles: ['admin'] },
  { to: '/reportes', label: 'Reportes', icon: BarChart3, roles: ['admin', 'consulta'] },
  { to: '/caja', label: 'Cierre de caja', icon: Wallet, roles: ['admin'] },
  { to: '/usuarios', label: 'Usuarios', icon: UserCog, roles: ['admin'] },
  { to: '/config', label: 'Configuración', icon: Settings, roles: ['admin'] },
]

export function AppShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const items = NAV_ITEMS.filter((i) => i.roles.includes(user.role))

  async function handleLogout() {
    await logout()
    await router.navigate({ to: '/login' })
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 bg-blue-900 text-white flex items-center justify-between px-4 py-3 shadow">
        <div className="flex items-center gap-2">
          <Waves className="w-5 h-5 text-red-400" />
          <span className="font-semibold text-sm">Natatorio Estudiantes</span>
        </div>
        <button onClick={() => setOpen(!open)} aria-label="Menú" className="p-1">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar */}
      <nav
        className={`${open ? 'block' : 'hidden'} md:block md:w-60 shrink-0 bg-blue-900 text-white md:min-h-screen`}
      >
        <div className="hidden md:flex items-center gap-2 px-5 py-5 border-b border-blue-800">
          <Waves className="w-6 h-6 text-red-400" />
          <div>
            <p className="font-bold leading-tight text-sm">Club Atlético Estudiantes</p>
            <p className="text-blue-300 text-xs">Natatorio</p>
          </div>
        </div>
        <ul className="py-2">
          {items.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                onClick={() => setOpen(false)}
                activeOptions={{ exact: item.to === '/' }}
                className="flex items-center gap-3 px-5 py-3 text-sm text-blue-100 hover:bg-blue-800 transition-colors [&.active]:bg-red-700 [&.active]:text-white"
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-auto px-5 py-4 border-t border-blue-800 text-xs text-blue-200">
          <p className="font-medium text-white">{user.fullName}</p>
          <p>{ROLE_LABELS[user.role]}</p>
          <button
            onClick={handleLogout}
            className="mt-3 flex items-center gap-1.5 text-red-300 hover:text-red-200"
          >
            <LogOut className="w-4 h-4" /> Cerrar sesión
          </button>
        </div>
      </nav>

      <main className="flex-1 min-w-0 bg-slate-50">{children}</main>
    </div>
  )
}
