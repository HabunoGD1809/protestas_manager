import { useState, useCallback, useRef } from 'react';

interface ConcurrencyOptions {
   timeout?: number;
   retries?: number;
}

export const useConcurrency = (defaultOptions: ConcurrencyOptions = {}) => {
   const [isProcessing, setIsProcessing] = useState(false);
   const operationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

   const runWithLock = useCallback(async <T>(
      operation: () => Promise<T>,
      options: ConcurrencyOptions = {}
   ): Promise<T | undefined> => {
      const { timeout = defaultOptions.timeout || 30000, retries = defaultOptions.retries || 0 } = options;

      if (isProcessing) {
         console.warn('Una operación ya está en progreso');
         return;
      }

      setIsProcessing(true);

      const executeOperation = async (retriesLeft: number): Promise<T | undefined> => {
         try {
            // Establecer un timeout para la operación
            const timeoutPromise = new Promise<never>((_, reject) => {
               operationTimeoutRef.current = setTimeout(() => {
                  reject(new Error('La operación ha excedido el tiempo límite'));
               }, timeout);
            });

            // Ejecutar la operación con un límite de tiempo
            const result = await Promise.race([operation(), timeoutPromise]);

            clearTimeout(operationTimeoutRef.current!);
            return result as T;
         } catch (error) {
            if (retriesLeft > 0) {
               console.warn(`Error en la operación, reintentando. Intentos restantes: ${retriesLeft}`);
               return executeOperation(retriesLeft - 1);
            }
            throw error;
         }
      };

      try {
         return await executeOperation(retries);
      } catch (error) {
         console.error('Error en la operación:', error);
         throw error;
      } finally {
         setIsProcessing(false);
         if (operationTimeoutRef.current) {
            clearTimeout(operationTimeoutRef.current);
         }
      }
   }, [isProcessing, defaultOptions]);

   const cancelOperation = useCallback(() => {
      if (operationTimeoutRef.current) {
         clearTimeout(operationTimeoutRef.current);
      }
      setIsProcessing(false);
   }, []);

   return { isProcessing, runWithLock, cancelOperation };
};
