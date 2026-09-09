import { DateTime } from 'luxon'
import Comentario from '#models/comentario'

export default class ComentarioRepository {
  async buscarPorId(id: number) {
    return Comentario.find(id)
  }

  async crear(datos: {
    postId: number
    autorNombre: string
    autorEmail: string
    cuerpo: string
    padreId: number | null
  }) {
    return Comentario.create({
      postId: datos.postId,
      autorNombre: datos.autorNombre,
      autorEmail: datos.autorEmail,
      cuerpo: datos.cuerpo,
      estado: 'pendiente',
      creadoEn: DateTime.now(),
      padreId: datos.padreId,
    })
  }

  async actualizarCuerpo(comentario: Comentario, cuerpo: string) {
    comentario.cuerpo = cuerpo
    await comentario.save()
    return comentario
  }

  async eliminar(comentario: Comentario) {
    await comentario.delete()
  }
}
