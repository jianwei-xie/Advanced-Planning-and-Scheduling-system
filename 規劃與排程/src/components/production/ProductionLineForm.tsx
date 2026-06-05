import { FormInput } from '../common/FormInput';
import { FormSelect } from '../common/FormSelect';
import type { ProductionLine, ProductionLineStatus } from '../../types';

const CAPABILITIES = [
  '下料',
  '冲压',
  '折弯',
  '点焊',
  '弧焊',
  '铆接',
  '喷涂',
  '烘干',
  '组装',
  '包装',
];

interface ProductionLineFormProps {
  initialData?: ProductionLine;
  onSubmit: (data: Omit<ProductionLine, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export function ProductionLineForm({ initialData, onSubmit, onCancel }: ProductionLineFormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const capabilities = CAPABILITIES.filter((cap) =>
      formData.getAll('capabilities').includes(cap)
    );

    onSubmit({
      name: formData.get('name') as string,
      capabilities,
      status: formData.get('status') as ProductionLineStatus,
      loadCapacity: Number(formData.get('loadCapacity')),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormInput
        label="产线名称"
        name="name"
        defaultValue={initialData?.name}
        required
      />

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-gray-700">能力列表</span>
        <div className="grid grid-cols-2 gap-2">
          {CAPABILITIES.map((cap) => (
            <label key={cap} className="flex items-center gap-2">
              <input
                type="checkbox"
                name="capabilities"
                value={cap}
                defaultChecked={initialData?.capabilities.includes(cap)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{cap}</span>
            </label>
          ))}
        </div>
      </div>

      <FormInput
        label="日产能小时数"
        name="loadCapacity"
        type="number"
        min={1}
        max={24}
        defaultValue={initialData?.loadCapacity ?? 8}
        required
      />

      <FormSelect
        label="状态"
        name="status"
        options={[
          { value: 'active', label: '生产中' },
          { value: 'maintenance', label: '维护中' },
        ]}
        defaultValue={initialData?.status ?? 'active'}
        required
      />

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
        >
          取消
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
        >
          {initialData ? '保存' : '添加'}
        </button>
      </div>
    </form>
  );
}
