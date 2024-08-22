import React from 'react';
import { Modal, message } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

interface DeleteConfirmationDialogProps {
   isOpen: boolean;
   onClose: () => void;
   onConfirm: () => Promise<void>;
   itemName: string;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
   isOpen,
   onClose,
   onConfirm,
   itemName,
}) => {
   const handleConfirm = async () => {
      try {
         await onConfirm();
         message.success(`${itemName} eliminado exitosamente`);
         onClose();
      } catch (error) {
         if (error instanceof Error) {
            if (error.message.includes('privilegios')) {
               message.error(`No tienes los privilegios necesarios para eliminar ${itemName}`);
            } else {
               message.error(`Error al eliminar ${itemName}: ${error.message}`);
            }
         } else {
            message.error(`Error desconocido al eliminar ${itemName}`);
         }
      }
   };

   return (
      <Modal
         title={
            <span>
               <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: '8px' }} />
               Confirmar eliminación
            </span>
         }
         open={isOpen}
         onOk={handleConfirm}
         onCancel={onClose}
         okText="Eliminar"
         cancelText="Cancelar"
         okButtonProps={{ danger: true }}
      >
         <p>¿Estás seguro de que quieres eliminar {itemName}?</p>
         <p>Esta acción no se puede deshacer.</p>
      </Modal>
   );
};

export default DeleteConfirmationDialog;
