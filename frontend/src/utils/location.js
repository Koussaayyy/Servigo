export const normalizeCity = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

export const toRad = (deg) => (deg * Math.PI) / 180;

export const haversineDistanceKm = (from, to) => {
  if (!from || !to) return null;

  const lat1 = Number(from.lat);
  const lon1 = Number(from.lon);
  const lat2 = Number(to.lat);
  const lon2 = Number(to.lon);

  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return null;

  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return earthRadiusKm * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

export const getBrowserPosition = () =>
  new Promise((resolve, reject) => {
    if (!navigator?.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position?.coords?.latitude);
        const lon = Number(position?.coords?.longitude);

        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
          reject(new Error("Invalid geolocation coordinates"));
          return;
        }

        resolve({ lat, lon });
      },
      (error) => {
        reject(new Error(error?.message || "Unable to get location"));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

export const geocodeCityNominatim = async (city) => {
  const normalized = String(city || "").trim();
  if (!normalized) return null;

  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(normalized)}`;
  const response = await fetch(url, { headers: { Accept: "application/json" } });

  if (!response.ok) return null;

  const data = await response.json();
  const first = Array.isArray(data) ? data[0] : null;

  const lat = Number(first?.lat);
  const lon = Number(first?.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon };
};

export const sortByDistanceThenRating = (workers, userCoords, cityCoordsMap = {}) =>
  [...(Array.isArray(workers) ? workers : [])]
    .map((worker) => {
      const city = String(worker?.workerProfile?.city || "").trim();
      const cityCoords = city ? cityCoordsMap[city] : null;
      const distanceKm = userCoords && cityCoords ? haversineDistanceKm(userCoords, cityCoords) : null;
      const rating = Number(worker?.workerProfile?.rating || 0);

      return {
        ...worker,
        distanceKm,
        rating,
      };
    })
    .sort((left, right) => {
      const leftHasDistance = Number.isFinite(left.distanceKm);
      const rightHasDistance = Number.isFinite(right.distanceKm);

      if (leftHasDistance && rightHasDistance && left.distanceKm !== right.distanceKm) {
        return left.distanceKm - right.distanceKm;
      }

      if (leftHasDistance && !rightHasDistance) return -1;
      if (!leftHasDistance && rightHasDistance) return 1;

      return right.rating - left.rating;
    });
