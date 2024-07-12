import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Protesta, Naturaleza, Provincia, Cabecilla } from '../../types';
import { useApi } from '../../hooks/useApi';
import { Form, Input, DatePicker, Select, Button, message } from 'antd';
import { protestaService, naturalezaService, provinciaService, cabecillaService } from '../../services/api';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const ProtestaForm: React.FC = () => {
  const [form] = Form.useForm();
  const { request, loading, error } = useApi();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [naturalezas, setNaturalezas] = useState<Naturaleza[]>([]);
  const [provincias, setProvincias] = useState<Provincia[]>([]);
  const [cabecillas, setCabecillas] = useState<Cabecilla[]>([]);

  useEffect(() => {
    fetchFormData();
    if (id) {
      fetchProtesta(id);
    }
  }, [id]);

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
      message.error('Error al cargar los datos del formulario');
    }
  };

  const fetchProtesta = async (protestaId: string) => {
    try {
      const protesta = await protestaService.getById(protestaId);
      form.setFieldsValue({
        ...protesta,
        fecha_evento: dayjs(protesta.fecha_evento),
        cabecillas: protesta.cabecillas.map(c => c.id),
      });
    } catch (error) {
      message.error('Error al cargar los datos de la protesta');
    }
  };

  const onFinish = async (values: any) => {
    try {
      const data = {
        ...values,
        fecha_evento: values.fecha_evento.format('YYYY-MM-DD'),
      };
      if (id) {
        await protestaService.update(id, data);
        message.success('Protesta actualizada con éxito');
      } else {
        await protestaService.create(data);
        message.success('Protesta creada con éxito');
      }
      navigate('/protestas');
    } catch (error) {
      message.error('Error al guardar la protesta');
    }
  };

  return (
    <Form form={form} onFinish={onFinish} layout="vertical">
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
          {id ? 'Actualizar' : 'Crear'} Protesta
        </Button>
      </Form.Item>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </Form>
  );
};

export default ProtestaForm;
