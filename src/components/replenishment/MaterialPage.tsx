import { useState } from 'react';
import { DataTable, Badge, Button, Modal } from '../common';
import { useReplenishmentStore } from '../../stores/replenishmentStore';
import { MaterialForm } from './MaterialForm';
import { StockIndicator } from './StockIndicator';
import type { MaterialRequirement, MaterialRequirementStatus } from '../../types';

const statusLabels: Record<MaterialRequirementStatus, string> = {
  sufficient: '充足',
  low: '偏低',
  critical: '紧急',
};

const statusBadgeVariant: Record<MaterialRequirementStatus, 'success' | 'warning' | 'danger'> = {
  sufficient: 'success',
  low: 'warning',
  critical: 'danger',
};

interface MaterialFormData {
  materialCode: string;
  materialName: string;
  currentStock: number;
  safetyStock: number;
  replenishmentZoneMin: number;
  replenishmentZoneMax: number;
}

function calculateStatus(currentStock: number, safetyStock: number): MaterialRequirementStatus {
  if (currentStock < safetyStock * 0.5) {
    return 'critical';
  }
  if (currentStock < safetyStock) {
    return 'low';
  }
  return 'sufficient';
}

export function MaterialPage() {
  const { materialRequirements, setMaterialRequirements, updateRequirement } = useReplenishmentStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialRequirement | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; material: MaterialRequirement | null }>({
    isOpen: false,
    material: null,
  });

  const handleAdd = () => {
    setEditingMaterial(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (material: MaterialRequirement) => {
    setEditingMaterial(material);
    setIsFormOpen(true);
  };

  const handleDelete = (material: MaterialRequirement) => {
    setDeleteConfirm({ isOpen: true, material });
  };

  const confirmDelete = () => {
    if (deleteConfirm.material) {
      setMaterialRequirements(
        materialRequirements.filter((m) => m.id !== deleteConfirm.material!.id)
      );
      setDeleteConfirm({ isOpen: false, material: null });
    }
  };

  const handleFormSubmit = (data: MaterialFormData) => {
    const newStatus = calculateStatus(data.currentStock, data.safetyStock);

    if (editingMaterial) {
      updateRequirement(editingMaterial.id, {
        materialName: data.materialName,
        currentStock: data.currentStock,
        safetyStock: data.safetyStock,
        replenishmentZone: [data.replenishmentZoneMin, data.replenishmentZoneMax],
        status: newStatus,
      });
    } else {
      const newMaterial: MaterialRequirement = {
        id: `MAT${Date.now()}`,
        materialCode: data.materialCode,
        materialName: data.materialName,
        currentStock: data.currentStock,
        safetyStock: data.safetyStock,
        replenishmentZone: [data.replenishmentZoneMin, data.replenishmentZoneMax],
        status: newStatus,
        requiredDate: new Date().toISOString().split('T')[0],
        quantity: 0,
      };
      setMaterialRequirements([...materialRequirements, newMaterial]);
    }
  };

  const columns = [
    { key: 'materialCode', header: '物料编码' },
    { key: 'materialName', header: '物料名称' },
    {
      key: 'currentStock',
      header: '当前库存',
      render: (row: MaterialRequirement) => (
        <StockIndicator
          currentStock={row.currentStock}
          safetyStock={row.safetyStock}
          status={row.status}
        />
      ),
    },
    { key: 'safetyStock', header: '安全库存' },
    {
      key: 'replenishmentZone',
      header: '舒适区间',
      render: (row: MaterialRequirement) =>
        `${row.replenishmentZone[0]} - ${row.replenishmentZone[1]}`,
    },
    {
      key: 'status',
      header: '状态',
      render: (row: MaterialRequirement) => (
        <Badge variant={statusBadgeVariant[row.status]}>{statusLabels[row.status]}</Badge>
      ),
    },
  ];

  const actions = [
    { label: '编辑', onClick: handleEdit, variant: 'edit' as const },
    { label: '删除', onClick: handleDelete, variant: 'delete' as const },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">物料管理</h1>
        <Button variant="primary" onClick={handleAdd}>
          添加物料
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <DataTable
          columns={columns}
          data={materialRequirements}
          getRowKey={(row) => row.id}
          actions={actions}
          emptyText="暂无物料数据"
          striped
        />
      </div>

      <MaterialForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingMaterial}
      />

      <Modal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, material: null })}
        title="确认删除"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteConfirm({ isOpen: false, material: null })}>
              取消
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              确认删除
            </Button>
          </>
        }
      >
        <p className="text-gray-700">
          确定要删除物料 <strong>{deleteConfirm.material?.materialName}</strong> 吗？此操作无法撤销。
        </p>
      </Modal>
    </div>
  );
}
