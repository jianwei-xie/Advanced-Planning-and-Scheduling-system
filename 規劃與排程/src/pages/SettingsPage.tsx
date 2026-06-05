import { useState, useRef } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useSettingsStore } from '../stores';
import { useOrderStore } from '../stores';
import { useProductStore } from '../stores';
import { useProductionLineStore } from '../stores';
import { useScheduleStore } from '../stores';

const SYSTEM_VERSION = '1.0.0';

const TECH_STACK = [
  'React 18 + TypeScript',
  'Vite',
  'Tailwind CSS',
  'Zustand',
  'React Router',
  'date-fns',
];

export function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettingsStore();
  const orderStore = useOrderStore();
  const productStore = useProductStore();
  const productionLineStore = useProductionLineStore();
  const scheduleStore = useScheduleStore();

  const [startTime, setStartTime] = useState(
    String(settings.workingHoursStart).padStart(2, '0') + ':00'
  );
  const [endTime, setEndTime] = useState(
    String(settings.workingHoursEnd).padStart(2, '0') + ':00'
  );
  const [weights, setWeights] = useState(settings.weights);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStartTimeChange = (value: string) => {
    setStartTime(value);
    const hours = parseInt(value.split(':')[0], 10);
    if (!isNaN(hours) && hours >= 0 && hours <= 23) {
      updateSettings({ workingHoursStart: hours });
    }
  };

  const handleEndTimeChange = (value: string) => {
    setEndTime(value);
    const hours = parseInt(value.split(':')[0], 10);
    if (!isNaN(hours) && hours >= 0 && hours <= 23) {
      updateSettings({ workingHoursEnd: hours });
    }
  };

  const handleWeightChange = (key: keyof typeof weights, value: number) => {
    const newWeights = { ...weights, [key]: value };
    setWeights(newWeights);
    updateSettings({ weights: newWeights });
  };

  const normalizeWeights = () => {
    const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
    if (total === 0) return;
    const normalized = {
      makespan: Math.round((weights.makespan / total) * 100) / 100,
      priority: Math.round((weights.priority / total) * 100) / 100,
      loadBalance: Math.round((weights.loadBalance / total) * 100) / 100,
      delivery: Math.round((weights.delivery / total) * 100) / 100,
    };
    setWeights(normalized);
    updateSettings({ weights: normalized });
  };

  const handleResetData = () => {
    if (confirm('确定要重置所有数据吗？这将恢复默认测试数据。')) {
      resetSettings();
      localStorage.removeItem('order-storage');
      localStorage.removeItem('product-storage');
      localStorage.removeItem('production-line-storage');
      localStorage.removeItem('schedule-storage');
      window.location.reload();
    }
  };

  const handleImportData = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.orders) orderStore.orders = data.orders;
        if (data.products) productStore.products = data.products;
        if (data.productionLines) productionLineStore.productionLines = data.productionLines;
        if (data.scheduleResults) scheduleStore.scheduleResults = data.scheduleResults;
        if (data.settings) {
          resetSettings();
          updateSettings(data.settings);
          setWeights(data.settings.weights);
          setStartTime(String(data.settings.workingHoursStart).padStart(2, '0') + ':00');
          setEndTime(String(data.settings.workingHoursEnd).padStart(2, '0') + ':00');
        }
        setImportMessage({ type: 'success', text: '数据导入成功！' });
        setTimeout(() => setImportMessage(null), 3000);
      } catch {
        setImportMessage({ type: 'error', text: '数据格式错误，导入失败。' });
        setTimeout(() => setImportMessage(null), 3000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportData = () => {
    const exportData = {
      orders: orderStore.orders,
      products: productStore.products,
      productionLines: productionLineStore.productionLines,
      scheduleResults: scheduleStore.scheduleResults,
      settings: useSettingsStore.getState().settings,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">系统设置</h1>

      <div className="space-y-6">
        <Card title="工作时间配置">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                工作开始时间
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                工作结束时间
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => handleEndTimeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </Card>

        <Card title="算法权重配置">
          <div className="space-y-6">
            {[
              { key: 'makespan' as const, label: '最小化完工时间 (Makespan)', value: weights.makespan },
              { key: 'priority' as const, label: '优先级权重', value: weights.priority },
              { key: 'loadBalance' as const, label: '负荷均衡权重', value: weights.loadBalance },
              { key: 'delivery' as const, label: '拖期最小化权重', value: weights.delivery },
            ].map(({ key, label, value }) => (
              <div key={key}>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">{label}</label>
                  <span className="text-sm font-mono text-gray-600">{value.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={value}
                  onChange={(e) => handleWeightChange(key, parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            ))}
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-gray-500">
                权重总和: {Object.values(weights).reduce((sum, w) => sum + w, 0).toFixed(1)}
              </span>
              <Button variant="secondary" size="sm" onClick={normalizeWeights}>
                归一化
              </Button>
            </div>
          </div>
        </Card>

        <Card title="数据管理">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleImportData}>
                导入数据
              </Button>
              <Button variant="danger" onClick={handleResetData}>
                重置数据
              </Button>
              <Button variant="secondary" onClick={handleExportData}>
                导出所有数据
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            {importMessage && (
              <div
                className={`text-sm ${
                  importMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {importMessage.text}
              </div>
            )}
          </div>
        </Card>

        <Card title="版本信息">
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700 w-24">系统版本:</span>
              <span className="text-sm text-gray-600">{SYSTEM_VERSION}</span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700 block mb-2">技术栈:</span>
              <div className="flex flex-wrap gap-2">
                {TECH_STACK.map((tech) => (
                  <span
                    key={tech}
                    className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
