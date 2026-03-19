export interface Person {
  name: string;
  surname: string;
  gender: "M" | "F";
  birthDate: string;
  birthPlace: string;
  birthCountry: string;
  job: string;
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

function parseRow(fields: string[]): Person {
  const [name, surname, gender, birthDate, birthPlace, birthCountry, job] = fields;
  return {
    name,
    surname,
    gender: gender as "M" | "F",
    birthDate,
    birthPlace,
    birthCountry,
    job,
  };
}

export async function fetchAndParseCsv(url: string): Promise<Person[]> {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to fetch CSV: ${res.status} ${res.statusText}`);
  }

  const csv = await res.text();
  const lines = csv.trim().split("\n");
  const dataLines = lines.slice(1);

  return dataLines.map((line) => parseRow(parseCsvLine(line)));
}
