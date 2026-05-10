'use client';

import { useState } from 'react';

export interface Tab {
  id: string;
  label: string;
}

export interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  activeTab?: string;
  onTabChange?: (id: string) => void;
  className?: string;
}

export function Tabs({
  tabs,
  defaultTab,
  activeTab: controlledTab,
  onTabChange,
  className = '',
}: TabsProps) {
  const [internalTab, setInternalTab] = useState(defaultTab ?? tabs[0]?.id ?? '');
  const isControlled = controlledTab !== undefined;
  const activeTab = isControlled ? controlledTab : internalTab;

  function handleTabChange(id: string) {
    if (!isControlled) setInternalTab(id);
    onTabChange?.(id);
  }

  return (
    <div
      role="tablist"
      className={`flex gap-1 p-1 bg-bg border border-border rounded-input ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => handleTabChange(tab.id)}
            className={`flex-1 px-[6px] py-2 text-[13px] font-medium rounded-[9px] border-0 cursor-pointer transition-all duration-150 ${
              isActive
                ? 'bg-surface text-accent shadow-xs'
                : 'bg-transparent text-muted hover:text-fg'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
