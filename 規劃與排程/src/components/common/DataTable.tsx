import { ReactNode } from 'react';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyText?: string;
  striped?: boolean;
  actions?: {
    label: string;
    onClick: (row: T) => void;
    variant?: 'edit' | 'delete';
  }[];
  getRowKey: (row: T) => string | number;
}

export function DataTable<T>({
  columns,
  data,
  emptyText = '暂无数据',
  striped = false,
  actions,
  getRowKey,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">{emptyText}</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-100 border-b border-gray-200">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                {col.header}
              </th>
            ))}
            {actions && actions.length > 0 && (
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">操作</th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={getRowKey(row)}
              className={`
                border-b border-gray-100
                ${striped && idx % 2 === 1 ? 'bg-gray-50' : ''}
              `}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-sm text-gray-700">
                  {col.render ? col.render(row) : (row as Record<string, unknown>)[col.key] as ReactNode}
                </td>
              ))}
              {actions && actions.length > 0 && (
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {actions.map((action, actionIdx) => (
                      <button
                        key={actionIdx}
                        onClick={() => action.onClick(row)}
                        className={`
                          px-2 py-1 text-xs rounded transition-colors
                          ${
                            action.variant === 'delete'
                              ? 'bg-red-100 text-red-600 hover:bg-red-200'
                              : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                          }
                        `}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
