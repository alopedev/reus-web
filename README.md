# Barcelona ↔ Reus en acuarela

Próximos trenes regionales directos entre Barcelona-Sants y Reus, dentro de un vagón pintado en acuarela.

Web: https://reus-web.vercel.app · Vite + TypeScript, Three.js y GSAP.

```bash
npm install                   # la primera vez
npm run dev                   # web en local con recarga al guardar
npm run build                 # genera dist/
npm run check                 # compila y pasa las comprobaciones de diseño (requiere playwright)
python3 scripts/extract_trains.py   # actualiza horarios desde el GTFS abierto de Renfe
```

Documentación: `docs/PRD.md` (producto), `docs/plan.md` (decisiones), `docs/handoff.md` (estado).
Datos de horarios: GTFS abierto de Renfe (horario teórico, sin retrasos en tiempo real).
