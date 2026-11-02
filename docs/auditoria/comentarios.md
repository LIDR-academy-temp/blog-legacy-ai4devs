
# Auditoría de la feature de comentarios

Fecha: 2026-10-31. Rama `s6/start`.

Fuentes: lectura de `backend/start/routes.ts`, la migración y la semilla de `comentarios`,
`backend/tests/functional/comentarios.spec.ts` y los componentes de `frontend/src/componentes/`;
recuentos con `grep`; consultas de solo lectura sobre `backend/tmp/db.sqlite3` (9 comentarios).
No he arrancado el servidor ni he ejecutado la suite, así que nada de lo que sigue está
reproducido por HTTP; lo que depende de eso lo marco.

## Cómo se ordena

1. **Precedencia**, en cuatro niveles: **1** desbloquea o abarata a otro hallazgo y no depende
   de ninguno; **2** desbloquea a otro pero depende de uno del nivel 1; **3** ni desbloquea ni
   depende; **4** depende de otro y no desbloquea a nadie.
2. Dentro de cada nivel, **daño ÷ radio**. Daño de 1 a 5 (5 = datos de terceros expuestos o
   acción destructiva al alcance de cualquiera; 3 = dato incorrecto visible para lectores;
   1 = cosmético). Radio = sitios a tocar, contados (handler, consulta, componente, migración,
   entrada de configuración o fila de semilla). El daño es criterio mío; el radio es un recuento.
3. El hallazgo con más daño y menor precedencia, **H8**, está partido en dos filas: **H6**
   (contención, hoy) y **H8** (fondo, espera su turno).

## Tabla

| # | Nivel | Hallazgo | Daño ÷ radio | Dónde | Se deshace |
|---|---|---|---|---|---|
| H1 | 1 | `estado` es texto libre: 3 comentarios aprobados no se ven y sí se cuentan | 3 ÷ 6 = 0,50 | `routes.ts:153`, `:76`, `:223` | Parcial |
| H2 | 1 | Una sola prueba cubre la feature | 2 ÷ 6 = 0,33 | `comentarios.spec.ts:15` | Sí |
| H3 | 2 | La validación de entrada es incoherente y no existe en PATCH | 2 ÷ 4 = 0,50 | `routes.ts:310-321`, `:384` | Sí |
| H4 | 3 | El POST devuelve la última fila de la tabla, no la que insertó | 3 ÷ 1 = 3,00 | `routes.ts:329-331` | Sí |
| H5 | 3 | El correo de quien comenta sale en tres respuestas públicas | 4 ÷ 3 = 1,33 | `routes.ts:152`, `:329`, `:389` | Sí (la fuga no) |
| H6 | 3 | **Contención:** borrar y editar solo con clave de moderación sacada del código | 5 ÷ 5 = 1,00 | `routes.ts:25`, `:349-357`, `:378-381` | Sí (la clave vieja no) |
| H7 | 4 | El recuento vive duplicado en el front y se desincroniza | 2 ÷ 2 = 1,00 | `DetallePost.jsx:30,71`, `Comentarios.jsx:11,39,54` | Sí |
| H8 | 4 | **Fondo:** identidad real para editar y borrar, con una sola política | 3 ÷ 4 = 0,75 | `routes.ts:352-354`, `:378-381` | Sí |
| H9 | 4 | `padre_id` sin validar y respuestas de segundo nivel invisibles | 2 ÷ 3 = 0,67 | `routes.ts:308,326`, `Comentarios.jsx:50,63` | Sí |

---

## Fichas

### H1 — `estado` es texto libre

**Qué es.** `comentarios.estado` no tiene `CHECK` ni enum y conviven `aprobado`, `Aprobado` y `ok`.

