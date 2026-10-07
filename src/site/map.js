// Equirectangular projection matching public/world-dots.svg, which was drawn
// from Natural Earth land data (world-atlas, public domain): a dot every 4
// units of land on a 1000-wide grid, between latitudes 84°N and 57°S.
export const MAP_W = 1000
export const MAP_H = 392
const LAT_TOP = 84
const LAT_BOTTOM = -57
export const project = (lat, lon) => [((lon + 180) / 360) * MAP_W, ((LAT_TOP - lat) / (LAT_TOP - LAT_BOTTOM)) * MAP_H]
