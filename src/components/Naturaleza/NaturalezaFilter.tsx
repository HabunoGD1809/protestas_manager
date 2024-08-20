import React from 'react';
import { Form, Input, Button, Space } from 'antd';
import '../../styles/commonFilter.css';

export interface NaturalezaFilters {
  nombre?: string;
}

export interface NaturalezaFilterProps {
  onFilter: (values: NaturalezaFilters) => void;
}

const NaturalezaFilter: React.FC<NaturalezaFilterProps> = ({ onFilter }) => {
  const [form] = Form.useForm<NaturalezaFilters>();

  const handleFilter = (values: NaturalezaFilters) => {
    onFilter(values);
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleFilter} className="filter-form">
      <Form.Item name="nombre" label="Nombre">
        <Input placeholder="Ingrese el nombre de la naturaleza" />
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

export default NaturalezaFilter;
