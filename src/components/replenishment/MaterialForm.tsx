import { useState, useEffect } from 'react';
import { FormInput, Modal, Button } from '../common';
import type { MaterialRequirement } from '../../types';

interface MaterialFormData {
  materialCode: string;
  materialName: string;
  currentStock: number;
  safetyStock: number;
  replenishmentZoneMin: number;
  replenishmentZoneMax: number;
}

interface MaterialFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MaterialFormData) => void;
  initialData?: MaterialRequirement;
}

const initialFormData: MaterialFormData = {
  materialCode: '',
  materialName: '',
  currentStock: 0,
  safetyStock: 0,
  replenishmentZoneMin: 0,
  replenishmentZoneMax: 0,
};

export function MaterialForm({ isOpen, onClose, onSubmit, initialData }: MaterialFormProps) {
  const [formData, setFormData] = useState<MaterialFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof MaterialFormData, string>>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        materialCode: initialData.materialCode,
        materialName: initialData.materialName,
        currentStock: initialData.currentStock,
        safetyStock: initialData.safetyStock,
        replenishmentZoneMin: initialData.replenishmentZone[0],
        replenishmentZoneMax: initialData.replenishmentZone[1],
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [initialData, isOpen]);

  const handleChange = (field: keyof MaterialFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof MaterialFormData, string>> = {};

    if (!formData.materialCode.trim()) {
      newErrors.materialCode = '请输入物料编码';
    }
    if (!formData.materialName.trim()) {
      newErrors.materialName = '请输入物料名称';
    }
    if (formData.currentStock < 0) {
      newErrors.currentStock = '库存不能为负数';
    }
    if (formData.safetyStock < 0) {
      newErrors.safetyStock = '安全库存不能为负数';
    }
    if (formData.replenishmentZoneMin < 0) {
      newErrors.replenishmentZoneMin = '最小值不能为负数';
    }
    if (formData.replenishmentZoneMax < 0) {
      newErrors.replenishmentZoneMax = '最大值不能为负数';
    }
    if (formData.replenishmentZoneMin > formData.replenishmentZoneMax) {
      newErrors.replenishmentZoneMax = '最大值必须大于最小值';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit(formData);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? '编辑物料' : '添加物料'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            确认
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FormInput
          label="物料编码"
          value={formData.materialCode}
          onChange={(e) => handleChange('materialCode', e.target.value)}
          error={errors.materialCode}
          disabled={!!initialData}
        />
        <FormInput
          label="物料名称"
          value={formData.materialName}
          onChange={(e) => handleChange('materialName', e.target.value)}
          error={errors.materialName}
        />
        <FormInput
          label="当前库存"
          type="number"
          value={formData.currentStock}
          onChange={(e) => handleChange('currentStock', Number(e.target.value))}
          error={errors.currentStock}
          min={0}
        />
        <FormInput
          label="安全库存"
          type="number"
          value={formData.safetyStock}
          onChange={(e) => handleChange('safetyStock', Number(e.target.value))}
          error={errors.safetyStock}
          min={0}
        />
        <div className="flex gap-4">
          <FormInput
            label="舒适补货区间(最小)"
            type="number"
            value={formData.replenishmentZoneMin}
            onChange={(e) => handleChange('replenishmentZoneMin', Number(e.target.value))}
            error={errors.replenishmentZoneMin}
            min={0}
            className="flex-1"
          />
          <FormInput
            label="舒适补货区间(最大)"
            type="number"
            value={formData.replenishmentZoneMax}
            onChange={(e) => handleChange('replenishmentZoneMax', Number(e.target.value))}
            error={errors.replenishmentZoneMax}
            min={0}
            className="flex-1"
          />
        </div>
      </div>
    </Modal>
  );
}
