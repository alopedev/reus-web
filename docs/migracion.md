# Migración · de un HTML único a Vite + TypeScript (27-09-2026)

Objetivo: separar el código en módulos mantenibles sin ningún cambio visible. La suite (`check.py`) en verde al cerrar cada fase, commit por fase.

| Fase | Qué | Estado |
| --- | --- | --- |
| 0 · Red de seguridad | Capturas de referencia (fotograma fijo, hora congelada) y comparación automática; `check.py` sirve `dist/` por HTTP | Hecha |
| 1 · Vite sin tocar el código | Proyecto Vite con npm; Three r128 y GSAP 3.15 como dependencias fijas; horarios importados como JSON; adiós a `build.py` | Hecha |
| 2 · Módulos | Estilos, shaders `.glsl`, escena 3D, mesa, interfaz de horarios, transición, hora y luz; API explícita para las pruebas en lugar de globales | Hecha |
| 3 · TypeScript | Tipado estricto módulo a módulo | Pendiente |
| 4 · Publicación | GitHub Actions con las pruebas; despliegue en Vercel o Netlify (se decide al llegar); actualizar `CLAUDE.md`, README y handoff | Pendiente |

Decisiones: sin React (la web es dibujo y animación, apenas estado; ver `docs/plan.md`). Three.js se queda en r128 durante la migración: subirlo cambia luz y color y altera la acuarela, así que va aparte. No se publica en el artifact hasta tener el alojamiento definitivo.
