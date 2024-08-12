import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { obtenerUsuarioActual } from '../services/api';
import { Box, Avatar, Heading, Text, Center, Spinner, Alert, AlertIcon, VStack } from '@chakra-ui/react';

const UserProfilePage: React.FC = () => {
   const [user, setUser] = useState<User | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   useEffect(() => {
      const fetchUserProfile = async () => {
         try {
            const userData = await obtenerUsuarioActual();
            setUser(userData);
            setLoading(false);
         } catch (err) {
            setError('Error al cargar el perfil de usuario');
            setLoading(false);
         }
      };

      fetchUserProfile();
   }, []);

   if (loading) return <Center h="100vh"><Spinner size="xl" color="blue.500" /></Center>;
   if (error) return <Center h="100vh"><Alert status="error" variant="subtle"><AlertIcon />{error}</Alert></Center>;
   if (!user) return <Center h="100vh"><Text>No se encontró información del usuario</Text></Center>;

   return (
      <Center h="100vh" bg="gray.50">
         <Box maxW="sm" w="full" bg="white" boxShadow="lg" rounded="md" p={6}>
            <VStack spacing={4}>
               <Box
                  borderRadius="full"
                  border="4px solid"
                  borderColor="blue.500"
                  p={1}
               >
                  <Avatar
                     src={user.foto}
                     size="md"
                     name={`${user.nombre} ${user.apellidos}`}
                  />
               </Box>
               <Heading size="md" textAlign="center">{user.nombre} {user.apellidos}</Heading>
               <Text fontSize="sm" color="gray.500">{user.email}</Text>
               <Text fontSize="sm" fontWeight="bold" color="blue.600">Rol: {user.rol}</Text>
            </VStack>
         </Box>
      </Center>
   );
};

export default UserProfilePage;
