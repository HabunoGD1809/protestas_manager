import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Protesta, Naturaleza, Provincia, Cabecilla } from "../../types/types";
import { useAuth } from "../../hooks/useAuth";
import { Typography, Button, Tooltip, message, Modal } from "antd";
import { PlusOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import ProtestaFilter, { FilterValues } from "./ProtestaFilter";
import { protestaService } from "../../services/apiService";
import LoadingSpinner from "../Common/LoadingSpinner";
import ErrorMessage from "../Common/ErrorMessage";
import CommonTable from "../Common/CommonTable";
import { cacheService } from "../../services/cacheService";
import { logError } from "../../services/loggingService";

const { Title } = Typography;
const { confirm } = Modal;

const ProtestaList: React.FC = () => {
  const [protestas, setProtestas] = useState<Protesta[]>([]);
  const [naturalezas, setNaturalezas] = useState<Naturaleza[]>([]);
  const [provincias, setProvincias] = useState<Provincia[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState<FilterValues>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const fetchProtestas = useCallback(
    async (page: number, pageSize: number, currentFilters: FilterValues) => {
      setLoading(true);
      setError(null);
      const cacheKey = `protestas_${page}_${pageSize}_${JSON.stringify(currentFilters)}`;

      try {
        const cachedData = cacheService.get<{
          items: Protesta[];
          page: number;
          page_size: number;
          total: number;
        }>(cacheKey);

        if (cachedData) {
          setProtestas(cachedData.items);
          setPagination({
            current: cachedData.page,
            pageSize: cachedData.page_size,
            total: cachedData.total,
          });
          setLoading(false);

          // Actualizar en segundo plano
          protestaService
            .fetchProtestas(page, pageSize, currentFilters)
            .then((freshData) => {
              if (JSON.stringify(freshData) !== JSON.stringify(cachedData)) {
                setProtestas(freshData.items);
                setPagination({
                  current: freshData.page,
                  pageSize: freshData.page_size,
                  total: freshData.total,
                });
                cacheService.set(cacheKey, freshData);
              }
            })
            .catch((error) =>
              logError("Error actualizando protestas en segundo plano", error)
            );
        } else {
          const data = await protestaService.fetchProtestas(page, pageSize, currentFilters);
          setProtestas(data.items);
          setPagination({
            current: data.page,
            pageSize: data.page_size,
            total: data.total,
          });
          cacheService.set(cacheKey, data);
        }
      } catch (error) {
        logError("Error fetching protestas", error as Error);
        setError("Error al cargar la lista de protestas");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchNaturalezasYProvincias = useCallback(async () => {
    try {
      const [naturalezasData, provinciasData] = await protestaService.fetchNaturalezasYProvincias();
      setNaturalezas(naturalezasData);
      setProvincias(provinciasData);
    } catch (error) {
      console.error('Error al obtener naturalezas y provincias:', error);
      setError("Error al cargar naturalezas y provincias");
    }
  }, []);

  useEffect(() => {
    fetchProtestas(pagination.current, pagination.pageSize, filters);
  }, [fetchProtestas, pagination.current, pagination.pageSize, filters]);

  useEffect(() => {
    fetchNaturalezasYProvincias();
  }, [fetchNaturalezasYProvincias]);

  useEffect(() => {
    const handlePotentialDataUpdate = () => {
      cacheService.markAllAsStale();
      fetchProtestas(pagination.current, pagination.pageSize, filters);
      fetchNaturalezasYProvincias();
    };

    window.addEventListener("potentialDataUpdate", handlePotentialDataUpdate);

    return () => {
      window.removeEventListener("potentialDataUpdate", handlePotentialDataUpdate);
    };
  }, [fetchProtestas, fetchNaturalezasYProvincias, pagination, filters]);

  const handleViewDetails = useCallback(
    (protesta: Protesta) => {
      navigate(`/protestas/${protesta.id}`);
    },
    [navigate]
  );

  const handleDeleteClick = useCallback((protesta: Protesta) => {
    confirm({
      title: "¿Estás seguro de que quieres eliminar esta protesta?",
      icon: <ExclamationCircleOutlined />,
      content: `Se eliminará la protesta "${protesta.nombre}"`,
      okText: "Sí",
      okType: "danger",
      cancelText: "No",
      onOk: async () => {
        try {
          await protestaService.delete(protesta.id);
          setProtestas((prevProtestas) =>
            prevProtestas.filter((p) => p.id !== protesta.id)
          );
          message.success("Protesta eliminada exitosamente");
          cacheService.invalidateRelatedCache("protestas_");
        } catch (error) {
          console.error("Error al eliminar la protesta:", error);
          message.error("Error al eliminar la protesta");
        }
      },
    });
  }, []);

  const handleFilter = useCallback((newFilters: FilterValues) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, []);

  const columns = useMemo(
    () => [
      {
        title: "Nombre",
        dataIndex: "nombre",
        key: "nombre",
      },
      {
        title: "Naturaleza",
        dataIndex: "naturaleza_id",
        key: "naturaleza_id",
        render: (value: string) => {
          const naturaleza = naturalezas.find((n) => n.id === value);
          return <span>{naturaleza ? naturaleza.nombre : "N/A"}</span>;
        },
      },
      {
        title: "Provincia",
        dataIndex: "provincia_id",
        key: "provincia_id",
        render: (value: string) => {
          const provincia = provincias.find((p) => p.id === value);
          return <span>{provincia ? provincia.nombre : "N/A"}</span>;
        },
      },
      {
        title: "Fecha del Evento",
        dataIndex: "fecha_evento",
        key: "fecha_evento",
      },
      {
        title: "Cabecillas",
        dataIndex: "cabecillas",
        key: "cabecillas",
        render: (cabecillas: Cabecilla[]) => (
          <Tooltip title={cabecillas.map(c => `${c.nombre} ${c.apellido}`).join(", ")}>
            <span>{`${cabecillas.length} cabecilla${cabecillas.length !== 1 ? "s" : ""}`}</span>
          </Tooltip>
        ),
      },
      {
        title: "Creador",
        dataIndex: "creador_nombre",
        key: "creador_nombre",
        render: (value: string, record: Protesta) => (
          <Tooltip title={record.creador_email}>
            <span>{value || "N/A"}</span>
          </Tooltip>
        ),
      },
    ],
    [naturalezas, provincias]
  );

  if (loading && protestas.length === 0) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <Title level={2}>Lista de Protestas</Title>
      <ProtestaFilter
        naturalezas={naturalezas}
        provincias={provincias}
        onFilter={handleFilter}
        initialFilters={filters}
      />
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => navigate("/protestas/crear")}
        style={{ marginBottom: 16 }}
      >
        Añadir Protesta
      </Button>
      <CommonTable
        data={protestas}
        columns={columns}
        pagination={{
          ...pagination,
          onChange: (page, pageSize) =>
            setPagination(prev => ({ ...prev, current: page, pageSize })),
        }}
        loading={loading}
        onEdit={handleViewDetails}
        onDelete={handleDeleteClick}
        isAdmin={isAdmin()}
        editIcon="eye" 
        editTooltip="Ver detalles"  
      />
    </div>
  );
};

export default ProtestaList;
