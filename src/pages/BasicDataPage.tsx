import { useState } from 'react';
import { ProductionLinePage } from '../components/production';
import { ProductPage } from '../components/product';
import { OrderPage } from '../components/order';
import { MaterialPage } from '../components/replenishment';

type TabKey = 'production-line' | 'product' | 'order' | 'material';

interface TabItem {
  key: TabKey;
  label: string;
  component: React.ReactNode;
}

const tabs: TabItem[] = [
  { key: 'production-line', label: '产线管理', component: <ProductionLinePage /> },
  { key: 'product', label: '产品工艺', component: <ProductPage /> },
  { key: 'order', label: '订单管理', component: <OrderPage /> },
  { key: 'material', label: '物料管理', component: <MaterialPage /> },
];

export function BasicDataPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('production-line');

  const activeComponent = tabs.find((tab) => tab.key === activeTab)?.component;

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-200 bg-white">
        <nav className="flex space-x-8 px-4" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              aria-current={activeTab === tab.key ? 'page' : undefined}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="flex-1 overflow-auto">
        {activeComponent}
      </div>
    </div>
  );
}
