import React from 'react';
import { Form, Input, Button } from 'antd';

interface NaturalezaFilterProps {
  onFilter: (values: any) => void;
}

const NaturalezaFilter: React.FC<NaturalezaFilterProps> = ({ onFilter }) => {
  const [form] = Form.useForm();

  const handleFilter = (values: any) => {
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
