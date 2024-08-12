import React, { useState, useEffect } from 'react';
import { Form, Input, DatePicker, Select, Button, Spin, message } from 'antd';
import { Protesta, CrearProtesta, Naturaleza, Provincia, Cabecilla } from '../../types';
import { useApi } from '../../hooks/useApi';
import { cabecillaService, naturalezaService, provinciaService } from '../../services/api';
import moment from 'moment';
import { SearchOutlined } from '@ant-design/icons';

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
  const { loading } = useApi();
  const [naturalezas, setNaturalezas] = useState<Naturaleza[]>([]);
  const [provincias, setProvincias] = useState<Provincia[]>([]);
  const [cabecillas, setCabecillas] = useState<Cabecilla[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [naturalezasResponse, provinciasResponse, cabecillasResponse] = await Promise.all([
          naturalezaService.getAll(),
          provinciaService.getAll(),
          cabecillaService.getAllNoPagination()
        ]);

        setNaturalezas(naturalezasResponse.items || []);
        setProvincias(provinciasResponse);
        setCabecillas(cabecillasResponse);

        if (initialData) {
          form.setFieldsValue({
            ...initialData,
            fecha_evento: moment(initialData.fecha_evento),
            cabecillas: initialData.cabecillas.map(c => c.id)
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        message.error('Error al cargar los datos');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [initialData, form]);

  const handleSubmit = (values: ProtestaFormValues) => {
    const protestaData: CrearProtesta = {
      ...values,
      fecha_evento: values.fecha_evento.format('YYYY-MM-DD'),
      cabecillas: values.cabecillas
    };
    onSubmit(protestaData);
  };

  if (isLoading) {
    return <Spin size="large" />;
  }

  return (
    <Form form={form} onFinish={handleSubmit} layout="vertical">
      <Form.Item name="nombre" label="Nombre" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="naturaleza_id" label="Naturaleza" rules={[{ required: true }]}>
        <Select
          showSearch
          optionFilterProp="children"
          filterOption={(input, option) => {
            const naturalezaName = option?.label?.toString().toLowerCase() || '';
            return naturalezaName.includes(input.toLowerCase());
          }}
          suffixIcon={<SearchOutlined />}
          placeholder="Buscar y seleccionar naturaleza"
        >
          {naturalezas.map((naturaleza) => (
            <Option key={naturaleza.id} value={naturaleza.id} label={naturaleza.nombre}>
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
        <Select
          mode="multiple"
          showSearch
          optionFilterProp="children"
          filterOption={(input, option) => {
            const cabecillaFullName = option?.label?.toString().toLowerCase() || '';
            return cabecillaFullName.includes(input.toLowerCase());
          }}
          suffixIcon={<SearchOutlined />}
          placeholder="Buscar y seleccionar cabecillas"
        >
          {cabecillas.map((cabecilla) => (
            <Option
              key={cabecilla.id}
              value={cabecilla.id}
              label={`${cabecilla.nombre} ${cabecilla.apellido}`}
            >
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
