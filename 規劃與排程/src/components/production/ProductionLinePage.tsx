import { useState, useMemo } from 'react';
import { useProductionLineStore } from '../../stores/productionLineStore';
import { DataTable } from '../common/DataTable';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ProductionLineForm } from './ProductionLineForm';
import type { ProductionLine, ProductionLineStatus } from '../../types';

export function ProductionLinePage() {
  const { productionLines, addLine, updateLine, deleteLine } = useProductionLineStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<ProductionLine | null>(null);
  const [statusFilter, setStatusFilter] = useState<ProductionLineStatus | 'all'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filteredLines = useMemo(() => {
    if (statusFilter === 'all') return productionLines;
    return productionLines.filter((line) => line.status === statusFilter);
  }, [productionLines, statusFilter]);

  const handleAdd = () => {
    setEditingLine(null);
    setIsModalOpen(true);
  };

  const handleEdit = (line: ProductionLine) => {
    setEditingLine(line);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteLine(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  const handleSubmit = (data: Omit<ProductionLine, 'id' | 'createdAt'>) => {
    if (editingLine) {
      updateLine(editingLine.id, data);
    } else {
      const newLine: ProductionLine = {
        ...data,
        id: `PL${String(productionLines.length + 1).padStart(3, '0')}`,
        createdAt: new Date().toISOString(),
      };
      addLine(newLine);
    }
    setIsModalOpen(false);
    setEditingLine(null);
  };

  const columns = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: '产线名称' },
    {
      key: 'capabilities',
      header: '能力列表',
      render: (row: ProductionLine) => (
        <div className="flex flex-wrap gap-1">
          {row.capabilities.map((cap) => (
            <Badge key={cap} variant="default">
              {cap}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'status',
      header: '状态',
      render: (row: ProductionLine) => (
        <Badge variant={row.status === 'active' ? 'success' : 'warning'}>
          {row.status === 'active' ? '生产中' : '维护中'}
        </Badge>
      ),
    },
    { key: 'loadCapacity', header: '日产能' },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">产线管理</h1>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Button onClick={handleAdd}>添加产线</Button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">状态筛选:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ProductionLineStatus | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">全部</option>
              <option value="active">生产中</option>
              <option value="maintenance">维护中</option>
            </select>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredLines}
        getRowKey={(row) => row.id}
        striped
        emptyText="暂无产线数据"
        actions={[
          { label: '编辑', onClick: handleEdit, variant: 'edit' },
          { label: '删除', onClick: (row) => handleDelete(row.id), variant: 'delete' },
        ]}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingLine(null);
        }}
        title={editingLine ? '编辑产线' : '添加产线'}
      >
        <ProductionLineForm
          initialData={editingLine ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingLine(null);
          }}
        />
      </Modal>

      <Modal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        title="确认删除"
      >
        <p className="text-gray-600 mb-4">确定要删除该产线吗？此操作无法撤销。</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
            取消
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            删除
          </Button>
        </div>
      </Modal>
    </div>
  );
}
