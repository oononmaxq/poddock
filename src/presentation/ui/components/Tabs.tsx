import { useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';

interface Tab {
  id: string;
  label: string;
  content: ComponentChildren;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
}

export function Tabs({ tabs, defaultTab, onTabChange }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  return (
    <div>
      <div className="tabs tabs-boxed mb-6">
        {tabs.map((tab) => (
          <a
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
            onClick={() => handleTabClick(tab.id)}
          >
            {tab.label}
          </a>
        ))}
      </div>
      <div>
        {tabs.map((tab) => (
          <div key={tab.id} style={{ display: activeTab === tab.id ? 'block' : 'none' }}>
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
}
