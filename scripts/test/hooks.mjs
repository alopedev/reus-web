// lets Node run src/ as Vite does, for the unit tests (`npm test`): the imports there have no extension, and the
// network timetable is the frozen one (scripts/baseline/red.json) unless RED names another, as in the parity build
import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';

const red = pathToFileURL(process.env.RED ?? 'scripts/baseline/red.json').href;
// the Rodalies index (virtual:rodalies, written by vite.config.js in the build) is the frozen timetable's, split here
// with the site's own split.ts; each town's file is named by its stop_id
const rodalies = pathToFileURL(process.env.RODALIES ?? 'scripts/baseline/rodalies.json').href;
const split = pathToFileURL('src/split.ts').href;
const VIRTUAL = 'capacasa:rodalies';

registerHooks({
  resolve(specifier, context, next) {
    if(specifier === 'virtual:rodalies') return { url: VIRTUAL, shortCircuit: true };
    if(specifier.endsWith('/data/red.json')) return { url: red, format: 'json', importAttributes: { type: 'json' }, shortCircuit: true };
    if(/^\.\.?\//.test(specifier) && !/\.\w+$/.test(specifier) && context.parentURL?.endsWith('.ts')) return next(specifier + '.ts', context);
    return next(specifier, context);
  },
  load(url, context, next) {
    if(url !== VIRTUAL) return next(url, context);
    return { format: 'module', shortCircuit: true, source: `import rod from ${JSON.stringify(rodalies)} with { type: 'json' };
import { split } from ${JSON.stringify(split)};
const { index, towns } = split(rod);
export default { ...index, f: Object.fromEntries(Object.keys(towns).map(id => [id, id + '.json'])) };` };
  },
});
