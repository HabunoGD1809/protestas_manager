import React from 'react';
import { Form, Input, Button, Space } from 'antd';
import '../../styles/commonFilter.css';

export interface CabecillaFilterValues {
  nombre?: string;
  apellido?: string;
  cedula?: string;
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
    <Form form={form} layout="vertical" onFinish={handleFilter} className="filter-form">
      <Form.Item name="nombre" label="Nombre">
        <Input placeholder="Ingrese el nombre" />
      </Form.Item>
      <Form.Item name="apellido" label="Apellido">
        <Input placeholder="Ingrese el apellido" />
      </Form.Item>
      <Form.Item name="cedula" label="Cédula">
        <Input placeholder="Ingrese la cédula" />
      </Form.Item>
      <Form.Item>
        <Space className="filter-buttons">
          <Button type="primary" htmlType="submit">
            Filtrar
          </Button>
          <Button onClick={() => {
            form.resetFields();
            onFilter({});
          }}>
            Limpiar
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default CabecillaFilter;
