import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import testUtils from '@adonisjs/core/services/test_utils'

/**
 * Caracterización del comportamiento de HOY para los tres endpoints de
 * comentarios (POST crear, DELETE borrar, PATCH editar), bugs incluidos:
 *
 *  - Los códigos de estado de la validación de POST son inconsistentes:
 *    400 (nombre), 422 (email), 400 (email inválido), 200 con ok:false
 *    (cuerpo corto). No es un contrato coherente, pero es el de hoy.
 *  - DELETE compara el email en minúsculas y admite la clave de moderación.
 *  - PATCH compara el email tal cual (sensible a mayúsculas), NO admite la
 *    clave de moderación, y además exige que el comentario siga pendiente.
 *
 * No se corrige nada de esto aquí: se fija tal cual, para poder refactorizar
 * las capas por debajo sin cambiar ni un bit de comportamiento observable.
 */

const AHORA = '2026-01-01 10:00:00'
const CLAVE_MODERACION = 'dev-secret-cambiar'

function filaPost(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 9001,
    titulo: 'Post de prueba',
    slug: 'post-de-prueba',
    resumen: 'Resumen de prueba',
    cuerpo: '## Cuerpo de prueba',
    imagen_portada: null,
    estado: 'publicado',
    publicado_en: AHORA,
    autor_id: 1,
    categoria_id: 1,
    autor_nombre: 'Marta Ruiz Calvo',
    autor_email: 'marta.ruiz@corriente.es',
    categoria_nombre: 'Noticias',
    etiquetas: 'Artículos',
    created_at: AHORA,
    updated_at: AHORA,
    ...overrides,
  }
}

function filaComentario(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 5001,
    post_id: 9001,
    autor_nombre: 'Lucía Ferrer',
    autor_email: 'lucia.ferrer@ejemplo.es',
    cuerpo: 'Un comentario suficientemente largo.',
    estado: 'pendiente',
    creado_en: AHORA,
    padre_id: null,
    ...overrides,
  }
}

