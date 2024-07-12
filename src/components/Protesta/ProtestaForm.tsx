import React, { useState, useEffect } from 'react';
import { Protesta, Naturaleza, Provincia, Cabecilla, CrearProtesta } from '../../types';
import { useApi } from '../../hooks/useApi';
import { Form, Input, DatePicker, Select, Button, message } from 'antd';
import { naturalezaService, provinciaService, cabecillaService } from '../../services/api';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

interface ProtestaFormProps {
  initialData?: Protesta;
  onSubmit: (values: CrearProtesta) => Promise<void>;
}

const ProtestaForm: React.FC<ProtestaFormProps> = ({ initialData, onSubmit }) => {
  const [form] = Form.useForm();
  const { loading, error } = useApi();
  const [naturalezas, setNaturalezas] = useState<Naturaleza[]>([]);
  const [provincias, setProvincias] = useState<Provincia[]>([]);
  const [cabecillas, setCabecillas] = useState<Cabecilla[]>([]);

  useEffect(() => {
    fetchFormData();
  }, []);

  useEffect(() => {
    if (initialData) {
      form.setFieldsValue({
        ...initialData,
        fecha_evento: dayjs(initialData.fecha_evento),
        cabecillas: initialData.cabecillas.map(c => c.id),
      });
    }
  }, [initialData, form]);

  const fetchFormData = async () => {
    try {
      const [naturalezasData, provinciasData, cabecillasData] = await Promise.all([
        naturalezaService.getAll(),
        provinciaService.getAll(),
        cabecillaService.getAll(),
      ]);
      setNaturalezas(naturalezasData);
      setProvincias(provinciasData);
      setCabecillas(cabecillasData);
    } catch (error) {
      console.error('Error al cargar los datos del formulario', error);
      message.error('Error al cargar los datos del formulario');
    }
  };

  const handleFinish = async (values: any) => {
    const protestaData: CrearProtesta = {
      nombre: values.nombre,
      naturaleza_id: values.naturaleza_id,
      provincia_id: values.provincia_id,
      resumen: values.resumen,
      fecha_evento: values.fecha_evento.format('YYYY-MM-DD'),
      cabecillas: values.cabecillas || [],
    };
    await onSubmit(protestaData);
  };

  return (
    <Form form={form} onFinish={handleFinish} layout="vertical">
      <Form.Item name="nombre" label="Nombre" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="naturaleza_id" label="Naturaleza" rules={[{ required: true }]}>
        <Select>
          {naturalezas.map(n => (
            <Option key={n.id} value={n.id}>{n.nombre}</Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item name="provincia_id" label="Provincia" rules={[{ required: true }]}>
        <Select>
          {provincias.map(p => (
            <Option key={p.id} value={p.id}>{p.nombre}</Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item name="resumen" label="Resumen" rules={[{ required: true }]}>
        <TextArea rows={4} />
      </Form.Item>
      <Form.Item name="fecha_evento" label="Fecha del Evento" rules={[{ required: true }]}>
        <DatePicker />
      </Form.Item>
      <Form.Item name="cabecillas" label="Cabecillas">
        <Select mode="multiple">
          {cabecillas.map(c => (
            <Option key={c.id} value={c.id}>{`${c.nombre} ${c.apellido}`}</Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          {initialData ? 'Actualizar' : 'Crear'} Protesta
        </Button>
      </Form.Item>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </Form>
  );
};

export default ProtestaForm;
