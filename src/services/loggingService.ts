import { AxiosError } from 'axios';

type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
   level: LogLevel;
   message: string;
   details?: unknown;
   timestamp: string;
}

interface ErrorDetails {
   name?: string;
   message?: string;
   stack?: string;
   code?: string | number;
   config?: unknown;
   response?: unknown;
   url?: string;
   method?: string;
   [key: string]: unknown;
}

class LoggingService {
   private logQueue: LogEntry[] = [];
   private maxQueueSize = 1000; // Limitar el tamaño de la cola para evitar problemas de memoria

   private addToQueue(level: LogLevel, message: string, details?: unknown) {
      const logEntry: LogEntry = {
         level,
         message,
         details,
         timestamp: new Date().toISOString(),
      };

      this.logQueue.push(logEntry);

      if (this.logQueue.length > this.maxQueueSize) {
         this.logQueue.shift(); // Eliminar el log más antiguo si excedemos el tamaño máximo
      }

      this.printLog(logEntry);
   }

   private printLog(logEntry: LogEntry) {
      const { level, message, details, timestamp } = logEntry;

      console.group(`[${level.toUpperCase()}] ${timestamp}`);
      console.log(message);
      if (details) {
         console.log('Details:', details);
      }
      console.groupEnd();
   }

   info(message: string, details?: unknown) {
      this.addToQueue('info', message, details);
   }

   warn(message: string, details?: unknown) {
      this.addToQueue('warn', message, details);
   }

   error(message: string, details?: unknown) {
      this.addToQueue('error', message, details);
   }

   logError(message: string, error: unknown) {
      const errorDetails: ErrorDetails = {};

      if (error instanceof Error) {
         errorDetails.name = error.name;
         errorDetails.message = error.message;
         errorDetails.stack = error.stack;
      }

      if (error instanceof AxiosError) {
         errorDetails.code = error.code;
         errorDetails.config = error.config;
         errorDetails.response = error.response?.data;
         errorDetails.url = error.config?.url;
         errorDetails.method = error.config?.method;
      }

      // Para otros tipos de errores o propiedades adicionales
      if (typeof error === 'object' && error !== null) {
         Object.entries(error).forEach(([key, value]) => {
            if (!(key in errorDetails)) {
               errorDetails[key] = value;
            }
         });
      }

      this.error(message, errorDetails);
   }

   getLogs(): LogEntry[] {
      return [...this.logQueue];
   }

   clearLogs() {
      this.logQueue = [];
   }

   downloadLogs() {
      const logsJson = JSON.stringify(this.logQueue, null, 2);
      const blob = new Blob([logsJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `app_logs_${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
   }
}

export const loggingService = new LoggingService();

export const logError = loggingService.logError.bind(loggingService);
export const logInfo = loggingService.info.bind(loggingService);
export const logWarn = loggingService.warn.bind(loggingService);
