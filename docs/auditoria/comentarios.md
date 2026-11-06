# Auditoría del módulo de comentarios

- **Rama:** `auditoria-eq` (desde `s6/start`, commit `b5da02a`) · **Fecha:** 2026-11-06 · **Alcance:** solo comentarios (endpoints, persistencia, frontend y tests relacionados).
- **Independencia:** no se consultaron `s6/end` ni `refactor/comentarios-arquitectura-objetivo`.
- **Resultado:** 12 candidatos (A–L) revisados contra el código; 7 forman la lista corta de abajo. Ningún hallazgo está corregido.
- **Autoría de la verificación:** todo lo que dice «demostrado» lo ejecutó o comprobó **Claude**. Las verificaciones personales de Edwin documentadas son 0 (ver Parte B).
- **Método.** Lecturas con `GET` contra el servidor local real (puerto 3401). Las pruebas que escriben (POST, PATCH, DELETE, concurrencia y UPDATE de estados) se hicieron en un **laboratorio**: copia del backend y de la BD en el scratchpad de la sesión, en el puerto 3499. La BD real (`backend/tmp/db.sqlite3`) tiene el mismo hash SHA-256 antes y después (`257c36a3d1c0e302…`). Las rutas son relativas a la raíz del repo y `routes.ts` es `backend/start/routes.ts`.

## Tabla principal (por orden de prioridad definitivo)

| Qué es | Dónde está | Qué se rompe y quién lo nota | Cuántos sitios hay que tocar | ¿Se deshace con un revert? | ¿Bloquea o desbloquea otro hallazgo? |
|---|---|---|---|---|---|
| **1 · C — Clave de moderación fija en el código, con el repo público.** Fork y origen son públicos (`gh repo view`). **Demostrado.** | `routes.ts:25` (valor), `:21-23` (TODO 2024-11), `:349` (cabecera `x-clave-moderacion`), `:351` (`===`). | Cualquiera borra cualquier comentario con esa cabecera y sin correo: en el laboratorio, `200 {borrado:true}` (clave errónea: `403`). Afecta a todo despliegue con el valor por defecto; no sé si hay alguno. Lo notan los comentaristas. | **2** líneas (`routes.ts:25`, `:351`); **+2** archivos si se usa variable de entorno (`backend/start/env.ts`, `backend/.env.example`). | **Sí** el código. **No** el secreto: ya está en el historial público y hay que rotarlo. | **Desbloquea la contención de B.** No depende de nada. |
| **2 · B — El correo funciona como credencial para borrar y editar.** Las dos reglas difieren. **Demostrado.** | `routes.ts:350-357` (DELETE; minúsculas en `:352-354`), `:359` (borrado físico), `:378-381` (PATCH; correo exacto y solo `pendiente`). | Con el correo leído del GET público se borraron en el laboratorio dos comentarios aprobados (`200`); el PATCH con el correo en minúsculas dio `403`. Borrado físico, sin rastro. El frontend no usa DELETE ni PATCH (su único método es el POST, `Comentarios.jsx:31`), así que cortar esta vía no rompe ninguna pantalla. Lo notan los comentaristas. | **2** bloques (`routes.ts:352-357`, `:378-381`). Mecanismo definitivo: **PENDIENTE**. | **Sí** el código. **No** los comentarios ya borrados. | **Depende de C** (contención) y de F (diseño definitivo). A reduce su explotabilidad. |
| **3 · A — Correo de quien comenta en respuestas públicas.** Se devuelve la fila cruda; contradice la regla 6. **Demostrado.** | `routes.ts:152-155` y `:171` (detalle), `:329-333` (POST), `:389-392` (PATCH). Columna: `backend/database/migrations/1769000000005_create_comentarios_table.ts:16`. | El GET en el servidor real devuelve `autor_email` de los comentarios 1 y 2; el POST lo devolvió en el laboratorio; el PATCH, según el código (no ejecutado). La interfaz no lo muestra, así que no lo nota ningún lector. Lo sufren los comentaristas (spam), y es irreversible. | **3** puntos de respuesta (`routes.ts:171`, `:333`, `:392`). Frontend: **0** (`Comentarios.jsx:33` solo envía el correo). | **Sí** el código. **No** lo ya expuesto. | **Habilita B.** Corregirlo no cierra B por sí solo. |
| **4 · E — `estado` de texto libre con datos sucios.** Los ids 3, 4 y 9 están en `Aprobado`/`ok` y no se ven. Que sean «aprobados» es una inferencia del seeder, por confirmar. **Demostrado en datos.** | Migración `…create_comentarios_table.ts:18` (sin `CHECK`). BD real: ids 3, 4, 9. `backend/database/seeders/blog_seeder.ts:510`, `:522`, `:575` (causa en `:509`, `:521`). | El detalle filtra `= 'aprobado'` (`routes.ts:153`): el post 6 muestra 0 comentarios aunque tiene uno `Aprobado`. Lo notan los comentaristas y, vía D, los lectores. | **3** filas de BD, **3** entradas del seeder, **1** definición de columna. Código de la corrección: **PENDIENTE**. | **No.** La BD está ignorada por git (`backend/.gitignore:4`): hace falta copia previa o migración inversa. | **Desbloquea D.** Copiar los datos antes de tocarlos. |
| **5 · D — Dos criterios de «visible» y recuentos erróneos.** Contradice la regla 5. **Demostrado.** | `routes.ts:75-76` y `:223` (`<> 'pendiente'`) frente a `:153` (`= 'aprobado'`). Se muestra en `frontend/src/componentes/ListaPosts.jsx:57` y `PostsRelacionados.jsx:32`. | En el servidor real: post 1, listado «4» y detalle 2; post 6, «1» y 0. Los posts 2 y 4 coinciden. Lo notan los lectores. | **2** consultas (`routes.ts:75-76`, `:223`). Frontend: **0**. | **Sí.** | **Depende de E:** corregir solo D deja 3 comentarios ocultos. |
| **6 · H+I — Validación de entrada incoherente.** Agrupados: misma corrección, un validador. **Demostrado.** | POST `routes.ts:310-311` (400), `:313-314` (422), `:316-317` (400), `:319-320` (**200** `{ok:false}`); `padre_id` en `:308`, `:326`; PATCH `:383-386`. Consumidor `Comentarios.jsx:44`; pintado `:50`, `:63-64`. | Laboratorio: 4 formas de error; cuerpo de 200 000 caracteres y correo `a@` aceptados; PATCH de 1 carácter → `200`; `padre_id` inexistente, de otro post o `"abc"` → `201` y, una vez aprobados, la lógica de `Comentarios.jsx:50,63-64` pinta 0 de 3. Solo por API: el formulario no envía `padre_id`. Lo notan los integradores y, indirectamente, los lectores. | **2** handlers (`routes.ts:308-321`, `:383-386`) y **1** consumidor (`Comentarios.jsx:44`) si cambia el contrato. | **Sí** el código. Cambiar códigos de estado es un cambio de contrato: tarea aparte. | Va tras caracterizar POST y PATCH. |
| **7 · K — Red de tests insuficiente.** 1 test, camino feliz del POST. **Demostrado por medición.** | `backend/tests/functional/comentarios.spec.ts:15-43` (aserción de contenido en `:42`). | 1 test pasa (97 ms). `routes.ts` 32,29 % de líneas; en `:295-393` se ejecutan **40 de 99**. Sin ejecutar: `:301-302`, `:311-312`, `:314-315`, `:317-318`, `:320-321`, DELETE `:340-361` y PATCH `:367-393`. Lecturas (`:75-76`, `:152-155`, `:222-225`): 0. Lo notaría el usuario final tras desplegar. | **6** endpoints (`routes.ts:295`, `:339`, `:366`, `:38`, `:109`, `:180`). Número de tests: **PENDIENTE**. | **Sí:** solo añade tests. | **Condiciona al resto,** pero por endpoint y justo antes de tocarlo, no como fase global. |

