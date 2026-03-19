export interface PersonLocation {
  latitude: number;
  longitude: number;
}

export async function fetchPersonLocations(
  apiKey: string,
  name: string,
  surname: string,
): Promise<PersonLocation[]> {
  const res = await fetch(`${process.env.BASE_URL}/api/location`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apikey: apiKey, name, surname }),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch person locations: ${res.status} ${res.statusText}`);
  }

  return await res.json();
}