test.group('POST /posts/:slug/comentarios', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('camino feliz: deja un comentario pendiente en un post publicado', async ({
    client,
    assert,
  }) => {
    // Arrange
    await db.table('posts').insert(filaPost())

    // Act
    const respuesta = await client.post('/posts/post-de-prueba/comentarios').json({
      autor_nombre: 'Lucía Ferrer',
      autor_email: 'lucia.ferrer@ejemplo.es',
      cuerpo: 'Un comentario suficientemente largo.',
    })

    // Assert
    respuesta.assertStatus(201)
    const cuerpo = respuesta.body().comentario
    assert.isNumber(cuerpo.id)
    assert.equal(cuerpo.post_id, 9001)
    assert.equal(cuerpo.autor_nombre, 'Lucía Ferrer')
    assert.equal(cuerpo.autor_email, 'lucia.ferrer@ejemplo.es')
    assert.equal(cuerpo.cuerpo, 'Un comentario suficientemente largo.')
    assert.equal(cuerpo.estado, 'pendiente')
    assert.isString(cuerpo.creado_en)
    assert.isNull(cuerpo.padre_id)
    assert.properties(cuerpo, [
      'id',
      'post_id',
      'autor_nombre',
      'autor_email',
      'cuerpo',
      'estado',
      'creado_en',
      'padre_id',
    ])
  })

  test('respuesta: guarda el padre_id cuando responde a otro comentario', async ({
    client,
    assert,
  }) => {
    // Arrange
    await db.table('posts').insert(filaPost())
    await db.table('comentarios').insert(filaComentario({ id: 5001 }))

    // Act
    const respuesta = await client.post('/posts/post-de-prueba/comentarios').json({
      autor_nombre: 'Otro Lector',
      autor_email: 'otro@ejemplo.es',
      cuerpo: 'Respondiendo al comentario anterior.',
      padre_id: 5001,
    })

    // Assert
    respuesta.assertStatus(201)
    assert.equal(respuesta.body().comentario.padre_id, 5001)
  })

  test('404: el post no existe', async ({ client }) => {
    // Arrange — nada sembrado

    // Act
    const respuesta = await client.post('/posts/no-existe/comentarios').json({
      autor_nombre: 'Lucía Ferrer',
      autor_email: 'lucia.ferrer@ejemplo.es',
      cuerpo: 'Un comentario suficientemente largo.',
    })

    // Assert
    respuesta.assertStatus(404)
    respuesta.assertBody({ error: 'Post no encontrado' })
  })

  test('404: el post existe pero está en borrador', async ({ client }) => {
    // Arrange
    await db.table('posts').insert(filaPost({ estado: 'borrador', publicado_en: null }))

    // Act
    const respuesta = await client.post('/posts/post-de-prueba/comentarios').json({
      autor_nombre: 'Lucía Ferrer',
      autor_email: 'lucia.ferrer@ejemplo.es',
      cuerpo: 'Un comentario suficientemente largo.',
    })

    // Assert
    respuesta.assertStatus(404)
    respuesta.assertBody({ error: 'Post no encontrado' })
  })

  test('entrada inválida: falta el nombre → 400', async ({ client }) => {
    // Arrange
    await db.table('posts').insert(filaPost())

    // Act
    const respuesta = await client.post('/posts/post-de-prueba/comentarios').json({
      autor_email: 'lucia.ferrer@ejemplo.es',
      cuerpo: 'Un comentario suficientemente largo.',
    })

    // Assert
    respuesta.assertStatus(400)
    respuesta.assertBody({ error: 'El nombre es obligatorio' })
  })

  test('entrada inválida: falta el email → 422', async ({ client }) => {
    // Arrange
    await db.table('posts').insert(filaPost())

    // Act
    const respuesta = await client.post('/posts/post-de-prueba/comentarios').json({
      autor_nombre: 'Lucía Ferrer',
      cuerpo: 'Un comentario suficientemente largo.',
    })

    // Assert
    respuesta.assertStatus(422)
    respuesta.assertBody({ message: 'Falta el email' })
  })

  test('entrada inválida: email sin arroba → 400', async ({ client }) => {
    // Arrange
    await db.table('posts').insert(filaPost())

    // Act
    const respuesta = await client.post('/posts/post-de-prueba/comentarios').json({
      autor_nombre: 'Lucía Ferrer',
      autor_email: 'no-es-un-email',
      cuerpo: 'Un comentario suficientemente largo.',
    })

    // Assert
    respuesta.assertStatus(400)
    respuesta.assertBody({ errores: ['email no válido'] })
  })

  test('frontera de negocio: cuerpo demasiado corto → 200 ok:false', async ({ client }) => {
    // Arrange
    await db.table('posts').insert(filaPost())

    // Act
    const respuesta = await client.post('/posts/post-de-prueba/comentarios').json({
      autor_nombre: 'Lucía Ferrer',
      autor_email: 'lucia.ferrer@ejemplo.es',
      cuerpo: 'Hola',
    })

    // Assert
    respuesta.assertStatus(200)
    respuesta.assertBody({ ok: false, motivo: 'comentario demasiado corto' })
  })
})

test.group('DELETE /comentarios/:id', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('camino feliz: el autor borra su propio comentario (email sin distinguir mayúsculas)', async ({
    client,
    assert,
  }) => {
    // Arrange
    await db.table('posts').insert(filaPost())
    await db.table('comentarios').insert(filaComentario({ autor_email: 'lucia.ferrer@ejemplo.es' }))

    // Act
    const respuesta = await client.delete('/comentarios/5001').json({
      autor_email: 'LUCIA.FERRER@EJEMPLO.ES',
    })

    // Assert
    respuesta.assertStatus(200)
    respuesta.assertBody({ borrado: true })
    const quedan = await db.from('comentarios').where('id', 5001)
    assert.lengthOf(quedan, 0)
  })

  test('frontera de negocio: el moderador borra con la clave, sin ser el autor', async ({
    client,
    assert,
  }) => {
    // Arrange
    await db.table('posts').insert(filaPost())
    await db.table('comentarios').insert(filaComentario())

    // Act
    const respuesta = await client
      .delete('/comentarios/5001')
      .header('x-clave-moderacion', CLAVE_MODERACION)
      .json({})

    // Assert
    respuesta.assertStatus(200)
    respuesta.assertBody({ borrado: true })
    const quedan = await db.from('comentarios').where('id', 5001)
    assert.lengthOf(quedan, 0)
  })

  test('403: ni es el autor ni trae la clave de moderación', async ({ client, assert }) => {
    // Arrange
    await db.table('posts').insert(filaPost())
    await db.table('comentarios').insert(filaComentario())

    // Act
    const respuesta = await client.delete('/comentarios/5001').json({
      autor_email: 'otro@ejemplo.es',
    })

    // Assert
    respuesta.assertStatus(403)
    respuesta.assertBody({ error: 'No puedes borrar este comentario' })
    const sigue = await db.from('comentarios').where('id', 5001)
    assert.lengthOf(sigue, 1)
  })

  test('404: el comentario no existe', async ({ client }) => {
    // Act
    const respuesta = await client.delete('/comentarios/999999').json({})

    // Assert
    respuesta.assertStatus(404)
    respuesta.assertBody({ error: 'Comentario no encontrado' })
  })
})

