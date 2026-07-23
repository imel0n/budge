// Location search + reverse geocoding, backed by Photon (photon.komoot.io).
// Provider-specific bits live here only — swap the endpoint and formatResult to
// move to Geoapify/LocationIQ/etc. without touching callers.
const ENDPOINT = 'https://photon.komoot.io'

function formatResult(feature) {
  const p = feature.properties
  const [lon, lat] = feature.geometry.coordinates
  const parts = [
    [p.housenumber, p.street].filter(Boolean).join(' '),
    p.district,
    p.city,
    p.postcode,
    p.country,
  ].filter(Boolean)
  const address = [...new Set(parts)].join(', ')
  return {
    key: `${p.osm_type}${p.osm_id}`,
    name: p.name || p.street || address || 'Unnamed location',
    address,
    lat,
    lon,
  }
}

export async function searchLocations(query, { lat, lon, limit = 8, signal } = {}) {
  const params = new URLSearchParams({ q: query, limit: String(limit) })
  if (lat != null && lon != null) {
    params.set('lat', String(lat))
    params.set('lon', String(lon))
  }
  const res = await fetch(`${ENDPOINT}/api/?${params}`, { signal })
  if (!res.ok) throw new Error(`Photon search failed: ${res.status}`)
  const data = await res.json()
  return (data.features ?? []).map(formatResult)
}

export async function reverseGeocode(lat, lon, { signal } = {}) {
  const params = new URLSearchParams({ lat: String(lat), lon: String(lon) })
  const res = await fetch(`${ENDPOINT}/reverse?${params}`, { signal })
  if (!res.ok) throw new Error(`Photon reverse failed: ${res.status}`)
  const data = await res.json()
  const feature = data.features?.[0]
  return feature ? formatResult(feature) : null
}

export function getCurrentPosition(options = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'))
      return
    }
    navigator.geolocation.getCurrentPosition((pos) => resolve(pos.coords), reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      ...options,
    })
  })
}