1. **Dónde.** `1769000000005_create_comentarios_table.ts:4-7,18`. El detalle compara con
   igualdad exacta (`routes.ts:153`); los recuentos usan `<> 'pendiente'` (`routes.ts:76`, `:223`).
   Datos medidos: `aprobado` 4, `Aprobado` 2, `ok` 1, `pendiente` 2.
2. **Qué se rompe y quién lo nota.** Los comentarios 3, 4 y 9 están aprobados de hecho pero el
   detalle no los muestra, mientras que los listados sí los cuentan. En el post 1 la tarjeta
   dice 4 comentarios y el detalle enseña 2; en el post 6 la tarjeta dice 1 y el detalle 0.
   Lo notan lectores y autores de esos tres comentarios. Incumple la regla 5 de `CLAUDE.md`.
3. **Sitios: 6.** Migración nueva con el `UPDATE` (1), filas de semilla `blog_seeder.ts:510,522,575`
   (3), y las consultas `routes.ts:76` y `:223` para pasar a `= 'aprobado'` (2, opcionales: con
   los datos normalizados dan el mismo resultado).
4. **Revert.** No del todo: el `down()` no puede restaurar cuál de los tres era `ok` y cuáles
   `Aprobado`. Es inocuo, pero guarda antes los ids 3, 4 y 9 con su valor original.
5. **Desbloquea.** H7: con los datos limpios, el número de la cabecera y el de la tarjeta coinciden.
   El `CHECK` sobre la columna queda fuera de la tabla, ver abajo.

### H2 — Una sola prueba

**Qué es.** La feature tiene un único test, el camino feliz del POST.

1. **Dónde.** `comentarios.spec.ts:5-10` lo dice en el comentario y `:15-43` es el único test.
   El hook tiene `COBERTURA_MINIMA = 0` (`guard-tests.mjs:32`).
2. **Qué se rompe y quién lo nota.** Hoy nada. Cualquier cambio posterior en DELETE, PATCH,
   el detalle o los recuentos se hace sin red y el hook solo exige suite verde. Nadie todavía.
3. **Sitios: 6.** Cuatro endpoints de comentarios (POST, DELETE, PATCH y la parte de comentarios
   de `GET /posts/:slug`) más las dos consultas de recuento (`:76`, `:223`). La matriz de
   `CLAUDE.md` pide feliz, inválida, 404 y frontera en cada uno.
4. **Revert.** Sí: solo añade ficheros de test.
5. **Desbloquea.** H3, H8 y H9: son cambios de contrato y `CLAUDE.md` exige caracterizar antes.

### H3 — Validación incoherente

**Qué es.** El POST responde con cuatro formas distintas de error y PATCH no exige longitud mínima.

1. **Dónde.** `routes.ts:311` (400 `{error}`), `:314` (422 `{message}`), `:317` (400 `{errores}`),
   `:320` (200 `{ok:false, motivo}`); PATCH solo comprueba `!cuerpo` en `:384`. El front lo
   absorbe con `d.error || d.message || d.motivo` en `Comentarios.jsx:44`.
2. **Qué se rompe y quién lo nota.** El formulario sigue funcionando. Un cliente de la API ve un
   200 en un envío rechazado. El email solo se valida con `indexOf('@')` (`:316`) y PATCH permite
   dejar un comentario de una letra. Nadie todavía.
3. **Sitios: 4.** Handler POST (1), handler PATCH (1), `Comentarios.jsx:44` (1), validador VineJS
   nuevo (1).
4. **Revert.** Sí.
5. **Depende de** H2 y **abarata** H9, porque la validación de `padre_id` va en el mismo validador.
   Corregirlo cambia el contrato: primero se caracteriza, luego se decide.

### H4 — El POST devuelve la última fila de la tabla

**Qué es.** Tras insertar, el handler lee `select * from comentarios order by id desc limit 1`.

