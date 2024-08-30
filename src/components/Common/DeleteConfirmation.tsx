import React from 'react';
import { Modal, message } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const { confirm } = Modal;

interface DeleteConfirmationProps {
  title: string;
  content: string;
  onDelete: () => Promise<void>;
}

const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({ title, content, onDelete }) => {
  const showDeleteConfirm = () => {
    confirm({
      title,
      icon: <ExclamationCircleOutlined />,
      content,
      okText: 'Sí',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await onDelete();
          message.success('Elemento eliminado exitosamente');
        } catch (error) {
          console.error('Error al eliminar:', error);
          if (error instanceof Error) {
            message.error(`Error al eliminar: ${error.message}`);
          } else {
            message.error('Error al eliminar');
          }
        }
      },
    });
  };

  return (
    <span onClick={showDeleteConfirm}>
      Eliminar
    </span>
  );
};

export default DeleteConfirmation;
