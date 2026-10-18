import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  CircleHelp,
  FileSearch,
  History,
  Home,
  Library,
  Scale,
  Settings,
  ShieldCheck,
} from 'lucide-react'

export type UserRole = 'lawyer' | 'people'

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  roles: UserRole[]
}

export const lawyerPaths = {
  home: '/lawyer',
  overview: '/lawyer/overview',
  civilCaseAnalysis: '/lawyer/civil-case-analysis',
  newCivilCaseAnalysis: '/lawyer/civil-case-analysis/new',
  intakeResult: (intakeId: string) => `/lawyer/civil-case-analysis/${encodeURIComponent(intakeId)}`,
  settings: '/lawyer/settings',
} as const

export const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', href: lawyerPaths.overview, icon: Home, roles: ['lawyer'] },
  { label: 'Overview', href: '/overview', icon: Home, roles: ['people'] },
  {
    label: 'Legal Document Analysis',
    href: '/legal-document-analysis',
    icon: FileSearch,
    roles: ['people'],
  },
  {
    label: 'Civil Case Analysis',
    href: lawyerPaths.civilCaseAnalysis,
    icon: Scale,
    roles: ['lawyer'],
  },
  {
    label: 'Multi-Agent Deliberation & Settlement Simulator',
    href: '/settlement-simulator',
    icon: CircleHelp,
    roles: ['people'],
  },
  {
    label: 'Legal Misinformation Analysis',
    href: '/legal-misinformation',
    icon: ShieldCheck,
    roles: ['people'],
  },
  { label: 'Analysis History', href: '/analysis-history', icon: History, roles: ['people'] },
  { label: 'Precedent Library', href: '/precedent-library', icon: Library, roles: ['people'] },
  { label: 'Research Insights', href: '/research-insights', icon: BarChart3, roles: ['people'] },
  { label: 'Settings', href: lawyerPaths.settings, icon: Settings, roles: ['lawyer'] },
  { label: 'Settings', href: '/settings', icon: Settings, roles: ['people'] },
]

export function navForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role))
}

export function homePathForRole(role: UserRole): string {
  return role === 'lawyer' ? lawyerPaths.overview : '/overview'
}

function withoutLawyerPrefix(pathname: string): string {
  if (pathname === '/lawyer') return '/'
  if (pathname.startsWith('/lawyer/')) return pathname.slice('/lawyer'.length)
  return pathname
}

export function crumbLabelForPath(pathname: string): string {
  const path = withoutLawyerPrefix(pathname)
  if (path.startsWith('/civil-case-analysis/new')) return 'New case analysis'
  if (/^\/civil-case-analysis\/[^/]+$/.test(path)) return 'Case intake result'
  if (path.startsWith('/civil-case-analysis')) return 'Civil Case Analysis'
  if (path.startsWith('/legal-document-analysis/new')) return 'New document analysis'
  if (path.startsWith('/legal-document-analysis')) return 'Legal Document Analysis'
  if (path.startsWith('/settlement-simulator')) {
    return 'Multi-Agent Deliberation & Settlement Simulator'
  }
  if (path.startsWith('/legal-misinformation')) return 'Legal Misinformation Analysis'
  if (path.startsWith('/analysis-history')) return 'Analysis History'
  if (path.startsWith('/precedent-library')) return 'Precedent Library'
  if (path.startsWith('/research-insights')) return 'Research Insights'
  if (path.startsWith('/settings')) return 'Settings'
  if (path.startsWith('/overview')) return 'Overview'
  return 'Workspace'
}

export function isNavActive(pathname: string, href: string): boolean {
  if (href === '/overview' || href === lawyerPaths.overview) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

function isLawyerSection(pathname: string): boolean {
  const path = withoutLawyerPrefix(pathname)
  return (
    path === '/' ||
    path === '/overview' ||
    path.startsWith('/overview/') ||
    path === '/civil-case-analysis' ||
    path.startsWith('/civil-case-analysis/') ||
    path === '/settings' ||
    path.startsWith('/settings/')
  )
}

export function canAccessPath(role: UserRole, pathname: string): boolean {
  if (pathname === '/lawyer' || pathname.startsWith('/lawyer/')) {
    // Block reserved static segment collisions are handled by the App Router;
    // any /lawyer/civil-case-analysis/* path is lawyer-only Stage 2 UI.
    return role === 'lawyer' && isLawyerSection(pathname)
  }
  if (pathname.startsWith('/civil-case-analysis')) return role === 'lawyer'
  if (
    pathname.startsWith('/legal-document-analysis') ||
    pathname.startsWith('/settlement-simulator') ||
    pathname.startsWith('/legal-misinformation') ||
    pathname.startsWith('/analysis-history') ||
    pathname.startsWith('/precedent-library') ||
    pathname.startsWith('/research-insights')
  ) {
    return role === 'people'
  }
  return pathname.startsWith('/overview') || pathname.startsWith('/settings')
}
