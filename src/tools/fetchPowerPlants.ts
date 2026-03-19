export interface PowerPlant {
  is_active: boolean;
  power: string;
  code: string;
}

export type PowerPlants = Record<string, PowerPlant>;

interface LocationsResponse {
  power_plants: PowerPlants;
}

export async function fetchPowerPlants(baseUrl: string, apiKey: string): Promise<PowerPlants> {
  const url = `${baseUrl}/data/${apiKey}/findhim_locations.json`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to fetch power plants: ${res.status} ${res.statusText}`);
  }

  const data: LocationsResponse = await res.json();
  return data.power_plants;
}