## Parte B

**Línea 1 — Recuento.** El agente devolvió 12 hallazgos candidatos (A–L) y Claude revisó los 12 abriendo los archivos: 9 demostrados con ejecución o datos (A, B, C, D, E, F, H, I, K), 2 confirmados solo por lectura de código (J, L) y 1 hipótesis no reproducida (G); 7 pasan a la lista corta. Verificaciones personales de Edwin: **0 documentadas** (no hay constancia de ninguna en el repositorio ni en la sesión; esto no afirma que Edwin las haya hecho o dejado de hacer, y las comprobaciones de Claude no cuentan como suyas).

**Línea 2 — Conflicto de prioridad (análisis técnico del agente, no una experiencia atribuida a Edwin).** Contener la seguridad (C, B, A) frente a «el test que falla se escribe primero» (K, `CLAUDE.md`): mientras no se corrijan, la clave pública y el borrado por correo permiten borrados irreversibles, pero `CLAUDE.md` exige caracterizar antes de cambiar y DELETE y PATCH hoy tienen 0 líneas ejecutadas por tests; se resuelve caracterizando solo cada endpoint justo antes de tocarlo y corrigiendo C → B → A antes que E y D.

**Línea 3 — Afirmación no verificada.** G, «el POST puede devolver el comentario de otro envío concurrente», no se confirma ni se descarta: 130 envíos concurrentes (30 + 100) contra el laboratorio dieron 0 respuestas ajenas, pero el intercalado entre el insert (`routes.ts:324`) y el select (`:329`) no se puede forzar sin modificar o instrumentar el código, y solo se probó en un proceso con SQLite; sí está confirmado por lectura que el select (`:329-331`) no está ligado al id insertado.

