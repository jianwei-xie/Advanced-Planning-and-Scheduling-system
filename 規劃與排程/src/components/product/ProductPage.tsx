import { useState } from 'react';
import { useProductStore } from '../../stores/productStore';
import { DataTable, Modal, Button } from '../common';
import { ProductForm, type ProcessFormData } from './ProductForm';
import { ProcessList } from './ProcessList';
import type { Product } from '../../types';

function generateId(): string {
  return 'P' + Date.now().toString().slice(-6);
}

export function ProductPage() {
  const { products, addProduct, updateProduct, deleteProduct } = useProductStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [productName, setProductName] = useState('');
  const [processes, setProcesses] = useState<ProcessFormData[]>([]);

  const openAddModal = () => {
    setEditingProduct(null);
    setProductName('');
    setProcesses([{ name: '', requiredCapability: '', standardHours: 0 }]);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setProductName(product.name);
    setProcesses(
      product.processes.map((p) => ({
        name: p.name,
        requiredCapability: p.requiredCapability,
        standardHours: p.standardHours,
      }))
    );
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleAddProcess = () => {
    setProcesses([...processes, { name: '', requiredCapability: '', standardHours: 0 }]);
  };

  const handleProcessUpdate = (index: number, field: keyof ProcessFormData, value: string | number) => {
    const updated = [...processes];
    updated[index] = { ...updated[index], [field]: value };
    setProcesses(updated);
  };

  const handleProcessRemove = (index: number) => {
    setProcesses(processes.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const validProcesses = processes.filter((p) => p.name.trim() !== '');

    if (!productName.trim()) return;

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: productName,
        processes: validProcesses.map((p, i) => ({
          sequence: i + 1,
          name: p.name,
          requiredCapability: p.requiredCapability,
          standardHours: p.standardHours,
        })),
      });
    } else {
      const newProduct: Product = {
        id: generateId(),
        name: productName,
        processes: validProcesses.map((p, i) => ({
          sequence: i + 1,
          name: p.name,
          requiredCapability: p.requiredCapability,
          standardHours: p.standardHours,
        })),
        createdAt: new Date().toISOString(),
      };
      addProduct(newProduct);
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      deleteProduct(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const columns = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: '产品名称' },
    {
      key: 'processes',
      header: '工序列表',
      render: (row: Product) => <ProcessList processes={row.processes} />,
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">产品工艺管理</h1>
        <Button onClick={openAddModal}>添加产品</Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <DataTable
          columns={columns}
          data={products}
          getRowKey={(row) => row.id}
          actions={[
            { label: '编辑', onClick: openEditModal, variant: 'edit' },
            { label: '删除', onClick: (row) => handleDelete(row.id), variant: 'delete' },
          ]}
          emptyText="暂无产品数据"
          striped
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingProduct ? '编辑产品' : '添加产品'}
      >
        <ProductForm
          productName={productName}
          processes={processes}
          onProductNameChange={setProductName}
          onProcessUpdate={handleProcessUpdate}
          onProcessRemove={handleProcessRemove}
          onAddProcess={handleAddProcess}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          isEditing={!!editingProduct}
        />
      </Modal>

      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="确认删除"
      >
        <p className="text-gray-600 mb-4">确定要删除这个产品吗？此操作不可撤销。</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>
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
