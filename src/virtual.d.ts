// the Rodalies index (split.ts), written by vite.config.js from data/rodalies.json and, for the tests, by
// scripts/test/hooks.mjs from the frozen scripts/baseline/rodalies.json; time.ts gives it its type
declare module 'virtual:rodalies' {
  const index: unknown;
  export default index;
}
