# Prompts

Aquí van **todos los prompts que lanzaste** para hacer el ejercicio, en el orden en que los
lanzaste, con el modelo y la herramienta de cada uno.

Esto no es papeleo. Lo que se revisa es **cómo pediste las cosas**, no solo lo que salió: un
resultado flojo con un prompt bueno y un resultado flojo con un prompt vago necesitan feedback
distinto, y sin este archivo no se distinguen.

## Cómo rellenarlo

- Un apartado `## Prompt N` por cada prompt.
- **Pega el prompt tal cual lo lanzaste**, dentro del bloque de código, aunque ocupe diez líneas
  y aunque tenga faltas. No lo reescribas para que quede bien: el que arreglaste mentalmente
  después no es el que lanzaste.
- Incluye también los que **no funcionaron**. Suelen ser los más útiles de leer.
- `Modelo` y `Herramienta` en todos. Si cambiaste de una a otra a mitad, se nota aquí.

> **Nota de procedencia.** Los prompts de abajo son los que constan en el historial de
> la conversación de Claude Code de esta sesión, transcritos literalmente. Si Edwin lanzó
> otros antes (por ejemplo para inicializar la base de datos o medir la línea base de
> pruebas), no están en este historial y **no se han reconstruido**: debe añadirlos él.
> El modelo se toma de lo que informa la propia sesión (`claude-sonnet-5-5`); el nivel de
> esfuerzo no consta, así que no se indica.

---

## Prompt 1

**Modelo:** Sonnet 5.5 (`claude-sonnet-5-5`)
**Herramienta:** Claude Code (extensión de VS Code)

```
Estamos trabajando en el repositorio `blog-legacy-ai4devs`, sobre la rama `auditoria-eq`, para realizar una auditoría técnica del módulo de comentarios.

Antes de comenzar la auditoría, necesito que verifiques tu capacidad de inspeccionar el proyecto.

1. Confirma la rama Git actual y si existen cambios pendientes.
2. Resume los últimos cinco commits, indicando su propósito según la información disponible.
3. Localiza los archivos relacionados con comentarios en el backend, frontend, base de datos y pruebas.
4. Confirma que puedes leer archivos y consultar referencias de líneas específicas.

**Restricciones:**
- No modifiques archivos.
- No generes código.
- No ejecutes migraciones ni comandos que alteren la base de datos.
- No corrijas vulnerabilidades ni pruebas.
- No inicies todavía la auditoría.
- No inventes información que no puedas verificar directamente.

Entrega un resumen breve de lo encontrado y confirma si estás preparado para comenzar.
```

## Prompt 2

**Modelo:** Sonnet 5.5 (`claude-sonnet-5-5`)
**Herramienta:** Claude Code (extensión de VS Code)

```
Confirmo que la rama `auditoria-eq` es la rama de trabajo de Edwin Quintana. No es necesario renombrarla ni crear `auditoria-mb`.

Antes de comenzar la auditoría del módulo de comentarios:

1. Verifica que `auditoria-eq` parte de `s6/start`.
2. Revisa los diffs de los 11 archivos modificados.
3. Identifica cuáles son archivos generados automáticamente por AdonisJS y cuáles contienen cambios de configuración o código.
4. Determina si estos cambios pueden afectar la auditoría o el funcionamiento del proyecto.
5. Confirma que `prompts.md` y `docs/auditoria/` están disponibles.

No modifiques, restaures ni elimines archivos todavía. No cambies de rama.

Entrega únicamente el diagnóstico y las recomendaciones para dejar el repositorio preparado.
```

## Prompt 3

**Modelo:** Sonnet 5.5 (`claude-sonnet-5-5`)
**Herramienta:** Claude Code (extensión de VS Code)

