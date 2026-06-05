import { FormInput, FormSelect, Button } from '../common';
import type { Process } from '../../types';

const CAPABILITIES = [
  { value: '下料', label: '下料' },
  { value: '冲压', label: '冲压' },
  { value: '折弯', label: '折弯' },
  { value: '点焊', label: '点焊' },
  { value: '弧焊', label: '弧焊' },
  { value: '铆接', label: '铆接' },
  { value: '喷涂', label: '喷涂' },
  { value: '烘干', label: '烘干' },
  { value: '组装', label: '组装' },
  { value: '包装', label: '包装' },
];

interface ProcessRowProps {
  process: Process;
  index: number;
  onUpdate: (index: number, field: keyof Process, value: string | number) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

function ProcessRow({ process, index, onUpdate, onRemove, canRemove }: ProcessRowProps) {
  return (
    <div className="flex gap-3 items-end">
      <div className="flex-1">
        <FormInput
          label="工序名称"
          value={process.name}
          onChange={(e) => onUpdate(index, 'name', e.target.value)}
          placeholder="请输入工序名称"
        />
      </div>
      <div className="flex-1">
        <FormSelect
          label="所需能力"
          value={process.requiredCapability}
          onChange={(e) => onUpdate(index, 'requiredCapability', e.target.value)}
          options={CAPABILITIES}
          placeholder="选择能力"
        />
      </div>
      <div className="w-28">
        <FormInput
          label="标准工时(h)"
          type="number"
          step="0.1"
          min="0"
          value={process.standardHours}
          onChange={(e) => onUpdate(index, 'standardHours', parseFloat(e.target.value) || 0)}
        />
      </div>
      <div className="w-16">
        <div className="text-sm font-medium text-gray-700">序号</div>
        <div className="px-3 py-2 text-gray-800">{process.sequence}</div>
      </div>
      {canRemove && (
        <Button variant="danger" size="sm" onClick={() => onRemove(index)}>
          删除
        </Button>
      )}
    </div>
  );
}

export interface ProcessFormData {
  name: string;
  requiredCapability: string;
  standardHours: number;
}

interface ProductFormProps {
  productName: string;
  processes: ProcessFormData[];
  onProductNameChange: (name: string) => void;
  onProcessUpdate: (index: number, field: keyof ProcessFormData, value: string | number) => void;
  onProcessRemove: (index: number) => void;
  onAddProcess: () => void;
  onSubmit: () => void;
  onCancel: () => void;
  isEditing: boolean;
}

export function ProductForm({
  productName,
  processes,
  onProductNameChange,
  onProcessUpdate,
  onProcessRemove,
  onAddProcess,
  onSubmit,
  onCancel,
  isEditing,
}: ProductFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormInput
        label="产品名称"
        value={productName}
        onChange={(e) => onProductNameChange(e.target.value)}
        placeholder="请输入产品名称"
        required
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">工序列表</span>
          <Button type="button" variant="secondary" size="sm" onClick={onAddProcess}>
            添加工序
          </Button>
        </div>

        {processes.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-sm">
            暂无工序，请点击「添加工序」添加
          </div>
        ) : (
          <div className="space-y-3">
            {processes.map((process, index) => (
              <ProcessRow
                key={index}
                process={{ ...process, sequence: index + 1 }}
                index={index}
                onUpdate={onProcessUpdate}
                onRemove={onProcessRemove}
                canRemove={processes.length > 1}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit">
          {isEditing ? '保存' : '添加'}
        </Button>
      </div>
    </form>
  );
}

export { CAPABILITIES };
