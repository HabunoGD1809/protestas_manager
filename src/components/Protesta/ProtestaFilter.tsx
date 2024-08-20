import React from 'react';
import { Form, Input, Select, DatePicker, Button, Space, Row, Col } from 'antd';
import { Naturaleza, Provincia } from '../../types';
import { Moment } from 'moment';
import '../../styles/commonFilter.css';

const { RangePicker } = DatePicker;
const { Option } = Select;

export interface FilterValues {
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
    <Form form={form} layout="vertical" onFinish={handleFilter} className="filter-form">
      <Row gutter={16}>
        <Col xs={24} sm={12} md={6}>
          <Form.Item name="nombre" label="Nombre de la protesta">
            <Input placeholder="Ingrese el nombre" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Form.Item name="naturaleza_id" label="Naturaleza">
            <Select placeholder="Seleccione la naturaleza" allowClear>
              {naturalezas.map(n => (
                <Option key={n.id} value={n.id}>{n.nombre}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Form.Item name="provincia_id" label="Provincia">
            <Select placeholder="Seleccione la provincia" allowClear>
              {provincias.map(p => (
                <Option key={p.id} value={p.id}>{p.nombre}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Form.Item name="fecha_rango" label="Rango de fechas">
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
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

export default ProtestaFilter;
