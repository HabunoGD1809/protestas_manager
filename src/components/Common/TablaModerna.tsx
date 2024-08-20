import React from 'react';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';

interface Columna<T> {
   key: string;
   title: string;
   dataIndex: keyof T;
   render?: (value: T[keyof T], record: T) => React.ReactNode;
}

interface TablaModernaProps<T> {
   datos: T[];
   columnas: Columna<T>[];
}

function TablaModerna<T extends Record<string, never>>({ datos, columnas }: TablaModernaProps<T>) {
   const [columnaOrdenada, setColumnaOrdenada] = React.useState('');
   const [direccionOrden, setDireccionOrden] = React.useState<'asc' | 'desc'>('asc');

   const manejarOrden = (columna: string) => {
      if (columnaOrdenada === columna) {
         setDireccionOrden(direccionOrden === 'asc' ? 'desc' : 'asc');
      } else {
         setColumnaOrdenada(columna);
         setDireccionOrden('asc');
      }
   };

   const datosOrdenados = React.useMemo(() => {
      if (!columnaOrdenada) return datos;
      return [...datos].sort((a, b) => {
         if (a[columnaOrdenada] < b[columnaOrdenada]) return direccionOrden === 'asc' ? -1 : 1;
         if (a[columnaOrdenada] > b[columnaOrdenada]) return direccionOrden === 'asc' ? 1 : -1;
         return 0;
      });
   }, [datos, columnaOrdenada, direccionOrden]);

   return (
      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
         <table className="w-full table-auto">
            <thead className="bg-gray-50">
               <tr>
                  {columnas.map((columna) => (
                     <th
                        key={columna.key}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => manejarOrden(columna.key)}
                     >
                        <div className="flex items-center">
                           {columna.title}
                           {columnaOrdenada === columna.key && (
                              direccionOrden === 'asc' ? (
                                 <ChevronUpIcon className="w-4 h-4 ml-1" />
                              ) : (
                                 <ChevronDownIcon className="w-4 h-4 ml-1" />
                              )
                           )}
                        </div>
                     </th>
                  ))}
               </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
               {datosOrdenados.map((fila, indice) => (
                  <tr key={indice} className="hover:bg-gray-50">
                     {columnas.map((columna) => (
                        <td key={columna.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                           {columna.render ? columna.render(fila[columna.dataIndex], fila) : fila[columna.dataIndex]}
                        </td>
                     ))}
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
   );
}

export default TablaModerna;
