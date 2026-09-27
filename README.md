# Barcelona ↔ Reus en acuarela

Próximos trenes regionales directos entre Barcelona-Sants y Reus, dentro de un vagón pintado en acuarela.

```bash
python3 scripts/build.py      # genera dist/index.html
open dist/index.html          # o ábrelo en cualquier navegador
python3 scripts/check.py      # comprobaciones de diseño (requiere playwright)
python3 scripts/extract_trains.py   # actualiza horarios desde el GTFS abierto de Renfe
```

Documentación: `docs/PRD.md` (producto), `docs/plan.md` (decisiones), `docs/handoff.md` (estado).
Datos de horarios: GTFS abierto de Renfe (horario teórico, sin retrasos en tiempo real).
