import type { TaggedPerson } from "./tagDescriptions";

const VERIFY_URL = `${process.env.BASE_URL}/verify`;

interface AnswerEntry {
  name: string;
  surname: string;
  gender: string;
  born: number;
  city: string;
  tags: string[];
}

export async function sendAnswer(apiKey: string, people: TaggedPerson[]) {
  const answer: AnswerEntry[] = people.map((p) => ({
    name: p.name,
    surname: p.surname,
    gender: p.gender,
    born: new Date(p.birthDate).getFullYear(),
    city: p.birthPlace,
    tags: [...p.tags],
  }));

  const body = {
    apikey: apiKey,
    task: "people",
    answer,
  };

  console.log("Sending answer:", JSON.stringify(body, null, 2));

  const res = await fetch(VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.error("Verify API error:", res.status, res.statusText);
    console.error("Verify API error body:", await res.text());
    throw new Error(`Verify API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  console.log("Response:", data);
  return data;
}
