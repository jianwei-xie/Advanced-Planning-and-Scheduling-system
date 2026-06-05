import { ReactNode, useState } from 'react';

type AlertType = 'success' | 'warning' | 'danger' | 'info';

interface AlertProps {
  type?: AlertType;
  children: ReactNode;
  closable?: boolean;
  onClose?: () => void;
}

const typeStyles: Record<AlertType, { bg: string; icon: string }> = {
  success: { bg: 'bg-green-50 border-green-200 text-green-800', icon: '✓' },
  warning: { bg: 'bg-yellow-50 border-yellow-200 text-yellow-800', icon: '⚠' },
  danger: { bg: 'bg-red-50 border-red-200 text-red-800', icon: '✕' },
  info: { bg: 'bg-blue-50 border-blue-200 text-blue-800', icon: 'ℹ' },
};

export function Alert({ type = 'info', children, closable = false, onClose }: AlertProps) {
  const [visible, setVisible] = useState(true);
  const { bg, icon } = typeStyles[type];

  const handleClose = () => {
    setVisible(false);
    onClose?.();
  };

  if (!visible) return null;

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${bg}`}>
      <span className="text-lg">{icon}</span>
      <div className="flex-1 text-sm">{children}</div>
      {closable && (
        <button onClick={handleClose} className="text-lg leading-none opacity-70 hover:opacity-100">
          ×
        </button>
      )}
    </div>
  );
}
