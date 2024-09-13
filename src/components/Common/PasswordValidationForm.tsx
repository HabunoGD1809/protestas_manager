// import React from 'react';
// import { TextField, Button, Box } from '@mui/material';

// interface PasswordValidationFormProps {
//    onSubmit: (nuevaContrasena: string) => void;
//    esRestablecimientoAdmin: boolean;
// }

// const PasswordValidationForm: React.FC<PasswordValidationFormProps> = ({
//    onSubmit,
//    esRestablecimientoAdmin,
// }) => {
//    const [nuevaContrasena, setNuevaContrasena] = React.useState('');
//    const [confirmarContrasena, setConfirmarContrasena] = React.useState('');
//    const [errorNuevaContrasena, setErrorNuevaContrasena] = React.useState('');
//    const [errorConfirmarContrasena, setErrorConfirmarContrasena] = React.useState('');

//    const validarContrasena = (contrasena: string): string => {
//       if (contrasena.length < 8) {
//          return 'La contraseña debe tener al menos 8 caracteres';
//       }
//       if (!/[A-Z]/.test(contrasena)) {
//          return 'La contraseña debe contener al menos una letra mayúscula';
//       }
//       if (!/[a-z]/.test(contrasena)) {
//          return 'La contraseña debe contener al menos una letra minúscula';
//       }
//       if (!/[0-9]/.test(contrasena)) {
//          return 'La contraseña debe contener al menos un número';
//       }
//       return '';
//    };

//    const manejarEnvio = (e: React.FormEvent) => {
//       e.preventDefault();
//       if (nuevaContrasena === confirmarContrasena && !errorNuevaContrasena) {
//          onSubmit(nuevaContrasena);
//       }
//    };

//    React.useEffect(() => {
//       setErrorNuevaContrasena(validarContrasena(nuevaContrasena));
//    }, [nuevaContrasena]);

//    React.useEffect(() => {
//       setErrorConfirmarContrasena(nuevaContrasena !== confirmarContrasena ? 'Las contraseñas no coinciden' : '');
//    }, [nuevaContrasena, confirmarContrasena]);

//    return (
//       <Box component="form" onSubmit={manejarEnvio} noValidate sx={{ mt: 1 }}>
//          <TextField
//             margin="normal"
//             required
//             fullWidth
//             name="nuevaContrasena"
//             label="Nueva Contraseña"
//             type="password"
//             id="nuevaContrasena"
//             autoComplete="new-password"
//             value={nuevaContrasena}
//             onChange={(e) => setNuevaContrasena(e.target.value)}
//             error={!!errorNuevaContrasena}
//             helperText={errorNuevaContrasena}
//          />
//          <TextField
//             margin="normal"
//             required
//             fullWidth
//             name="confirmarContrasena"
//             label="Confirmar Nueva Contraseña"
//             type="password"
//             id="confirmarContrasena"
//             autoComplete="new-password"
//             value={confirmarContrasena}
//             onChange={(e) => setConfirmarContrasena(e.target.value)}
//             error={!!errorConfirmarContrasena}
//             helperText={errorConfirmarContrasena}
//          />
//          <Button
//             type="submit"
//             fullWidth
//             variant="contained"
//             sx={{ mt: 3, mb: 2 }}
//             disabled={!nuevaContrasena || !confirmarContrasena || !!errorNuevaContrasena || !!errorConfirmarContrasena}
//          >
//             {esRestablecimientoAdmin ? 'Restablecer Contraseña' : 'Cambiar Contraseña'}
//          </Button>
//       </Box>
//    );
// };

// export default PasswordValidationForm;
