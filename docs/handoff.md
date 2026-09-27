# Handoff · 26 de septiembre de 2026

Traspaso desde la conversación en claude.ai. Todo el contexto necesario está en este repositorio.

## Estado

**Hero: cerrado a falta del nombre de la web.** Implementado en `src/hero.html`:
- Vagón en acuarela con ventanilla central; el paisaje se pinta al abrir (~4,6 s) y luego el tren arranca
- Nombre provisional «Nombre» y subtítulo «Horarios de tren entre Barcelona y Reus.»
- Dos billetes recortados para el sentido; el paisaje corre al revés hacia Barcelona (no afecta al rendimiento)
- Hora grande con etiqueta «Próximo tren» / «Tren elegido», «Sale de … en X min», «Luego» y «Anterior» pulsables
- Regla del día (5:00–24:00) que salta de tren en tren; flechas, Inicio y Fin; «Volver al próximo tren» solo cuando hace falta
- Mejora UX n.º 3 (recordar sentido y reflejarlo en la URL) propuesta y **no aprobada** de momento

## Siguiente paso (acordado)

1. **Definir las secciones con scroll.** Propuesta pendiente de validar por Àlex:
   qué es y para quién · cómo leer la pantalla · cómo se hizo con Claude (clave para el portfolio) · datos y límites.
   Pregunta abierta: en «cómo se hizo», ¿proceso de decisiones, parte técnica o ambas?
2. Diseñarlas con el lenguaje del vagón (wireframes primero)
3. Grabar el vídeo para X y LinkedIn

La página tiene ahora `overflow:hidden` en `body`: habrá que liberarlo y añadir una indicación de que hay contenido debajo.

## Pendiente y riesgos

- Nombre de la web: lo decide Àlex más adelante (el actual «A Reus» no le gusta)
- Probar fluidez y el toque en la regla en un móvil real (solo probado con render por software)
- Horarios: `data/trains.json` llega hasta el 9 de octubre de 2026; regenerar antes de grabar
- Condiciones de uso de los datos abiertos de Renfe por verificar (probablemente exigen citar la fuente)
- Fase 2 (no empezar sin decisión): actualización diaria automática con avisos, precios del AVE, publicación en subdominio gratuito, contador de visitas

## Cómo verificar

`python3 scripts/build.py && python3 scripts/check.py`, y revisar `screenshots/desktop.png` y `screenshots/mobile.png`.
