export function parseDeliveryCoordinates(input: string): { latitude: number; longitude: number } | undefined {
  const pair = input.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!pair) return;
  const latitude = Number(pair[1]);
  const longitude = Number(pair[2]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return;
  return { latitude, longitude };
}
