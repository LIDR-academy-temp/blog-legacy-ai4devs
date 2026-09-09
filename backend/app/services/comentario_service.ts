import Comentario from '#models/comentario'
import ComentarioRepository from '#repositories/comentario_repository'
import PostRepository from '#repositories/post_repository'

/**
 * Clave con la que se validan las acciones de moderación. Sigue hardcodeada
 * (deuda heredada de start/routes.ts, no se toca en este refactor: ver nota
 * de bugs aparte en el PR).
 */
const CLAVE_MODERACION = 'dev-secret-cambiar'

type ResultadoCrear =
  | { tipo: 'post_no_encontrado' }
  | { tipo: 'nombre_requerido' }
  | { tipo: 'email_requerido' }
  | { tipo: 'email_invalido' }
  | { tipo: 'cuerpo_corto' }
  | { tipo: 'creado'; comentario: Comentario }

type ResultadoEliminar = { tipo: 'no_encontrado' } | { tipo: 'sin_permiso' } | { tipo: 'borrado' }

type ResultadoActualizar =
  | { tipo: 'no_encontrado' }
  | { tipo: 'sin_permiso' }
  | { tipo: 'cuerpo_requerido' }
  | { tipo: 'actualizado'; comentario: Comentario }

export class ComentarioService {
  constructor(
    private comentarioRepositorio = new ComentarioRepository(),
    private postRepositorio = new PostRepository()
  ) {}

  /**
   * Cada rama conserva su código de estado y su forma de respuesta tal como
   * están hoy en start/routes.ts: no es un contrato coherente (400, 422, 400,
   * 200 con ok:false), pero cambiarlo es una decisión aparte, no de este
   * refactor.
   */
  async crear(
    slug: string,
    datos: { autor_nombre?: string; autor_email?: string; cuerpo?: string; padre_id?: number | null }
  ): Promise<ResultadoCrear> {
    const post = await this.postRepositorio.buscarPublicadoPorSlug(slug)
    if (!post) return { tipo: 'post_no_encontrado' }

    const nombre = datos.autor_nombre
    const email = datos.autor_email
    const cuerpo = datos.cuerpo

    if (!nombre) return { tipo: 'nombre_requerido' }
    if (!email) return { tipo: 'email_requerido' }
    if (!email.includes('@')) return { tipo: 'email_invalido' }
    if (!cuerpo || cuerpo.length < 5) return { tipo: 'cuerpo_corto' }

    const comentario = await this.comentarioRepositorio.crear({
      postId: post.id,
      autorNombre: nombre,
      autorEmail: email,
      cuerpo,
      padreId: datos.padre_id ?? null,
    })

    return { tipo: 'creado', comentario }
  }

  /**
   * Puede borrar quien lo escribió (comparación sin distinguir mayúsculas)
   * o cualquiera que traiga la clave de moderación.
   */
  async eliminar(
    id: number,
    opciones: { claveModeracion?: string; autorEmail?: string }
  ): Promise<ResultadoEliminar> {
    const comentario = await this.comentarioRepositorio.buscarPorId(id)
    if (!comentario) return { tipo: 'no_encontrado' }

    const esModerador = opciones.claveModeracion === CLAVE_MODERACION
    const esAutor =
      comentario.autorEmail.toLowerCase().trim() ===
      String(opciones.autorEmail ?? '')
        .toLowerCase()
        .trim()

    if (!esModerador && !esAutor) return { tipo: 'sin_permiso' }

    await this.comentarioRepositorio.eliminar(comentario)
    return { tipo: 'borrado' }
  }

  /**
   * Regla distinta a la de eliminar, y no es una decisión de este refactor
   * unificarla: comparación sensible a mayúsculas, sin clave de moderación,
   * y solo si el comentario sigue pendiente.
   */
  async actualizar(
    id: number,
    datos: { autorEmail?: string; cuerpo?: string }
  ): Promise<ResultadoActualizar> {
    const comentario = await this.comentarioRepositorio.buscarPorId(id)
    if (!comentario) return { tipo: 'no_encontrado' }

    const email = datos.autorEmail ?? ''
    if (comentario.autorEmail !== email || comentario.estado !== 'pendiente') {
      return { tipo: 'sin_permiso' }
    }

    if (!datos.cuerpo) return { tipo: 'cuerpo_requerido' }

    const actualizado = await this.comentarioRepositorio.actualizarCuerpo(comentario, datos.cuerpo)
    return { tipo: 'actualizado', comentario: actualizado }
  }
}
