export interface AccessLevelResponse {
  name: string;
  surname: string;
  accessLevel: number;
}

export async function fetchAccessLevel(
  apiKey: string,
  name: string,
  surname: string,
  birthYear: number,
): Promise<AccessLevelResponse> {
  const res = await fetch(`${process.env.BASE_URL}/api/accesslevel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apikey: apiKey, name, surname, birthYear }),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch access level: ${res.status} ${res.statusText}`);
  }

  return await res.json();
}
