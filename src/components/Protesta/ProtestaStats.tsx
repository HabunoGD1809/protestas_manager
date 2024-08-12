import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { Card, Statistic, Row, Col, Alert } from 'antd';
import { PieChartOutlined, CalendarOutlined, TeamOutlined } from '@ant-design/icons';
import { Protesta, Naturaleza, PaginatedResponse } from '../../types';
import dayjs from 'dayjs';

const ProtestaStats: React.FC = () => {
  const [stats, setStats] = useState({
    total_protestas: 0,
    protestas_este_mes: 0,
    naturaleza_mas_comun: '',
  });
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const { request, loading, error } = useApi();

  useEffect(() => {
    fetchStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStats = async () => {
    try {
      const [protestaResponse, naturalezaResponse] = await Promise.all([
        request<PaginatedResponse<Protesta>>('get', '/protestas'),
        request<Naturaleza[] | PaginatedResponse<Naturaleza>>('get', '/naturalezas')
      ]);

      // console.log('Protesta Response:', protestaResponse); //no borrar
      // console.log('Naturaleza Response:', naturalezaResponse); //borrar

      if (!protestaResponse || !protestaResponse.items) {
        throw new Error('La respuesta de protestas es inválida');
      }

      let naturalezas: Naturaleza[];
      if (Array.isArray(naturalezaResponse)) {
        naturalezas = naturalezaResponse;
      } else if (naturalezaResponse && 'items' in naturalezaResponse) {
        naturalezas = naturalezaResponse.items;
      } else {
        throw new Error(`La respuesta de naturalezas es inválida: ${JSON.stringify(naturalezaResponse)}`);
      }

      if (!Array.isArray(naturalezas) || naturalezas.length === 0) {
        throw new Error(`No se encontraron naturalezas válidas: ${JSON.stringify(naturalezas)}`);
      }

      const protestas = protestaResponse.items;
      const totalProtestas = protestaResponse.total;
      
      const protestasEsteMes = protestas.filter(p => 
        dayjs(p.fecha_evento).isSame(dayjs(), 'month')
      ).length;

      const naturalezaCount: { [key: string]: number } = {};
      protestas.forEach(p => {
        naturalezaCount[p.naturaleza_id] = (naturalezaCount[p.naturaleza_id] || 0) + 1;
      });
      
      const naturalezaMasComunId = Object.entries(naturalezaCount).reduce((a, b) => a[1] > b[1] ? a : b, ['', 0])[0];
      const naturalezaMasComun = naturalezas.find(n => n.id === naturalezaMasComunId)?.nombre || 'Desconocida';

      // console.log('Estadísticas calculadas:', {
      //   total_protestas: totalProtestas,
      //   protestas_este_mes: protestasEsteMes,
      //   naturaleza_mas_comun: naturalezaMasComun,
      // }); //no borrar

      setStats({
        total_protestas: totalProtestas,
        protestas_este_mes: protestasEsteMes,
        naturaleza_mas_comun: naturalezaMasComun,
      });
      setErrorDetails(null);
    } catch (error) {
      console.error('Error al cargar las estadísticas', error);
      setStats({
        total_protestas: 0,
        protestas_este_mes: 0,
        naturaleza_mas_comun: 'Error al cargar',
      });
      setErrorDetails(error instanceof Error ? error.message : 'Error desconocido');
    }
  };

  if (loading) return <p>Cargando estadísticas...</p>;
  
  if (error || errorDetails) {
    return (
      <Alert
        message="Error al cargar las estadísticas"
        description={
          <div>
            <p>{error || errorDetails}</p>
            <p>Detalles técnicos: {errorDetails}</p>
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
            value={stats.total_protestas}
            prefix={<PieChartOutlined />}
          />
        </Card>
      </Col>
      <Col span={8}>
        <Card>
          <Statistic
            title="Protestas este mes"
            value={stats.protestas_este_mes}
            prefix={<CalendarOutlined />}
          />
        </Card>
      </Col>
      <Col span={8}>
        <Card>
          <Statistic
            title="Naturaleza más común"
            value={stats.naturaleza_mas_comun}
            prefix={<TeamOutlined />}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default ProtestaStats;