test.group('PATCH /comentarios/:id', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('camino feliz: el autor edita su comentario pendiente', async ({ client, assert }) => {
    // Arrange
    await db.table('posts').insert(filaPost())
    await db.table('comentarios').insert(filaComentario({ autor_email: 'lucia.ferrer@ejemplo.es' }))

    // Act
    const respuesta = await client.patch('/comentarios/5001').json({
      autor_email: 'lucia.ferrer@ejemplo.es',
      cuerpo: 'Cuerpo corregido.',
    })

    // Assert
    respuesta.assertStatus(200)
    const cuerpo = respuesta.body().comentario
    assert.equal(cuerpo.cuerpo, 'Cuerpo corregido.')
    assert.equal(cuerpo.id, 5001)
  })

  test('frontera de negocio (bug): el email con mayúscula distinta NO puede editar', async ({
    client,
  }) => {
    // Arrange
    await db.table('posts').insert(filaPost())
    await db.table('comentarios').insert(filaComentario({ autor_email: 'lucia.ferrer@ejemplo.es' }))

    // Act — a diferencia de DELETE, aquí la comparación es sensible a mayúsculas.
    const respuesta = await client.patch('/comentarios/5001').json({
      autor_email: 'LUCIA.FERRER@EJEMPLO.ES',
      cuerpo: 'Cuerpo corregido.',
    })

    // Assert
    respuesta.assertStatus(403)
    respuesta.assertBody({ error: 'No puedes editar este comentario' })
  })

  test('frontera de negocio: un comentario ya aprobado no se puede editar aunque el email coincida', async ({
    client,
  }) => {
    // Arrange
    await db.table('posts').insert(filaPost())
    await db.table('comentarios').insert(
      filaComentario({ autor_email: 'lucia.ferrer@ejemplo.es', estado: 'aprobado' })
    )

    // Act
    const respuesta = await client.patch('/comentarios/5001').json({
      autor_email: 'lucia.ferrer@ejemplo.es',
      cuerpo: 'Cuerpo corregido.',
    })

    // Assert
    respuesta.assertStatus(403)
    respuesta.assertBody({ error: 'No puedes editar este comentario' })
  })

  test('frontera de negocio (bug): la clave de moderación no sirve para editar', async ({
    client,
  }) => {
    // Arrange
    await db.table('posts').insert(filaPost())
    await db.table('comentarios').insert(filaComentario({ autor_email: 'lucia.ferrer@ejemplo.es' }))

    // Act — clave correcta, pero el email del body no es el del autor.
    const respuesta = await client
      .patch('/comentarios/5001')
      .header('x-clave-moderacion', CLAVE_MODERACION)
      .json({ autor_email: 'otro@ejemplo.es', cuerpo: 'Cuerpo corregido.' })

    // Assert
    respuesta.assertStatus(403)
    respuesta.assertBody({ error: 'No puedes editar este comentario' })
  })

  test('entrada inválida: falta el cuerpo → 400', async ({ client }) => {
    // Arrange
    await db.table('posts').insert(filaPost())
    await db.table('comentarios').insert(filaComentario({ autor_email: 'lucia.ferrer@ejemplo.es' }))

    // Act
    const respuesta = await client.patch('/comentarios/5001').json({
      autor_email: 'lucia.ferrer@ejemplo.es',
    })

    // Assert
    respuesta.assertStatus(400)
    respuesta.assertBody({ error: 'Falta el cuerpo' })
  })

  test('404: el comentario no existe', async ({ client }) => {
    // Act
    const respuesta = await client.patch('/comentarios/999999').json({
      autor_email: 'lucia.ferrer@ejemplo.es',
      cuerpo: 'Cuerpo corregido.',
    })

    // Assert
    respuesta.assertStatus(404)
    respuesta.assertBody({ error: 'Comentario no encontrado' })
  })
})
