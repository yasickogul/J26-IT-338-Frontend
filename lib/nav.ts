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

export const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', href: '/overview', icon: Home, roles: ['lawyer', 'people'] },
  {
    label: 'Legal Document Analysis',
    href: '/legal-document-analysis',
    icon: FileSearch,
    roles: ['people'],
  },
  {
    label: 'Civil Case Analysis',
    href: '/civil-case-analysis',
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
  { label: 'Settings', href: '/settings', icon: Settings, roles: ['lawyer', 'people'] },
]

export function navForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role))
}

export function crumbLabelForPath(pathname: string): string {
  if (pathname.startsWith('/civil-case-analysis/new')) return 'New case analysis'
  if (pathname.startsWith('/civil-case-analysis')) return 'Civil Case Analysis'
  if (pathname.startsWith('/legal-document-analysis/new')) return 'New document analysis'
  if (pathname.startsWith('/legal-document-analysis')) return 'Legal Document Analysis'
  if (pathname.startsWith('/settlement-simulator')) {
    return 'Multi-Agent Deliberation & Settlement Simulator'
  }
  if (pathname.startsWith('/legal-misinformation')) return 'Legal Misinformation Analysis'
  if (pathname.startsWith('/analysis-history')) return 'Analysis History'
  if (pathname.startsWith('/precedent-library')) return 'Precedent Library'
  if (pathname.startsWith('/research-insights')) return 'Research Insights'
  if (pathname.startsWith('/settings')) return 'Settings'
  if (pathname.startsWith('/overview')) return 'Overview'
  return 'Workspace'
}

export function isNavActive(pathname: string, href: string): boolean {
  if (href === '/overview') return pathname === '/overview'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function canAccessPath(role: UserRole, pathname: string): boolean {
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