1. **Dónde.** `routes.ts:329-331`.
2. **Qué se rompe y quién lo nota.** Con dos envíos casi simultáneos, el segundo `insert` puede
   caer entre el `insert` y el `select` del primero, y el primero recibe el comentario ajeno
   (cuerpo pendiente y correo incluidos). Razonado desde el código, **no reproducido**. Nadie todavía.
3. **Sitios: 1.** El handler POST.
4. **Revert.** Sí.
5. **Bloquea o desbloquea.** A ninguno. Comparte las líneas `:329-333` con H5: conviene hacerlos seguidos.

### H5 — Fuga del correo

**Qué es.** Tres respuestas devuelven la fila completa de `comentarios`, con `autor_email`.

1. **Dónde.** `routes.ts:152-155` (detalle, `select *`), `:329-333` (respuesta del POST) y
   `:389-392` (respuesta del PATCH). El front nunca lee `autor_email` de la respuesta
   (`grep` en `frontend/src`: solo se envía, `Comentarios.jsx:33`).
2. **Qué se rompe y quién lo nota.** Cualquier lector del detalle de un post ve el correo de
   quien comentó. Incumple la regla 6 de `CLAUDE.md`. Quien lo sufre es quien comentó; hoy nadie
   lo ha notado. Ningún consumidor del repo depende de ese campo.
3. **Sitios: 3** handlers, más su test con `assert.notProperty(..., 'autor_email')`.
4. **Revert.** El cambio sí. La fuga no: lo ya servido o cacheado no se recupera.
5. **Bloquea o desbloquea.** A ninguno. Recorta el daño de H6 y H8 (con el correo privado, la
   identidad por correo deja de poder forjarse con datos públicos), pero no los desbloquea.

### H6 — Contención: borrar y editar solo con la clave de moderación

**Qué es.** La clave de moderación está escrita en el código y el correo, que la API
regala, sirve de credencial para borrar y editar.

1. **Dónde.** `routes.ts:25` (`SECRETO_SESION = 'dev-secret-cambiar'`, con un `TODO(2024-11)`
   vencido), `:349-357` (DELETE: clave o correo) y `:378-381` (PATCH: correo exacto).
2. **Qué se rompe y quién lo nota.** Cualquiera con acceso al repositorio puede borrar cualquier
   comentario con la cabecera `x-clave-moderacion`. Con H5 abierto, cualquiera que lea un
   detalle puede además borrar o editar el comentario de otro enviando su correo. Lo nota el
   autor del comentario borrado. El front no llama nunca a DELETE ni a PATCH
   (`grep`: único `method` en `Comentarios.jsx:31`), así que nadie pierde una función hoy.
3. **Sitios: 5.** `routes.ts:25`, la rama DELETE `:349-357`, la rama PATCH `:378-381`,
   `start/env.ts` y `.env.example` (con `node ace env:add`). Más su test.
   Contención: la clave sale a una variable de entorno y **rota**; DELETE y PATCH solo
   aceptan esa clave hasta que exista H8.
4. **Revert.** El código sí; la clave no: `dev-secret-cambiar` ya está en el historial de git,
   así que el revert la devolvería al código y esa clave hay que darla por quemada.
5. **Desbloquea.** H8 depende de esta fila.

### H7 — Recuento duplicado en el front

**Qué es.** `DetallePost` y `Comentarios` guardan cada uno su propio recuento.

1. **Dónde.** `DetallePost.jsx:30,38,71` y `Comentarios.jsx:11,23,39,54`.
2. **Qué se rompe y quién lo nota.** Al enviar un comentario, `Comentarios.jsx:39` suma 1 al
   suyo aunque el comentario quede pendiente y no se vea, y la cabecera de `DetallePost`
   no se entera. Dos números distintos en la misma pantalla, que ve cualquier lector que comenta.
3. **Sitios: 2** componentes (7 líneas).
4. **Revert.** Sí.
5. **Depende de** H1: con los datos limpios los números del detalle y de las tarjetas coinciden y
   solo queda el `+1` local.

