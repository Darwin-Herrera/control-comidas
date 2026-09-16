import { createClient } from '@supabase/supabase-js'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

const response = (body: unknown, status = 200) => {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...cors,
      'Content-Type': 'application/json'
    }
  })
}

Deno.serve(async (req) => {
  // ============================================
  // CORS
  // ============================================

  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: cors
    })
  }

  if (req.method !== 'POST') {
    return response(
      {
        ok: false,
        error: 'Método no permitido.'
      },
      405
    )
  }

  try {
    // ============================================
    // VARIABLES DE ENTORNO DE SUPABASE
    // ============================================

    const url = Deno.env.get('SUPABASE_URL')
    const anon = Deno.env.get('SUPABASE_ANON_KEY')
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!url || !anon || !service) {
      throw new Error(
        'Configuración de Supabase incompleta.'
      )
    }

    // ============================================
    // VALIDAR TOKEN DEL USUARIO ACTUAL
    // ============================================

    const authHeader =
      req.headers.get('Authorization') || ''

    if (!authHeader) {
      throw new Error('No autenticado.')
    }

    const caller = createClient(url, anon, {
      global: {
        headers: {
          Authorization: authHeader
        }
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const {
      data: { user },
      error: userError
    } = await caller.auth.getUser()

    if (userError || !user) {
      throw new Error('No autenticado.')
    }

    // ============================================
    // CLIENTE ADMINISTRATIVO
    // ============================================

    const admin = createClient(url, service, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // ============================================
    // VALIDAR QUE SEA SUPERADMIN
    // ============================================

    const {
      data: perfil,
      error: perfilError
    } = await admin
      .from('perfiles')
      .select('id,rol,activo')
      .eq('id', user.id)
      .single()

    if (perfilError || !perfil) {
      throw new Error(
        'No se encontró el perfil del administrador.'
      )
    }

    if (
      perfil.rol !== 'superadmin' ||
      !perfil.activo
    ) {
      throw new Error(
        'Acceso exclusivo de superadministrador.'
      )
    }

    // ============================================
    // LEER PETICIÓN
    // ============================================

    const body = await req.json()

    const action = String(body?.action || '')

    // ============================================
    // CREAR USUARIO
    // ============================================

    if (action === 'create') {
      const nombre =
        String(body.nombre || '').trim()

      const apellido =
        String(body.apellido || '').trim()

      const celular =
        String(body.celular || '').trim()

      const email =
        String(body.email || '')
          .trim()
          .toLowerCase()

      const password =
        String(body.password || '')

      const rol =
        String(body.rol || 'usuario')

      // ------------------------------------------
      // VALIDACIONES
      // ------------------------------------------

      if (!nombre) {
        throw new Error(
          'El nombre es obligatorio.'
        )
      }

      if (!apellido) {
        throw new Error(
          'El apellido es obligatorio.'
        )
      }

      if (!email) {
        throw new Error(
          'El correo es obligatorio.'
        )
      }

      if (!celular) {
        throw new Error(
          'El número de celular es obligatorio.'
        )
      }

      if (password.length < 8) {
        throw new Error(
          'La contraseña debe contener al menos 8 caracteres.'
        )
      }

      if (
        ![
          'usuario',
          'admin_local',
          'superadmin'
        ].includes(rol)
      ) {
        throw new Error('Rol inválido.')
      }

      // ------------------------------------------
      // CREAR EN SUPABASE AUTH
      // ------------------------------------------

      const {
        data: authData,
        error: authError
      } = await admin.auth.admin.createUser({
        email,
        password,

        // El administrador crea la cuenta
        // ya confirmada.
        email_confirm: true,

        user_metadata: {
          nombre,
          apellido,
          celular
        }
      })

      if (authError) {
        throw authError
      }

      if (!authData.user) {
        throw new Error(
          'No fue posible crear el usuario.'
        )
      }

      const nuevoUsuarioId =
        authData.user.id

      // ------------------------------------------
      // CREAR / ACTUALIZAR PERFIL
      // ------------------------------------------

      const {
        error: profileError
      } = await admin
        .from('perfiles')
        .upsert(
          {
            id: nuevoUsuarioId,
            nombre,
            apellido,
            correo: email,
            celular,
            rol,
            activo: true
          },
          {
            onConflict: 'id'
          }
        )

      // Si falla perfiles, eliminamos Auth
      // para no dejar usuario incompleto.
      if (profileError) {
        await admin.auth.admin.deleteUser(
          nuevoUsuarioId
        )

        throw new Error(
          `No fue posible crear el perfil: ${profileError.message}`
        )
      }

      return response({
        ok: true,
        message:
          'Usuario creado correctamente.',
        user: {
          id: nuevoUsuarioId,
          nombre,
          apellido,
          correo: email,
          celular,
          rol,
          activo: true
        }
      })
    }

    // ============================================
    // EDITAR NOMBRE / APELLIDO / CELULAR
    // ============================================

    if (action === 'profile') {
      const userId =
        String(body.userId || '').trim()

      const nombre =
        String(body.nombre || '').trim()

      const apellido =
        String(body.apellido || '').trim()

      const celular =
        String(body.celular || '').trim()

      if (!userId) {
        throw new Error(
          'Usuario no especificado.'
        )
      }

      if (!nombre) {
        throw new Error(
          'El nombre es obligatorio.'
        )
      }

      if (!apellido) {
        throw new Error(
          'El apellido es obligatorio.'
        )
      }

      if (!celular) {
        throw new Error(
          'El número de celular es obligatorio.'
        )
      }

      // ------------------------------------------
      // ACTUALIZAR TABLA PERFILES
      // ------------------------------------------

      const {
        error: profileUpdateError
      } = await admin
        .from('perfiles')
        .update({
          nombre,
          apellido,
          celular
        })
        .eq('id', userId)

      if (profileUpdateError) {
        throw profileUpdateError
      }

      // ------------------------------------------
      // ACTUALIZAR METADATA AUTH
      // ------------------------------------------

      const {
        error: authUpdateError
      } =
        await admin.auth.admin.updateUserById(
          userId,
          {
            user_metadata: {
              nombre,
              apellido,
              celular
            }
          }
        )

      if (authUpdateError) {
        throw authUpdateError
      }

      return response({
        ok: true,
        message:
          'Datos del usuario actualizados.'
      })
    }

    // ============================================
    // CAMBIAR CONTRASEÑA
    // ============================================

    if (action === 'password') {
      const userId =
        String(body.userId || '').trim()

      const password =
        String(body.password || '')

      if (!userId) {
        throw new Error(
          'Usuario no especificado.'
        )
      }

      if (password.length < 8) {
        throw new Error(
          'La contraseña debe contener al menos 8 caracteres.'
        )
      }

      const {
        error: passwordError
      } =
        await admin.auth.admin.updateUserById(
          userId,
          {
            password
          }
        )

      if (passwordError) {
        throw passwordError
      }

      return response({
        ok: true,
        message:
          'Contraseña actualizada correctamente.'
      })
    }

    // ============================================
    // CAMBIAR ROL
    // ============================================

    if (action === 'role') {
      const userId =
        String(body.userId || '').trim()

      const rol =
        String(body.rol || '').trim()

      if (!userId) {
        throw new Error(
          'Usuario no especificado.'
        )
      }

      if (
        ![
          'usuario',
          'admin_local',
          'superadmin'
        ].includes(rol)
      ) {
        throw new Error('Rol inválido.')
      }

      // Evitar quitarse su propio acceso
      if (
        userId === user.id &&
        rol !== 'superadmin'
      ) {
        throw new Error(
          'No puedes quitar tu propio rol de superadministrador.'
        )
      }

      const {
        error: roleError
      } = await admin
        .from('perfiles')
        .update({
          rol
        })
        .eq('id', userId)

      if (roleError) {
        throw roleError
      }

      return response({
        ok: true,
        message: 'Rol actualizado.'
      })
    }

    // ============================================
    // ACTIVAR / DESACTIVAR USUARIO
    // ============================================

    if (action === 'active') {
      const userId =
        String(body.userId || '').trim()

      const activo =
        body.activo === true

      if (!userId) {
        throw new Error(
          'Usuario no especificado.'
        )
      }

      // Evitar desactivar la propia cuenta
      if (
        userId === user.id &&
        !activo
      ) {
        throw new Error(
          'No puedes desactivar tu propia cuenta.'
        )
      }

      const {
        error: activeError
      } = await admin
        .from('perfiles')
        .update({
          activo
        })
        .eq('id', userId)

      if (activeError) {
        throw activeError
      }

      return response({
        ok: true,
        message: activo
          ? 'Usuario activado correctamente.'
          : 'Usuario desactivado correctamente.'
      })
    }

    // ============================================
    // ACCIÓN DESCONOCIDA
    // ============================================

    throw new Error(
      'Acción no soportada.'
    )
  } catch (error) {
    console.error(
      'admin-users error:',
      error
    )

    const message =
      error instanceof Error
        ? error.message
        : 'Error desconocido.'

    return response(
      {
        ok: false,
        error: message
      },
      400
    )
  }
})