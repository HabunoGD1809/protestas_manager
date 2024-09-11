import { Table, Button, Tooltip, Space } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { TablePaginationConfig } from 'antd/es/table';
import { ColumnsType } from 'antd/es/table';

interface CommonTableProps<T> {
   data: T[];
   columns: ColumnsType<T>;
   pagination: TablePaginationConfig;
   loading: boolean;
   onEdit?: (record: T) => void;
   onDelete?: (record: T) => void;
   isAdmin?: boolean;
   editIcon?: 'edit' | 'eye'; 
   editTooltip?: string;  
}

const CommonTable = <T extends { id: string | number }>({
   data,
   columns,
   pagination,
   loading,
   onEdit,
   onDelete,
   isAdmin,
   editIcon = 'edit',  
   editTooltip = 'Editar' 
}: CommonTableProps<T>) => {
   const getEditIcon = () => {
      switch (editIcon) {
         case 'eye':
            return <EyeOutlined />;
         case 'edit':
         default:
            return <EditOutlined />;
      }
   };

   const actionsColumn: ColumnsType<T>[number] = {
      title: 'Acciones',
      key: 'actions',
      render: (_text: string, record: T) => (
         <Space size="middle">
            {onEdit && (
               <Tooltip title={editTooltip}>
                  <Button
                     icon={getEditIcon()}
                     onClick={() => onEdit(record)}
                     type="link"
                  />
               </Tooltip>
            )}
            {isAdmin && onDelete && (
               <Tooltip title="Eliminar">
                  <Button
                     icon={<DeleteOutlined />}
                     onClick={() => onDelete(record)}
                     type="link"
                     danger
                  />
               </Tooltip>
            )}
         </Space>
      ),
   };

   const tableColumns = [...columns, actionsColumn];

   return (
      <Table<T>
         columns={tableColumns}
         dataSource={data}
         rowKey="id"
         pagination={pagination}
         loading={loading}
      />
   );
};

export default CommonTable;
