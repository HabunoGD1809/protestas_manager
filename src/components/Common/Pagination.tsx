import React from 'react';
import { Pagination as AntPagination } from 'antd';

interface PaginationProps {
  current: number;
  total: number;
  pageSize: number;
  onChange: (page: number, pageSize: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ current, total, pageSize, onChange }) => {
  // Asegurarse de que todos los valores sean números válidos
  const validCurrent = Number.isFinite(current) ? current : 1;
  const validTotal = Number.isFinite(total) ? total : 0;
  const validPageSize = Number.isFinite(pageSize) ? pageSize : 10;

  // Si no hay elementos, no renderizar la paginación
  if (validTotal === 0) {
    return null;
  }

  return (
    <AntPagination
      current={validCurrent}
      total={validTotal}
      pageSize={validPageSize}
      onChange={onChange}
      showSizeChanger
      showQuickJumper
      showTotal={(total, range) => `${range[0]}-${range[1]} de ${total} items`}
    />
  );
};

export default Pagination;