```
Vamos a comenzar la actividad del Módulo 6: Auditoría de código heredado.

**Contexto confirmado**

- Repositorio: `blog-legacy-ai4devs`.
- Rama de trabajo: `auditoria-eq`, creada desde `s6/start`.
- Entorno: Windows con PowerShell.
- Base de datos inicializada correctamente.
- Línea base de pruebas: 1 test aprobado, 0 fallidos, aproximadamente 100 ms.
- Los 11 archivos que Git marca como modificados tienen contenido idéntico a HEAD.
- La auditoría se realizará de forma independiente, sin consultar las ramas `s6/end` ni `refactor/comentarios-arquitectura-objetivo`.

**Objetivo**

Realizar una auditoría priorizada exclusivamente de la funcionalidad de comentarios del blog.

El alcance incluye los endpoints de comentarios, su persistencia en base de datos, la visualización en frontend y las pruebas directamente relacionadas.

No audites otros módulos ni el sistema completo.

**Procedimiento**

1. Registra literalmente en `prompts.md` los prompts que se hayan utilizado hasta ahora, siempre que estén disponibles en el historial. No reconstruyas ni inventes prompts ausentes. Incluye herramienta y modelo utilizado.
2. Examina el código del módulo de comentarios e identifica posibles problemas de comportamiento, integridad, seguridad, consistencia o mantenimiento.
3. Para cada posible hallazgo, localiza el archivo y las líneas exactas que lo sustentan.
4. Diferencia los problemas confirmados de las hipótesis pendientes de comprobación.
5. Prioriza según impacto real, dependencias, alcance del cambio y reversibilidad. No ordenes únicamente por gravedad.
6. Verifica los hallazgos más importantes abriendo los archivos correspondientes. No consideres verificado un hallazgo solo porque aparezca en un resumen generado previamente.
7. Cuenta los archivos o lugares que habría que modificar, sin estimar cantidades sin evidencia.
8. Documenta los resultados en `docs/auditoria/comentarios.md`.

**Formato obligatorio de la tabla**

Una fila por hallazgo, con seis columnas:

1. Qué es.
2. Dónde está, con archivo y línea exacta.
3. Qué se rompe y quién lo nota.
4. Cuántos sitios hay que tocar, contados.
5. ¿Se deshace con un revert? Sí o no, con justificación cuando corresponda.
6. ¿Bloquea o desbloquea otro hallazgo? Identifica cuál.

**Parte B: tres líneas obligatorias**

Debajo de la tabla, incluye:

1. Número de hallazgos devueltos por el agente y número verificado manualmente por Edwin. No cuentes verificaciones automáticas como comprobaciones personales de Edwin.
2. Hallazgo cuya prioridad Edwin no pudo decidir y explicación de las dos consideraciones en conflicto.
3. Afirmación del agente que Edwin no pudo verificar ni confirmar ni descartar.

Si alguna de estas respuestas depende de una decisión o comprobación personal de Edwin, déjala pendiente para que él la complete. No inventes sus respuestas.

**Restricciones**

- No modifiques código de backend, frontend ni base de datos.
- No corrijas vulnerabilidades.
- No implementes refactorizaciones.
- No cambies la lógica de negocio.
- No consultes las ramas que contienen soluciones.
- No ejecutes migraciones destructivas.
- No realices commits ni push todavía.
- No rellenes las casillas pendientes con suposiciones.

La actividad dispone de 45 minutos. Edwin controlará el tiempo y decidirá cuándo detener la auditoría, aunque esté incompleta.

Comienza identificando una lista corta de posibles hallazgos, sus evidencias y las dependencias entre ellos. Preséntala para que Edwin pueda comprobar y priorizar los más relevantes. No completes por tu cuenta las decisiones personales de la Parte B.
```

## Prompt 4

**Modelo:** Sonnet 5.5 (`claude-sonnet-5-5`)
**Herramienta:** Claude Code (extensión de VS Code)

