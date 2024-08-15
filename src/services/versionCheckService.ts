import { api } from './api';
import { cacheService } from './cacheService';

let currentVersion = '';

export const checkForUpdates = async () => {
  try {
    const response = await api.get<{ version: string }>('/api/version');
    const newVersion = response.data.version;

    if (newVersion !== currentVersion) {
      currentVersion = newVersion;
      // Invalida todos los cachés relevantes
      cacheService.remove('protestas');
      cacheService.remove('naturalezas');
      cacheService.remove('cabecillas');
      // ... invalidar otros cachés según sea necesario ...

      // Notifica a la aplicación que los datos han sido actualizados
      window.dispatchEvent(new CustomEvent('dataUpdated'));
    }
  } catch (error) {
    console.error('Error checking for updates:', error);
  }
};

// Ejecuta checkForUpdates inmediatamente al cargar la aplicación
checkForUpdates();

// Luego, configura el intervalo para verificar actualizaciones cada 5 minutos
setInterval(checkForUpdates, 5 * 60 * 1000);

// Opcional: Agregar un listener para el evento 'online' para verificar actualizaciones cuando se restaure la conexión
window.addEventListener('online', checkForUpdates);
