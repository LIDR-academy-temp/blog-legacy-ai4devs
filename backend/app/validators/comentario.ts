import vine from '@vinejs/vine'

/**
 * Validación deliberadamente laxa: hoy cada campo tiene su propia regla de
 * negocio con su propio código de estado y su propia forma de respuesta
 * (nombre → 400, email → 422, email inválido → 400, cuerpo corto → 200
 * ok:false). Eso vive en el servicio, para no cambiar el contrato actual;
 * aquí solo se fija la forma básica del payload.
 */
export const crearComentarioValidator = vine.create({
  autor_nombre: vine.string().optional(),
  autor_email: vine.string().optional(),
  cuerpo: vine.string().optional(),
  padre_id: vine.number().nullable().optional(),
})

export const actualizarComentarioValidator = vine.create({
  autor_email: vine.string().optional(),
  cuerpo: vine.string().optional(),
})

export const eliminarComentarioValidator = vine.create({
  autor_email: vine.string().optional(),
})
