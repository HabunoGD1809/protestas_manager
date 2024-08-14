import React from 'react';
import { Form, Input, Button } from 'antd';

export interface CabecillaFilterValues {
  nombre?: string | undefined;
  apellido?: string | undefined;
  cedula?: string | undefined;
}

export interface CabecillaFilterProps {
  onFilter: (values: CabecillaFilterValues) => void;
}

const CabecillaFilter: React.FC<CabecillaFilterProps> = ({ onFilter }) => {
  const [form] = Form.useForm<CabecillaFilterValues>();

  const handleFilter = (values: CabecillaFilterValues) => {
    onFilter(values);
  };

  return (
    <Form form={form} layout="inline" onFinish={handleFilter}>
      <Form.Item name="nombre">
        <Input placeholder="Nombre" />
      </Form.Item>
      <Form.Item name="apellido">
        <Input placeholder="Apellido" />
      </Form.Item>
      <Form.Item name="cedula">
        <Input placeholder="Cédula" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit">
          Filtrar
        </Button>
      </Form.Item>
      <Form.Item>
        <Button onClick={() => {
          form.resetFields();
          onFilter({});
        }}>
          Limpiar
        </Button>
      </Form.Item>
    </Form>
  );
};

export default CabecillaFilter;
