import React from 'react';
import { Form, Input, Select, DatePicker, Button } from 'antd';
import { Naturaleza, Provincia } from '../../types';
import { Moment } from 'moment';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface FilterValues {
  nombre?: string;
  naturaleza_id?: string;
  provincia_id?: string;
  fecha_rango?: [Moment, Moment];
}

interface Filters {
  nombre?: string;
  naturaleza_id?: string;
  provincia_id?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
}

interface ProtestaFilterProps {
  naturalezas: Naturaleza[];
  provincias: Provincia[];
  onFilter: (filters: Filters) => void;
}

const ProtestaFilter: React.FC<ProtestaFilterProps> = ({ naturalezas, provincias, onFilter }) => {
  const [form] = Form.useForm<FilterValues>();

  const handleFilter = (values: FilterValues) => {
    const filters: Filters = {
      nombre: values.nombre,
      naturaleza_id: values.naturaleza_id,
      provincia_id: values.provincia_id,
      fecha_desde: values.fecha_rango?.[0]?.format('YYYY-MM-DD'),
      fecha_hasta: values.fecha_rango?.[1]?.format('YYYY-MM-DD'),
    };
    onFilter(filters);
  };

  return (
    <Form form={form} layout="inline" onFinish={handleFilter}>
      <Form.Item name="nombre">
        <Input placeholder="Nombre de la protesta" />
      </Form.Item>
      <Form.Item name="naturaleza_id">
        <Select placeholder="Naturaleza" style={{ width: 200 }} allowClear>
          {naturalezas.map(n => (
            <Option key={n.id} value={n.id}>{n.nombre}</Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item name="provincia_id">
        <Select placeholder="Provincia" style={{ width: 200 }} allowClear>
          {provincias.map(p => (
            <Option key={p.id} value={p.id}>{p.nombre}</Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item name="fecha_rango">
        <RangePicker />
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

export default ProtestaFilter;
