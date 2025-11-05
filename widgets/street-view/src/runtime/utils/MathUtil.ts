
export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {

  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δλ = toRadians(lon2 - lon1);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) -
            Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  let θ = Math.atan2(y, x);

  θ = toDegrees(θ);

  return (θ + 360) % 360;
}


export function CalculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRadians = (deg: number) => deg * Math.PI / 180;

  const R = 6371e3; 
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lon2 - lon1);

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; 
}

export function ConvertYawToBearing(yaw: number): number {
  return ((yaw * 180 / Math.PI) + 360) % 360;
}

export function toBearing(number: number): number {
  return ((number % 360) + 360) % 360;
}

export function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

export function normalizeAngleDifference(angle: number) {
  let a = angle % 360;
  if (a > 0) a -= 360;
  if (a < -360) a += 360;

  return a;
}

export function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}