import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Protesta, Naturaleza, Provincia, Cabecilla, PaginatedResponse } from "../../types/types";
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

interface AllData {
  protestas: PaginatedResponse<Protesta>;
  naturalezas: Naturaleza[];
  provincias: Provincia[];
  cabecillas: Cabecilla[];
}

const ProtestaList: React.FC = () => {
  const [allData, setAllData] = useState<AllData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterValues>({});
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const cacheKey = `protestas_all_data_${pagination.current}_${pagination.pageSize}_${JSON.stringify(filters)}`;

    try {
      const cachedData = cacheService.get<AllData>(cacheKey);

      if (cachedData) {
        setAllData(cachedData);
        setLoading(false);

        // Actualizar en segundo plano
        protestaService.fetchAllData(pagination.current, pagination.pageSize, filters)
          .then((newData) => {
            if (JSON.stringify(newData) !== JSON.stringify(cachedData)) {
              setAllData(newData);
              cacheService.set(cacheKey, newData);
            }
          })
          .catch(error => logError("Error actualizando datos en segundo plano", error));
      } else {
        const newData = await protestaService.fetchAllData(pagination.current, pagination.pageSize, filters);
        setAllData(newData);
        cacheService.set(cacheKey, newData);
      }
    } catch (error) {
      logError("Error fetching all data", error as Error);
      setError("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, filters]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    const handlePotentialDataUpdate = () => {
      cacheService.markAllAsStale();
      fetchAllData();
    };

    window.addEventListener("potentialDataUpdate", handlePotentialDataUpdate);

    return () => {
      window.removeEventListener("potentialDataUpdate", handlePotentialDataUpdate);
    };
  }, [fetchAllData]);

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
          setAllData(prevData => prevData ? {
            ...prevData,
            protestas: {
              ...prevData.protestas,
              items: prevData.protestas.items.filter(p => p.id !== protesta.id)
            }
          } : null);
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
          const naturaleza = allData?.naturalezas.find((n) => n.id === value);
          return <span>{naturaleza ? naturaleza.nombre : "N/A"}</span>;
        },
      },
      {
        title: "Provincia",
        dataIndex: "provincia_id",
        key: "provincia_id",
        render: (value: string) => {
          const provincia = allData?.provincias.find((p) => p.id === value);
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
    [allData]
  );

  if (loading && !allData) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <Title level={2}>Lista de Protestas</Title>
      {allData && (
        <ProtestaFilter
          naturalezas={allData.naturalezas}
          provincias={allData.provincias}
          cabecillas={allData.cabecillas}
          onFilter={handleFilter}
          initialFilters={filters}
        />
      )}
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => navigate("/protestas/crear")}
        style={{ marginBottom: 16 }}
      >
        Añadir Protesta
      </Button>
      {allData && (
        <CommonTable
          data={allData.protestas.items}
          columns={columns}
          pagination={{
            ...pagination,
            total: allData.protestas.total,
            onChange: (page, pageSize) =>
              setPagination(prev => ({ ...prev, current: page, pageSize })),
          }}
          loading={loading}
          onEdit={handleViewDetails}
          onDelete={handleDeleteClick}
          isAdmin={isAdmin}
          editIcon="eye"
          editTooltip="Ver detalles"
        />
      )}
    </div>
  );
};

export default ProtestaList;
