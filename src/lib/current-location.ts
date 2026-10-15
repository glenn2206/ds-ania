export function requestCurrentLocation(geolocation: Pick<Geolocation, 'getCurrentPosition'> | undefined, secure: boolean): Promise<GeolocationCoordinates> {
  if (!secure || !geolocation) return Promise.reject(new Error('Location access is unavailable. Choose a pin manually.'));
  return new Promise((resolve, reject) => {
    geolocation.getCurrentPosition(({ coords }) => {
      if (!Number.isFinite(coords.latitude) || !Number.isFinite(coords.longitude) || Math.abs(coords.latitude) > 90 || Math.abs(coords.longitude) > 180) {
        reject(new Error('Location could not be found. Choose a pin manually.')); return;
      }
      resolve(coords);
    }, (error) => reject(new Error(error.code === 1
      ? 'Location permission was denied. Choose a pin manually.'
      : error.code === 3 ? 'Location request timed out. Try again or choose a pin manually.'
      : 'Location could not be found. Choose a pin manually.')),
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
  });
}
