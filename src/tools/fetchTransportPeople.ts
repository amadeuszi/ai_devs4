import { fetchAndParseCsv } from "../fetchAndParseCsv";
import { filterPeople } from "../filterPeople";
import { tagDescriptions, type TaggedPerson } from "../tagDescriptions";

export async function fetchTransportPeople(baseUrl: string, apiKey: string): Promise<TaggedPerson[]> {
  const people = await fetchAndParseCsv(`${baseUrl}/data/${apiKey}/people.csv`);
  console.log(`Fetched ${people.length} people`);

  const filtered = filterPeople(people);
  console.log(`Filtered: ${filtered.length} men aged 20-40 born in Grudziądz`);

  const tagged = await tagDescriptions(filtered);
  const transport = tagged.filter((p) => p.tags.includes("transport"));
  console.log(`Tagged: ${tagged.length} people, ${transport.length} with "transport"`);

  return transport;
}
