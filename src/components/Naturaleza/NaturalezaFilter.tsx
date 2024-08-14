import React from 'react';
import { Form, Input, Button } from 'antd';

export interface NaturalezaFilters {
  nombre?: string;
}

interface NaturalezaFilterProps {
  onFilter: (values: NaturalezaFilters) => void;
}

const NaturalezaFilter: React.FC<NaturalezaFilterProps> = ({ onFilter }) => {
  const [form] = Form.useForm<NaturalezaFilters>();

  const handleFilter = (values: NaturalezaFilters) => {
    onFilter(values);
  };

  return (
    <Form form={form} layout="inline" onFinish={handleFilter}>
      <Form.Item name="nombre">
        <Input placeholder="Nombre" />
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

export default NaturalezaFilter;
