import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { Card, Statistic, Row, Col } from 'antd';
import { PieChartOutlined, CalendarOutlined, TeamOutlined } from '@ant-design/icons';
import { Protesta } from '../../types';
import dayjs from 'dayjs';

const ProtestaStats: React.FC = () => {
  const [stats, setStats] = useState({
    total_protestas: 0,
    protestas_este_mes: 0,
    naturaleza_mas_comun: '',
  });
  const { request, loading, error } = useApi();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await request<{ items: Protesta[], total: number }>('get', '/protestas');
      const protestas = response.items || [];
      const totalProtestas = response.total || 0;
      
      const protestasEsteMes = protestas.filter(p => 
        dayjs(p.fecha_evento).isSame(dayjs(), 'month')
      ).length;

      const naturalezaCount: { [key: string]: number } = {};
      protestas.forEach(p => {
        naturalezaCount[p.naturaleza_id] = (naturalezaCount[p.naturaleza_id] || 0) + 1;
      });
      const naturalezaMasComun = Object.entries(naturalezaCount).reduce((a, b) => a[1] > b[1] ? a : b, ['', 0])[0];

      setStats({
        total_protestas: totalProtestas,
        protestas_este_mes: protestasEsteMes,
        naturaleza_mas_comun: naturalezaMasComun,
      });
    } catch (error) {
      console.error('Error al cargar las estadísticas', error);
    }
  };

  if (loading) return <p>Cargando estadísticas...</p>;
  if (error) return <p>Error al cargar las estadísticas: {error}</p>;

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
            title="ID Naturaleza más común"
            value={stats.naturaleza_mas_comun}
            prefix={<TeamOutlined />}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default ProtestaStats;
