# Control de Comidas

Proyecto React + Vite + Supabase con tres roles:
- usuario
- admin_local
- superadmin

## 1. Crear Supabase
1. Crea un proyecto nuevo.
2. Abre SQL Editor.
3. Copia y ejecuta `supabase/schema.sql`.
4. En Authentication > Users crea TU usuario con correo y contraseña.
5. El trigger creará el perfil automáticamente.
6. En SQL Editor ejecuta:
   `update public.perfiles set rol='superadmin' where lower(correo)=lower('TU_CORREO@DOMINIO.COM');`

## 2. Variables de React
En Supabase copia Project URL y la clave pública (anon/publishable).
Copia `.env.example` a `.env` y rellena:
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...

NUNCA pongas service_role en `.env` de Vite.

## 3. Edge Function para administración de usuarios
La pantalla de superadmin crea usuarios y restablece contraseñas mediante una función de servidor.
Con Supabase CLI instalado y enlazado al proyecto:
`supabase login`
`supabase link --project-ref TU_PROJECT_REF`
`supabase functions deploy admin-users`

Supabase proporciona a la Edge Function las variables SUPABASE_URL, SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY.

## 4. Ejecutar en VS Code
Abre la carpeta del proyecto y en Terminal:
`npm install`
`npm run dev`

Abre la URL que muestre Vite (normalmente http://localhost:5173).

## 5. Prueba mínima
1. Entra con el superadmin.
2. Sistema > Usuarios y permisos > crea un usuario normal.
3. Cierra sesión e ingresa con ese usuario.
4. Hacer pedido > agrega productos > Confirmar.
5. Revisa Mi consumo.
6. Vuelve como superadmin > Administración > Pedidos.
7. Filtra el usuario y modifica cantidades.
8. Productos: cambia un precio y comprueba que pedidos históricos conservan su precio anterior.

## Seguridad
RLS está habilitado. Un usuario ve sus pedidos; admin_local ve la operación del local; superadmin además administra cuentas. Las contraseñas existentes nunca se muestran. El cambio propio usa Supabase Auth; el cambio administrativo usa la Edge Function y service_role solo en servidor.
