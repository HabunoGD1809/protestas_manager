import React from 'react';
import { Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

interface DeleteConfirmationProps {
  title: string;
  content: string;
  onConfirm: () => void;
}

const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({ title, content, onConfirm }) => {
  const showConfirm = () => {
    Modal.confirm({
      title: title,
      icon: <ExclamationCircleOutlined />,
      content: content,
      okText: 'Sí',
      okType: 'danger',
      cancelText: 'No',
      onOk() {
        onConfirm();
      },
    });
  };

  return (
    <span onClick={showConfirm}>
      Confirmar eliminación
    </span>
  );
};

export default DeleteConfirmation;
