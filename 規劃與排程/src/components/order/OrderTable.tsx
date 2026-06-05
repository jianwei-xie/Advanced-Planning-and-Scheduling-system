import { Order } from '../../types';
import { DataTable } from '../common';

interface OrderTableProps {
  orders: Order[];
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => void;
}

const getPriorityColor = (priority: number) => {
  if (priority === 1) return 'text-red-600';
  if (priority === 2) return 'text-orange-600';
  if (priority === 3) return 'text-yellow-600';
  if (priority === 4) return 'text-blue-600';
  return 'text-green-600';
};

const getStatusVariant = (status: Order['status']) => {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'scheduled':
      return 'info';
    case 'completed':
      return 'success';
    default:
      return 'default';
  }
};

const getStatusLabel = (status: Order['status']) => {
  switch (status) {
    case 'pending':
      return '待排程';
    case 'scheduled':
      return '已排程';
    case 'completed':
      return '已完成';
    default:
      return status;
  }
};

const formatDueDate = (dueDate: string) => {
  const date = new Date(dueDate);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}-${day}`;
};

export function OrderTable({ orders, onEdit, onDelete }: OrderTableProps) {
  const isOverdue = (order: Order) => {
    const now = new Date();
    return order.status !== 'completed' && new Date(order.dueDate) < now;
  };

  const columns = [
    {
      key: 'id',
      header: '订单ID',
      render: (order: Order) => <span className="font-mono text-sm">{order.id}</span>,
    },
    {
      key: 'productName',
      header: '产品名称',
      render: (order: Order) => {
        return order.productId;
      },
    },
    {
      key: 'quantity',
      header: '数量',
      render: (order: Order) => order.quantity,
    },
    {
      key: 'dueDate',
      header: '交期',
      render: (order: Order) => (
        <span className={isOverdue(order) ? 'text-red-600 font-medium' : ''}>
          {formatDueDate(order.dueDate)}
        </span>
      ),
    },
    {
      key: 'priority',
      header: '优先级',
      render: (order: Order) => (
        <span className={`font-medium ${getPriorityColor(order.priority)}`}>
          {order.priority}
        </span>
      ),
    },
    {
      key: 'status',
      header: '状态',
      render: (order: Order) => (
        <span
          className={`
            inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
            ${
              order.status === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : order.status === 'scheduled'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-green-100 text-green-800'
            }
          `}
        >
          {getStatusLabel(order.status)}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={orders}
      getRowKey={(order) => order.id}
      striped
      actions={[
        { label: '编辑', onClick: onEdit, variant: 'edit' },
        { label: '删除', onClick: onDelete, variant: 'delete' },
      ]}
    />
  );
}