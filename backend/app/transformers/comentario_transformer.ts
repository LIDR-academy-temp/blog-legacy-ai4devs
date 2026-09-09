import { BaseTransformer } from '@adonisjs/core/transformers'
import Comentario from '#models/comentario'

/**
 * Mismos nombres de campo que devolvía el `select *` de start/routes.ts
 * (snake_case): el frontend y los tests de caracterización dependen de
 * ellos tal cual.
 */
export default class ComentarioTransformer extends BaseTransformer<Comentario> {
  toObject() {
    return {
      id: this.resource.id,
      post_id: this.resource.postId,
      autor_nombre: this.resource.autorNombre,
      autor_email: this.resource.autorEmail,
      cuerpo: this.resource.cuerpo,
      estado: this.resource.estado,
      creado_en: this.resource.creadoEn?.toFormat('yyyy-MM-dd HH:mm:ss') ?? null,
      padre_id: this.resource.padreId,
    }
  }
}
