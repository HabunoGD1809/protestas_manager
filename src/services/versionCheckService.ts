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

setInterval(checkForUpdates, 5 * 60 * 1000); // Cada 5 minutos