```
Vamos a continuar con la auditoría del módulo de comentarios siguiendo estas decisiones de Edwin Quintana.

**Priorización preliminar:**
1. A y B: exposición de correos y autorización insegura.
2. C: clave de moderación fija.
3. K: falta de pruebas de caracterización como dependencia para cambios seguros.
4. E y D: estados inconsistentes y recuentos incorrectos.
5. G: posible condición de carrera, aún sin reproducir.

Distingue claramente la gravedad de un defecto del orden de implementación de su corrección.

No presentes los hallazgos como corregidos ni como verificados personalmente por Edwin. La verificación realizada por Claude no sustituye la comprobación de Edwin.

Prepara un borrador breve de `docs/auditoria/comentarios.md` con las seis columnas obligatorias, agrupando únicamente los hallazgos que compartan realmente una misma causa o corrección.

Usa evidencia de archivo y línea exacta. Identifica los sitios que habría que tocar solo cuando puedan contarse con respaldo suficiente; de lo contrario deja la casilla pendiente.

En la Parte B:
- Registra 12 hallazgos candidatos devueltos por el agente.
- Deja pendiente el número de hallazgos comprobados personalmente por Edwin.
- Deja pendientes la decisión personal sobre la prioridad difícil y la afirmación no verificable, hasta que Edwin las confirme.

No implementes correcciones, no refactorices, no ejecutes cambios sobre la base de datos, no hagas commit ni push.

Conserva íntegramente los prompts ya registrados en `prompts.md` y añade este prompt de forma literal, con modelo y herramienta reales.
```

## Prompt 5

**Modelo:** Sonnet 5.5 (`claude-sonnet-5-5`)
**Herramienta:** Claude Code (extensión de VS Code)

```
Necesito que finalices de manera autónoma la auditoría del Módulo 6 del repositorio `blog-legacy-ai4devs`.

Trabajas en representación de Edwin Quintana, en la rama `auditoria-eq`.

**Objetivo principal**

Quiero que te encargues de completar toda la investigación y documentación necesaria, sin devolverme preguntas ni trasladarme las verificaciones técnicas.

Ya identificaste 12 hallazgos candidatos (A–L) y preparaste un borrador en `docs/auditoria/comentarios.md`, además de registrar cuatro prompts en `prompts.md`.

Ahora debes verificar, depurar, priorizar y finalizar esos entregables.

## 1. Verificación completa

- Revisa nuevamente cada hallazgo A–L contra el código real.
- Confirma las rutas, líneas y condiciones exactas.
- Comprueba los contratos de los endpoints involucrados.
- Revisa los componentes frontend relacionados.
- Examina las migraciones y el seeder.
- Verifica las reglas documentadas en `CLAUDE.md`.
- Comprueba los problemas mediante pruebas de lectura o experimentos controlados cuando sean necesarios.
- Distingue problemas demostrados, riesgos potenciales y afirmaciones no verificables.
- No consultes las ramas `s6/end` ni `refactor/comentarios-arquitectura-objetivo`.

Si necesitas ejecutar pruebas, utiliza el entorno local y evita cualquier modificación irreversible de la base de datos. No ejecutes operaciones destructivas ni sobre datos reales.

## 2. Priorización técnica

Determina el orden justificando:

- Gravedad e impacto sobre usuarios.
- Riesgos de seguridad, privacidad e integridad.
- Dependencias entre hallazgos.
- Cantidad comprobada de lugares que habría que modificar.
- Reversibilidad del cambio.
- Diferencia entre contención inmediata y solución definitiva.

No priorices automáticamente los tests por encima de los problemas de seguridad.

Si dos hallazgos tienen prioridades en conflicto, explica la contradicción y propón una secuencia razonada.

## 3. Reducir y finalizar la auditoría

Actualiza `docs/auditoria/comentarios.md`.

Mantén el alcance exclusivamente en la funcionalidad de comentarios.

Selecciona una lista corta de hallazgos prioritarios, conservando los demás como candidatos descartados o pendientes solo cuando aporte información útil.

La tabla principal debe tener seis columnas:

1. Qué es.
2. Dónde está, con archivo y línea exacta.
3. Qué se rompe y quién lo nota.
4. Cuántos sitios hay que tocar, contados.
5. Si se deshace mediante un revert.
6. Qué otro hallazgo bloquea o desbloquea.

No inventes cantidades ni evidencias. Deja las casillas sin resolver cuando corresponda.

## 4. Completar la Parte B

Debajo de la tabla escribe exactamente tres líneas:

**Línea 1:** registra los 12 hallazgos candidatos devueltos originalmente y cuántos comprobaste directamente abriendo los archivos. Distingue expresamente las verificaciones hechas por Claude de las comprobaciones personales de Edwin; no atribuyas a Edwin verificaciones que no realizó.

**Línea 2:** identifica el conflicto de prioridad mejor fundamentado entre los hallazgos y explica brevemente las consideraciones contradictorias. Preséntalo como análisis técnico de Claude, no como una experiencia personal inventada de Edwin.

**Línea 3:** identifica una afirmación que no hayas podido verificar ni confirmar ni descartar después de investigar, indicando el límite de verificación. No inventes incertidumbres si lograste comprobarlo todo.

Si una línea requiere necesariamente una experiencia personal de Edwin que desconoces, déjala identificada como pendiente en vez de inventarla.

## 5. Registro de prompts

Actualiza `prompts.md` con el texto literal de este prompt y conserva los cuatro anteriores.

Incluye modelo y herramienta utilizados realmente.

No reconstruyas prompts inexistentes ni inventes interacciones.

## 6. Restricciones

- No modifiques código funcional.
- No implementes soluciones.
- No refactorices.
- No instales dependencias adicionales.
- No corrijas vulnerabilidades.
- No cambies de rama.
- No modifiques archivos ajenos a `docs/auditoria/comentarios.md` y `prompts.md`.
- No realices commits ni push todavía.
- No uses las soluciones de referencia.
- No afirmes haber realizado verificaciones que no ejecutaste.

## 7. Resultado esperado

Deja ambos archivos completos, consistentes, breves y listos para revisión final.

Haz una comprobación final de que las referencias de líneas existen, que los recuentos son correctos y que no hay contradicciones entre la tabla y la Parte B.

Al finalizar, entrégame:

1. Número de hallazgos identificados, verificados y seleccionados.
2. Orden de prioridad definitivo y explicación breve.
3. Estado de las tres líneas de la Parte B.
4. Archivos modificados.
5. Resultado de `git status` y `git diff --check`.
6. Cualquier limitación que impida afirmar que la entrega está completa.

Ejecuta el trabajo de forma autónoma. No te detengas para solicitar decisiones que puedas resolver mediante análisis técnico y evidencia del repositorio.
```

