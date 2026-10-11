// visits (P1-4): Vercel Web Analytics, no cookies, page views only. Vercel serves its script only on the published
// site: at its address (D1, Àlex 11-10) and on its own *.vercel.app URLs; a local build never asks for it
export const counted = (host: string): boolean => host === 'capacasa.alope.dev' || host.endsWith('.vercel.app');