## Prioridad: orden, razones y contención frente a solución definitiva

**Orden definitivo:** C → B (contención) → A → E → D → H+I → K completo y L (soluciones definitivas). La prioridad preliminar de Edwin era A+B → C → K → E+D → G. Las diferencias y su razón:

- **C pasa al primero.** Es la única vía de borrado que no exige conocer nada del comentarista, solo una petición HTTP y un valor que está en un repositorio público. Es destructiva e irreversible, y su rotación es un prerrequisito para contener B.
- **B antes que A.** B destruye datos sin recuperación; A filtra datos, también sin vuelta atrás, pero de forma no destructiva. B se contiene sin tocar la interfaz porque el frontend no usa DELETE ni PATCH.
- **K no va primero ni como fase global.** `CLAUDE.md` exige caracterizar antes de cambiar, y eso se cumple por endpoint: DELETE y PATCH (0 líneas ejecutadas) justo antes de contener C y B; el detalle y el POST antes de A; el listado y los relacionados antes de D. Retrasar C y B hasta tener los seis endpoints cubiertos dejaría abierto el borrado sin necesidad.
- **E antes que D, y E con copia previa.** E cambia datos de forma irreversible y fija qué cuenta como «aprobado»; D se corrige después sobre esa definición.
- **H+I y L después.** Cambian el contrato de errores y la estructura; son las soluciones definitivas de A, B y C, no su contención.

| Hallazgo | Contención inmediata (pequeña, reversible en código) | Solución definitiva |
|---|---|---|
| C | Sacar el valor del código y rotarlo (2 líneas en `routes.ts`, más configuración de entorno). | Moderación autenticada. El starter kit ya trae un guard de tokens (`backend/config/auth.ts`, `routes.ts:399-418`): es una opción que **no evalué**. |
| B | `DELETE` solo con clave de moderación (cierra la vía por correo). El PATCH queda sin cambio por ahora. | Identidad del autor definida y ruta de moderación (F). |
| A | Dejar de devolver `autor_email` en los 3 puntos. | Transformer de salida (L). |

## Candidatos fuera de la lista corta

- **G — pendiente.** No reproducido (Parte B, línea 3). Un sitio (`routes.ts:329-331`). Se resuelve al reescribir el POST.
- **F — pendiente de diseño.** Demostrada la ausencia de ruta de moderación en esta API: `PATCH /comentarios/3/aprobar`, `POST /comentarios/3/aprobar` y `PUT /comentarios/3` devuelven 404, y un PATCH con `estado: 'aprobado'` deja `pendiente`. Único `UPDATE`: `routes.ts:388`. Puede existir un panel fuera del repo (`blog_seeder.ts:509`); no es verificable desde el código. Bloquea el B definitivo.
- **J — confirmado por lectura, no prioritario.** El contador de la sección suma 1 por un comentario pendiente que no se ve y el de la cabecera no cambia: `Comentarios.jsx:11,23,39,54` y `DetallePost.jsx:30,38,71`. Son 2 archivos y 7 líneas. No lo ejecuté en un navegador.
- **L — confirmado, mantenimiento.** Toda la lógica de comentarios está en `routes.ts` (6 puntos: `:295-334`, `:339-361`, `:366-393` y las lecturas `:75-76`, `:152-155`, `:222-225`) y `backend/app` no menciona comentarios. Es el vehículo de las soluciones definitivas, no de la contención.

## Reglas de `CLAUDE.md` comprobadas

| Regla | Estado |
|---|---|
| 2. Un comentario `pendiente` no se muestra en el detalle | **Se cumple** (demostrado), con el efecto lateral de E. |
| 5. El recuento cuenta solo los aprobados | **Se incumple** en el listado y los relacionados (D). |
| 6. No se expone el correo de quien comenta | **Se incumple** (A). Fuera de alcance: los relacionados devuelven `autor` con su campo `email`; es del módulo de posts y no lo audité. |

## Límites de esta verificación

- **Frontend:** no lo ejecuté en un navegador. J y el pintado de H+I se apoyan en la lectura del código; en H+I además reproduje las expresiones de filtro en Node, no el componente de React.
- **G:** no pude forzar la carrera (ver Parte B, línea 3).
- **E:** la interpretación de «aprobado» para los ids 3, 4 y 9 es una inferencia de Claude a partir de los comentarios del seeder, no una decisión de negocio.
- **C:** no sé si existe algún despliegue que use el valor por defecto; solo comprobé que el repositorio es público.
- **Laboratorio:** es una copia del backend y de la BD con el mismo código. A y D en vivo se comprobaron con `GET` en el servidor real.
- **Soluciones:** las opciones de solución definitiva son análisis de Claude, no decisiones tomadas.
