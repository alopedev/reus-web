// lets Node run src/ as Vite does, for the unit tests (`npm test`): the imports there have no extension, and the
// network timetable is the frozen one (scripts/baseline/red.json) unless RED names another, as in the parity build
import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';

const red = pathToFileURL(process.env.RED ?? 'scripts/baseline/red.json').href;

registerHooks({
  resolve(specifier, context, next) {
    if(specifier.endsWith('/data/red.json')) return { url: red, format: 'json', importAttributes: { type: 'json' }, shortCircuit: true };
    if(/^\.\.?\//.test(specifier) && !/\.\w+$/.test(specifier) && context.parentURL?.endsWith('.ts')) return next(specifier + '.ts', context);
    return next(specifier, context);
  },
});
