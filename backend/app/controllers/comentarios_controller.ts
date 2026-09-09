import type { HttpContext } from '@adonisjs/core/http'
import { ComentarioService } from '#services/comentario_service'
import ComentarioTransformer from '#transformers/comentario_transformer'
import {
  crearComentarioValidator,
  actualizarComentarioValidator,
  eliminarComentarioValidator,
} from '#validators/comentario'

export default class ComentariosController {
  constructor(private comentarios = new ComentarioService()) {}

  async store({ params, request, response, serialize }: HttpContext) {
    const datos = await request.validateUsing(crearComentarioValidator)
    const resultado = await this.comentarios.crear(params.slug, datos)

    switch (resultado.tipo) {
      case 'post_no_encontrado':
        return response.status(404).send({ error: 'Post no encontrado' })
      case 'nombre_requerido':
        return response.status(400).send({ error: 'El nombre es obligatorio' })
      case 'email_requerido':
        return response.status(422).send({ message: 'Falta el email' })
      case 'email_invalido':
        return response.status(400).send({ errores: ['email no válido'] })
      case 'cuerpo_corto':
        return response.send({ ok: false, motivo: 'comentario demasiado corto' })
      case 'creado':
        return response.status(201).send({
          comentario: await serialize.withoutWrapping(
            ComentarioTransformer.transform(resultado.comentario)
          ),
        })
    }
  }

  async destroy({ params, request, response }: HttpContext) {
    const datos = await request.validateUsing(eliminarComentarioValidator)
    const resultado = await this.comentarios.eliminar(Number(params.id), {
      claveModeracion: request.header('x-clave-moderacion'),
      autorEmail: datos.autor_email,
    })

    switch (resultado.tipo) {
      case 'no_encontrado':
        return response.status(404).send({ error: 'Comentario no encontrado' })
      case 'sin_permiso':
        return response.status(403).send({ error: 'No puedes borrar este comentario' })
      case 'borrado':
        return response.status(200).send({ borrado: true })
    }
  }

  async update({ params, request, response, serialize }: HttpContext) {
    const datos = await request.validateUsing(actualizarComentarioValidator)
    const resultado = await this.comentarios.actualizar(Number(params.id), {
      autorEmail: datos.autor_email,
      cuerpo: datos.cuerpo,
    })

    switch (resultado.tipo) {
      case 'no_encontrado':
        return response.status(404).send({ error: 'Comentario no encontrado' })
      case 'sin_permiso':
        return response.status(403).send({ error: 'No puedes editar este comentario' })
      case 'cuerpo_requerido':
        return response.status(400).send({ error: 'Falta el cuerpo' })
      case 'actualizado':
        return response.status(200).send({
          comentario: await serialize.withoutWrapping(
            ComentarioTransformer.transform(resultado.comentario)
          ),
        })
    }
  }
}
