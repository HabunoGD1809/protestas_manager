import React, { useState, useEffect } from 'react';
import { Form, Button, Space, AutoComplete } from 'antd';
import '../../styles/commonFilter.css';

export interface CabecillaFilterValues {
  nombre?: string;
  apellido?: string;
  cedula?: string;
}

export interface CabecillaFilterProps {
  onFilter: (values: CabecillaFilterValues) => void;
  cabecillas: { nombre: string; apellido: string; cedula: string }[];
}

const normalizeString = (str: string): string => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

const CabecillaFilter: React.FC<CabecillaFilterProps> = ({ onFilter, cabecillas }) => {
  const [form] = Form.useForm<CabecillaFilterValues>();
  const [nombreOptions, setNombreOptions] = useState<{ value: string }[]>([]);
  const [apellidoOptions, setApellidoOptions] = useState<{ value: string }[]>([]);
  const [cedulaOptions, setCedulaOptions] = useState<{ value: string }[]>([]);

  useEffect(() => {
    const nombres = [...new Set(cabecillas.map(c => c.nombre))];
    const apellidos = [...new Set(cabecillas.map(c => c.apellido))];
    const cedulas = [...new Set(cabecillas.map(c => c.cedula))];

    setNombreOptions(nombres.map(nombre => ({ value: nombre })));
    setApellidoOptions(apellidos.map(apellido => ({ value: apellido })));
    setCedulaOptions(cedulas.map(cedula => ({ value: cedula })));
  }, [cabecillas]);

  const handleFilter = (values: CabecillaFilterValues) => {
    const normalizedValues: CabecillaFilterValues = {
      nombre: values.nombre ? normalizeString(values.nombre) : undefined,
      apellido: values.apellido ? normalizeString(values.apellido) : undefined,
      cedula: values.cedula,
    };
    onFilter(normalizedValues);
  };

  const filterOption = (inputValue: string, option: { value: string } | undefined) => {
    const normalizedInput = normalizeString(inputValue);
    const normalizedOption = option ? normalizeString(option.value) : '';
    return normalizedOption.includes(normalizedInput);
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleFilter} className="filter-form">
      <Form.Item name="nombre" label="Nombre">
        <AutoComplete
          options={nombreOptions}
          placeholder="Ingrese el nombre"
          filterOption={filterOption}
          allowClear
        />
      </Form.Item>
      <Form.Item name="apellido" label="Apellido">
        <AutoComplete
          options={apellidoOptions}
          placeholder="Ingrese el apellido"
          filterOption={filterOption}
          allowClear
        />
      </Form.Item>
      <Form.Item name="cedula" label="Cédula">
        <AutoComplete
          options={cedulaOptions}
          placeholder="Ingrese la cédula"
          filterOption={filterOption}
          allowClear
        />
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