## Prompt 6

**Modelo:** Sonnet 5.5 (`claude-sonnet-5-5`)
**Herramienta:** Claude Code (extensión de VS Code)

```
Vamos a cerrar la documentación de la auditoría del Módulo 6, realizada en representación de Edwin Quintana.

La investigación técnica ya está terminada. No repitas los experimentos ni amplíes el alcance.

Realiza una revisión final de `docs/auditoria/comentarios.md` y `prompts.md`.

**Instrucciones:**

1. Conserva los 12 candidatos identificados como recuento original y las 7 filas seleccionadas.
2. Mantén el orden de prioridad justificado: C → B → A → E → D → H+I → K.
3. Verifica que cada fila contenga las seis columnas obligatorias y que todas las referencias a archivos y líneas estén sustentadas.
4. Mantén las limitaciones de verificación de G, E y del frontend.
5. En la Parte B, línea 1, diferencia los 12 hallazgos revisados por Claude de las comprobaciones personales de Edwin. Si no existe constancia de verificaciones personales, registra explícitamente 0 verificaciones personales documentadas, sin afirmar que Edwin realizó o dejó de realizar acciones que no conocemos.
6. En la Parte B, línea 2, conserva el conflicto entre contención de seguridad y pruebas de caracterización, indicando que es un análisis técnico del agente y no una experiencia personal atribuida a Edwin.
7. En la Parte B, línea 3, conserva la condición de carrera G como afirmación no reproducida.
8. Comprueba que la tabla sea breve y cumpla el propósito del ejercicio.
9. Conserva los prompts anteriores y añade este únicamente si se envió efectivamente, con el modelo y la herramienta reales.
10. No modifiques código, configuraciones, base de datos ni otros archivos.

**Preparación del commit:**

Antes de finalizar, ejecuta:

- `git status`
- `git diff --check`
- `git diff -- prompts.md`
- Una revisión del contenido de `docs/auditoria/comentarios.md`.

No ejecutes `git add`, `git commit` ni `git push` todavía.

Devuélveme un informe breve indicando si ambos archivos están listos y si existe alguna condición que impida entregarlos.
```