### H8 — Fondo: identidad real y una sola política

**Qué es.** Quién puede editar o borrar se escribió dos veces y salió distinto, y la identidad es un correo.

1. **Dónde.** DELETE normaliza mayúsculas, espacios y admite moderador (`routes.ts:352-354`);
   PATCH compara el correo tal cual, no admite moderador y exige `pendiente` (`:378-381`,
   con el comentario de `:375-377` que lo reconoce).
2. **Qué se rompe y quién lo nota.** Un autor que escribió su correo con otra capitalización puede
   borrar pero no editar; un moderador puede borrar pero no editar. Con H6 hecho, nadie edita
   por correo; el arreglo de fondo es devolver a los autores esa capacidad con una identidad real
   (el starter kit ya tiene tokens de acceso). Requiere decidir si quien comenta tiene cuenta.
3. **Sitios: 4.** Handlers POST, DELETE y PATCH, y una migración para guardar el autor.
4. **Revert.** Sí.
5. **Depende de** H2 y H6.

### H9 — `padre_id`

**Qué es.** El POST acepta cualquier `padre_id` y el front solo pinta respuestas de primer nivel.

1. **Dónde.** `routes.ts:308,326`; migración `:20` (sin clave foránea); `Comentarios.jsx:50,63-65`.
2. **Qué se rompe y quién lo nota.** Por la API se puede responder a un comentario de otro post,
   a uno inexistente o a una respuesta; esas no se pintan. El formulario no envía `padre_id`
   (`Comentarios.jsx:33`). Nadie todavía.
3. **Sitios: 3.** Handler POST, migración, `Comentarios.jsx`.
4. **Revert.** Sí (medido: 0 filas con `padre_id` inválido, así que la migración no tiene que
   descartar nada).
5. **Depende de** H2 y H3.

---

## Fuera de la tabla: propuestas sin medir

| Propuesta | Qué habría que medir |
|---|---|
| Índice o clave foránea en `comentarios.post_id` (`migración:7`) | Filas en producción; `EXPLAIN QUERY PLAN` de la subconsulta `routes.ts:75-76`, que corre por cada post de la página; tiempo de `GET /posts` con unos 10 000 comentarios. Hoy hay 9. |
| Quitar la segunda petición de `/posts/:slug` (`Comentarios.jsx:19` y `DetallePost.jsx:34`) | Bytes y milisegundos de la respuesta del detalle y qué parte son comentarios. |
| Consultas por relacionado para el recuento (`routes.ts:222-225`) | Número real de consultas por petición con el log de Lucid activado. |
| `CHECK` o enum sobre `estado` | Si el «panel viejo» y el «script de importación de 2024» (`blog_seeder.ts:509,521`) siguen escribiendo `Aprobado` y `ok`. Si es así el `CHECK` los rompería. No están en el repositorio. |
| Ruta para aprobar o rechazar | Quién cambia hoy el `estado`: no hay ninguna ruta que lo haga. Qué herramienta es y quién la usa. |
| Límite de envíos o antispam en el POST | Envíos por IP y hora y pendientes acumulados en producción (hoy 2 de 9). No hay logs en el repo. |
| Paginar los comentarios del detalle | Máximo de comentarios por post en producción (hoy 5). |

## Medido y descartado

- Comentarios huérfanos (sin post): **0**. Respuestas con `padre_id` de otro post: **0**.
- `creado_en` nulo, que el front pintaría como `null` (`Comentarios.jsx:59`): **0**.
- XSS en el cuerpo: el front lo pinta como texto de React (`Comentarios.jsx:61,70`), sin
  `dangerouslySetInnerHTML`. Leído, no ejecutado.
##parte B
1 El agente devolvió 8  - 1 verificado

2 H1, H3, H8 Y H9 deberian ser prioritarios ya que impiden que la app funcione correctamente, de lo contrario no está cumpliendo propósito
3 Las propuestas sin medir