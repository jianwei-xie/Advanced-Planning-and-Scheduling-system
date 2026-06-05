import { useEffect, useState } from 'react';
import { Order } from '../../types';
import { FormInput, FormSelect, Modal } from '../common';

interface OrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: OrderFormData) => void;
  initialData?: Order | null;
}

export interface OrderFormData {
  productId: string;
  quantity: number;
  dueDate: string;
  priority: 1 | 2 | 3 | 4 | 5;
  status: Order['status'];
}

interface ProductOption {
  value: string;
  label: string;
}

interface PriorityOption {
  value: string;
  label: string;
}

interface StatusOption {
  value: string;
  label: string;
}

export function OrderForm({ isOpen, onClose, onSubmit, initialData }: OrderFormProps) {
  const [formData, setFormData] = useState<OrderFormData>({
    productId: '',
    quantity: 1,
    dueDate: '',
    priority: 3,
    status: 'pending',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        productId: initialData.productId,
        quantity: initialData.quantity,
        dueDate: initialData.dueDate,
        priority: initialData.priority,
        status: initialData.status,
      });
    } else {
      setFormData({
        productId: '',
        quantity: 1,
        dueDate: '',
        priority: 3,
        status: 'pending',
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const productOptions: ProductOption[] = [
    { value: 'P001', label: '产品A' },
    { value: 'P002', label: '产品B' },
    { value: 'P003', label: '产品C' },
  ];

  const priorityOptions: PriorityOption[] = [
    { value: '1', label: '1 - 最高' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '4', label: '4' },
    { value: '5', label: '5 - 最低' },
  ];

  const statusOptions: StatusOption[] = [
    { value: 'pending', label: '待排程' },
    { value: 'scheduled', label: '已排程' },
    { value: 'completed', label: '已完成' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? '编辑订单' : '添加订单'}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormSelect
          label="产品"
          options={productOptions}
          value={formData.productId}
          onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
          placeholder="请选择产品"
          required
        />
        <FormInput
          label="数量"
          type="number"
          min={1}
          value={formData.quantity}
          onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
          required
        />
        <FormInput
          label="交期"
          type="date"
          value={formData.dueDate}
          onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          required
        />
        <FormSelect
          label="优先级"
          options={priorityOptions}
          value={String(formData.priority)}
          onChange={(e) =>
            setFormData({ ...formData, priority: Number(e.target.value) as 1 | 2 | 3 | 4 | 5 })
          }
          required
        />
        {initialData && (
          <FormSelect
            label="状态"
            options={statusOptions}
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value as Order['status'] })
            }
            required
          />
        )}
        <div className="flex justify-end gap-3 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            {initialData ? '保存' : '添加'}
          </button>
        </div>
      </form>
    </Modal>
  );
}