'use client'
import { ReactNode } from 'react'

export interface KotaTab {
  id: string
  label: string
  icon: ReactNode
  badge?: boolean
}

interface KotaShellProps {
  tabs: KotaTab[]
  activeTab: string
  onTabChange: (id: string) => void
  children: ReactNode
  tabContent: Record<string, ReactNode>
}

export function KotaShell({ tabs, activeTab, onTabChange, tabContent }: KotaShellProps) {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Tab viewport */}
      <div className="flex-1 pb-[72px]">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`${activeTab === tab.id ? 'block' : 'hidden'} min-h-full`}
          >
            {tabContent[tab.id]}
          </div>
        ))}
      </div>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-[72px] bg-white/90 backdrop-blur-md border-t border-border flex items-stretch justify-around px-2 pt-2 pb-3 gap-1 z-50 max-w-[480px] mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex-1 flex flex-col items-center justify-center gap-1 rounded-[14px] transition-all duration-150 ${
                isActive ? 'text-accent bg-accent-light' : 'text-muted bg-transparent hover:bg-bg'
              }`}
            >
              <span className="flex items-center justify-center w-[22px] h-[22px]">{tab.icon}</span>
              <span className="text-[11px] font-semibold tracking-[0.1px]">{tab.label}</span>
              {tab.badge && !isActive && (
                <span className="absolute top-1.5 right-3.5 w-[7px] h-[7px] rounded-full bg-red border-2 border-surface" />
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
