import React, { useEffect } from 'react';
import { Form, Input, DatePicker, Select, Button } from 'antd';
import { Protesta, CrearProtesta, Naturaleza, Provincia, Cabecilla } from '../../types';
import { useApi } from '../../hooks/useApi';
import moment from 'moment';

const { Option } = Select;

interface ProtestaFormProps {
  initialData?: Protesta;
  onSubmit: (values: CrearProtesta) => void;
}

interface ProtestaFormValues {
  nombre: string;
  naturaleza_id: string;
  provincia_id: string;
  resumen: string;
  fecha_evento: moment.Moment;
  cabecillas: string[];
}

const ProtestaForm: React.FC<ProtestaFormProps> = ({ initialData, onSubmit }) => {
  const [form] = Form.useForm<ProtestaFormValues>();
  const { request, loading } = useApi();
  const [naturalezas, setNaturalezas] = React.useState<Naturaleza[]>([]);
  const [provincias, setProvincias] = React.useState<Provincia[]>([]);
  const [cabecillas, setCabecillas] = React.useState<Cabecilla[]>([]);

  useEffect(() => {
    fetchNaturalezas();
    fetchProvincias();
    fetchCabecillas();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (initialData) {
      form.setFieldsValue({
        ...initialData,
        fecha_evento: moment(initialData.fecha_evento),
        cabecillas: initialData.cabecillas.map(c => c.id)
      });
    }
  }, [initialData, form]);

  const fetchNaturalezas = async () => {
    try {
      const data = await request<Naturaleza[]>('get', '/naturalezas');
      setNaturalezas(data);
    } catch (error) {
      console.error('Error fetching naturalezas:', error);
    }
  };

  const fetchProvincias = async () => {
    try {
      const data = await request<Provincia[]>('get', '/provincias');
      setProvincias(data);
    } catch (error) {
      console.error('Error fetching provincias:', error);
    }
  };

  const fetchCabecillas = async () => {
    try {
      const data = await request<Cabecilla[]>('get', '/cabecillas');
      setCabecillas(data);
    } catch (error) {
      console.error('Error fetching cabecillas:', error);
    }
  };

  // Función handleSubmit modificada con el tipo correcto
  const handleSubmit = (values: ProtestaFormValues) => {
    const protestaData: CrearProtesta = {
      ...values,
      fecha_evento: values.fecha_evento.format('YYYY-MM-DD'),
      cabecillas: values.cabecillas
    };
    onSubmit(protestaData);
  };

  return (
    <Form form={form} onFinish={handleSubmit} layout="vertical">
      <Form.Item name="nombre" label="Nombre" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="naturaleza_id" label="Naturaleza" rules={[{ required: true }]}>
        <Select>
          {naturalezas.map((naturaleza) => (
            <Option key={naturaleza.id} value={naturaleza.id}>
              {naturaleza.nombre}
            </Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item name="provincia_id" label="Provincia" rules={[{ required: true }]}>
        <Select>
          {provincias.map((provincia) => (
            <Option key={provincia.id} value={provincia.id}>
              {provincia.nombre}
            </Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item name="resumen" label="Resumen" rules={[{ required: true }]}>
        <Input.TextArea />
      </Form.Item>
      <Form.Item name="fecha_evento" label="Fecha del Evento" rules={[{ required: true }]}>
        <DatePicker />
      </Form.Item>
      <Form.Item name="cabecillas" label="Cabecillas" rules={[{ required: true }]}>
        <Select mode="multiple">
          {cabecillas.map((cabecilla) => (
            <Option key={cabecilla.id} value={cabecilla.id}>
              {`${cabecilla.nombre} ${cabecilla.apellido}`}
            </Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          {initialData ? 'Actualizar' : 'Crear'} Protesta
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ProtestaForm;
