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

---

## Prompt 1 · las instrucciones al agente que orquestó el ejercicio

**Modelo:** Opus 5.5 (`claude-opus-5-5`)
**Herramienta:** Claude Code Desktop en Windows, sesión abierta en otro repositorio y operando sobre WSL, con la suscripción de Claude

```
¿Qué huecos quedan en Estatus S1-S13?, lo que este abierto resuélvelo y documento de nuevo.
```

```
Si tienes los permisos, adelante y actualiza el "Estatus S1-S13.md"
```

**Qué salió:** uno de los huecos de mi registro del curso era este ejercicio, que no había hecho. El segundo mensaje respondía a la pregunta del orquestador de si hacerlo entero, con el fork y el PR. Se hizo el 2026-11-01, mucho después del directo, contra la copia temporal `LIDR-academy-temp/blog-legacy-ai4devs`, porque el repositorio original responde 404. No es un primer intento limpio: el orquestador ya había leído mis notas del directo, que recogen parte de la lista del mentor. Por eso el prompt de la auditoría no nombra ningún hallazgo, el agente que audita arrancó sin más contexto que el repositorio, y nadie abrió `s6/end`. Antes de lanzarlo comprobó la partida: `make setup`, `make db` y `make test` salen con 0, con `Tests  1 passed (1)`.

---

## Prompt 2 · Parte A, la auditoría

**Modelo:** Opus 5.5 (`claude-opus-5-5`)
**Herramienta:** Claude Code CLI 2.1.312 en WSL, sin interfaz (`claude -p`), sesión nueva desde la raíz del repositorio en `auditoria-RLL`, con `acceptEdits`, herramientas de lectura más `Write` y `Edit`, y `make`, `npm`, `node`, `curl`, `git commit`, `git push` y `gh` denegados

```
Audita la feature de comentarios de este blog y deja la auditoría escrita en `docs/auditoria/comentarios.md`, no en el chat.

La feature es crear, editar, borrar y listar comentarios, de punta a punta: sus rutas en la API (`backend/start/routes.ts`), su tabla en la base de datos (las migraciones y la semilla de `backend/database/`) y lo que la web enseña de ella (`frontend/src/`). Solo esa feature: no audites posts, autores, categorías ni etiquetas, aunque las veas al pasar y aunque quepan.

El contraste son las reglas de negocio del README y de `CLAUDE.md`. Un hallazgo es algo que incumple una regla escrita, o un defecto que se pueda señalar en una línea; una preferencia de estilo no es un hallazgo.

Escribe una tabla con una fila por hallazgo y estas seis casillas:

1. Qué es, en una frase. Si necesitas tres, son dos hallazgos.
2. Dónde está, con `archivo:línea` y la línea que lo demuestra. Si no tienes la línea, la fila no se escribe.
3. Qué se rompe y quién lo nota. «Nadie todavía» es una respuesta válida.
4. Cuántos sitios hay que tocar, contados, no estimados.
5. Si se deshace con un revert: sí o no, y si es que no, por qué no.
6. Si bloquea o desbloquea a otro hallazgo, nombrándolo. «A ninguno» es una respuesta válida.

Ordena las filas de la más prioritaria a la menos, y encima de la tabla di en una línea con qué criterio las ordenaste.

No arregles nada. No toques ningún archivo que no sea `docs/auditoria/comentarios.md`, no hagas commit y no cambies de rama. Cuando termines, dime cuántos hallazgos escribiste.
```

**Qué salió:** 10 turnos, 3 minutos 14 segundos y 1,38 USD. Escribió 22 filas en `docs/auditoria/comentarios.md`, con el criterio de orden encima. Se le denegó dos veces un `ls tmp/` con `cd` delante, así que los recuentos de C-05 y C-06 los sacó de la semilla y no de la base, y lo avisó. Dejó las tres líneas con «pendiente de rellenar», porque eran mías, y no tocó ningún otro archivo. Después, el orquestador abrió cada archivo en la línea citada en las 22 filas, consultó la base sembrada (estados, recuentos por post, columnas, y ni una clave foránea ni un índice en `comentarios`) y reprodujo con la API levantada C-01, C-02, C-05 y C-06. El `DELETE` de C-02 borró de verdad el comentario 1, y la base se volvió a sembrar después. El reloj empezó a las 22:50:16 al lanzar el prompt y paró a las 22:57:32, a los 7 minutos de los 45.
