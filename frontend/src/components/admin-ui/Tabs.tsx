// components/ui/Tabs.tsx
// ── Accessible tabs component ──

import React, { useState } from 'react';

interface Tab {
  key: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (key: string) => void;
}

export default function Tabs({ tabs, defaultTab, onChange }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.key || '');

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    onChange?.(key);
  };

  return (
    <div>
      {/* Tab headers */}
      <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-[1px] ${
              activeTab === tab.key
                ? 'border-current'
                : 'border-transparent hover:text-current'
            }`}
            style={{
              color: activeTab === tab.key ? 'var(--primary)' : 'var(--text-secondary)',
              borderColor: activeTab === tab.key ? 'var(--primary)' : 'transparent',
            }}
            role="tab"
            aria-selected={activeTab === tab.key}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="pt-4">
        {tabs.find((tab) => tab.key === activeTab)?.content}
      </div>
    </div>
  );
}