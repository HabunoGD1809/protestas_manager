import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { Card, Statistic, Row, Col, Alert } from 'antd';
import {
  FlagOutlined,
  BarChartOutlined,
  TagsOutlined
} from '@ant-design/icons';
import { Protesta, Naturaleza, PaginatedResponse } from '../../types/types';
import dayjs from 'dayjs';

const ProtestaStats: React.FC = () => {
  const [stats, setStats] = useState({
    totalProtestas: 0,
    protestasEsteMes: 0,
    naturalezaMasComun: '',
  });
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const { request, loading, error } = useApi();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [protestaResponse, naturalezaResponse] = await Promise.all([
        request<PaginatedResponse<Protesta>>('get', '/protestas'),
        request<Naturaleza[] | PaginatedResponse<Naturaleza>>('get', '/naturalezas')
      ]);

      if (!protestaResponse || !protestaResponse.items) {
        throw new Error('La respuesta de protestas es inválida');
      }

      const protestas = protestaResponse.items;
      const totalProtestas = protestaResponse.total;

      let naturalezas: Naturaleza[] = [];
      if (Array.isArray(naturalezaResponse)) {
        naturalezas = naturalezaResponse;
      } else if (naturalezaResponse && 'items' in naturalezaResponse) {
        naturalezas = naturalezaResponse.items;
      }

      const protestasEsteMes = calcularProtestasEsteMes(protestas);
      const naturalezaMasComun = calcularNaturalezaMasComun(protestas, naturalezas);

      setStats({
        totalProtestas,
        protestasEsteMes,
        naturalezaMasComun,
      });
      setErrorDetails(null);
    } catch (error) {
      console.error('Error al cargar las estadísticas', error);
      setStats({
        totalProtestas: 0,
        protestasEsteMes: 0,
        naturalezaMasComun: 'No hay datos',
      });
      setErrorDetails(error instanceof Error ? error.message : 'Error desconocido');
    }
  };

  const calcularProtestasEsteMes = (protestas: Protesta[]): number => {
    return protestas.filter(p => dayjs(p.fecha_evento).isSame(dayjs(), 'month')).length;
  };

  const calcularNaturalezaMasComun = (protestas: Protesta[], naturalezas: Naturaleza[]): string => {
    if (naturalezas.length === 0 || protestas.length === 0) {
      return 'No hay datos';
    }

    const naturalezaCount: { [key: string]: number } = {};
    protestas.forEach(p => {
      naturalezaCount[p.naturaleza_id] = (naturalezaCount[p.naturaleza_id] || 0) + 1;
    });

    const naturalezaMasComunId = Object.entries(naturalezaCount).reduce((a, b) => a[1] > b[1] ? a : b, ['', 0])[0];
    return naturalezas.find(n => n.id === naturalezaMasComunId)?.nombre || 'Desconocida';
  };

  if (loading) return <p>Cargando estadísticas...</p>;

  if (error || errorDetails) {
    return (
      <Alert
        message="Error al cargar las estadísticas"
        description={
          <div>
            <p>{error || 'Ocurrió un error al cargar los datos.'}</p>
            {errorDetails && <p>Detalles técnicos: {errorDetails}</p>}
          </div>
        }
        type="error"
        showIcon
      />
    );
  }

  return (
    <Row gutter={16}>
      <Col span={8}>
        <Card>
          <Statistic
            title="Total de Protestas"
            value={stats.totalProtestas}
            prefix={<FlagOutlined />}
          />
        </Card>
      </Col>
      <Col span={8}>
        <Card>
          <Statistic
            title="Protestas este mes"
            value={stats.protestasEsteMes}
            prefix={<BarChartOutlined />}
          />
        </Card>
      </Col>
      <Col span={8}>
        <Card>
          <Statistic
            title="Naturaleza más común"
            value={stats.naturalezaMasComun}
            prefix={<TagsOutlined />}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default ProtestaStats;
