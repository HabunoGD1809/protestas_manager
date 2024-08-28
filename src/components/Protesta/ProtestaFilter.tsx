import React, { useState, useCallback, useEffect } from 'react';
import { Form, Input, Select, DatePicker, Button, Space, Row, Col } from 'antd';
import { Naturaleza, Provincia } from '../../types/types';
import { Moment } from 'moment';
import '../../styles/commonFilter.css';
import moment from 'moment';

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
  initialFilters?: Filters; // Add this line
}

const ProtestaFilter: React.FC<ProtestaFilterProps> = ({ naturalezas, provincias, onFilter, initialFilters }) => {
  const [form] = Form.useForm<FilterValues>();
  const [prevFilters, setPrevFilters] = useState<Filters>(initialFilters || {});

  useEffect(() => {
    if (initialFilters) {
      form.setFieldsValue({
        nombre: initialFilters.nombre,
        naturaleza_id: initialFilters.naturaleza_id,
        provincia_id: initialFilters.provincia_id,
        fecha_rango: initialFilters.fecha_desde && initialFilters.fecha_hasta
          ? [moment(initialFilters.fecha_desde), moment(initialFilters.fecha_hasta)]
          : undefined,
      });
    }
  }, [form, initialFilters]);

  const handleFilter = useCallback((values: FilterValues) => {
    const newFilters: Filters = {
      nombre: values.nombre?.trim() || undefined,
      naturaleza_id: values.naturaleza_id,
      provincia_id: values.provincia_id,
      fecha_desde: values.fecha_rango?.[0]?.format('YYYY-MM-DD'),
      fecha_hasta: values.fecha_rango?.[1]?.format('YYYY-MM-DD'),
    };

    // Comparar los nuevos filtros con los anteriores
    const hasChanged = Object.keys(newFilters).some(key => {
      return newFilters[key as keyof Filters] !== prevFilters[key as keyof Filters];
    });

    if (hasChanged) {
      onFilter(newFilters);
      setPrevFilters(newFilters);
    }
  }, [onFilter, prevFilters]);

  const handleReset = useCallback(() => {
    form.resetFields();
    if (Object.keys(prevFilters).length > 0) {
      onFilter({});
      setPrevFilters({});
    }
  }, [form, onFilter, prevFilters]);

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
              {naturalezas && naturalezas.length > 0 ? (
                naturalezas.map(n => (
                  <Option key={n.id} value={n.id}>{n.nombre}</Option>
                ))
              ) : (
                <Option value="">No hay naturalezas disponibles</Option>
              )}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Form.Item name="provincia_id" label="Provincia">
            <Select placeholder="Seleccione la provincia" allowClear>
              {provincias && provincias.length > 0 ? (
                provincias.map(p => (
                  <Option key={p.id} value={p.id}>{p.nombre}</Option>
                ))
              ) : (
                <Option value="">No hay provincias disponibles</Option>
              )}
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
          <Button onClick={handleReset}>
            Limpiar
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default ProtestaFilter;
