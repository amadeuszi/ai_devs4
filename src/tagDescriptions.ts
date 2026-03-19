import type { Person } from "./fetchAndParseCsv";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const AVAILABLE_TAGS = [
  "IT",
  "transport",
  "edukacja",
  "medycyna",
  "praca z ludźmi",
  "praca z pojazdami",
  "praca fizyczna",
] as const;

export type Tag = (typeof AVAILABLE_TAGS)[number];

export interface TaggedPerson extends Person {
  tags: Tag[];
}

export async function tagDescriptions(people: Person[]): Promise<TaggedPerson[]> {
  const descriptions = people
    .map((p, i) => `${i + 1}. ${p.job}`)
    .join("\n");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-5.4",
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `Klasyfikujesz opisy zawodów przypisując tagi. Używaj WYŁĄCZNIE tagów z poniższej listy.

<dostępne_tagi>
- IT — przykłady: programiści, administratorzy systemów, analitycy danych, projektanci UX/UI, DevOps, bazy danych, sieci komputerowe
- transport — przykłady: kierowcy, piloci, maszyniści, logistyka, spedycja, przewóz osób lub towarów
- edukacja — przykłady: nauczyciele, wykładowcy, trenerzy, szkoleniowcy, wychowawcy, korepetytorzy
- medycyna — przykłady: lekarze, pielęgniarki, farmaceuci, fizjoterapeuci, ratownicy medyczni, diagności
- praca z ludźmi — przykłady: sprzedawcy, doradcy, psychologowie, pracownicy socjalni, HR, obsługa klienta, negocjatorzy, ludzie, którzy mają do czynienia z innymi ludźmi w pracy
- praca z pojazdami — przykłady: mechanicy samochodowi, blacharze, lakiernicy, serwisanci maszyn, operatorzy wózków
- praca fizyczna — przykłady: budowlańcy, hydraulicy, elektrycy, stolarze, spawacze, ślusarze, prace manualne, rzemieślnicy
</dostępne_tagi>

<zasady>
- Przypisuj TYLKO tagi z powyższej listy, pisane dokładnie tak jak podano.
- Jeden opis może mieć 0, 1 lub więcej tagów.
- Jeśli opis nie pasuje do żadnego tagu — zwróć pustą tablicę.
</zasady>

<przykład>
Wejście: "1. Naprawia instalacje wodne i kanalizacyjne w domach i budynkach."
Wyjście: [{"index": 1, "tags": ["praca fizyczna"]}]
</przykład>

<przykład>
Wejście: "1. Naprawia instalacje wodne i kanalizacyjne w domach oraz negucjuje kontrakty z klientami."
Wyjście: [{"index": 1, "tags": ["praca fizyczna", "praca z ludźmi"]}]
</przykład>
`,
        },
        {
          role: "user",
          content: descriptions,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "tagged_people",
          strict: true,
          schema: {
            type: "object",
            properties: {
              results: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    index: { type: "number" },
                    tags: {
                      type: "array",
                      items: {
                        type: "string",
                        enum: [...AVAILABLE_TAGS],
                      },
                    },
                  },
                  required: ["index", "tags"],
                  additionalProperties: false,
                },
              },
            },
            required: ["results"],
            additionalProperties: false,
          },
        },
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const content: string = data.choices[0].message.content;
  const { results }: { results: { index: number; tags: Tag[] }[] } = JSON.parse(content);

  return people.map((person, i) => ({
    ...person,
    tags: results.find((r) => r.index === i + 1)?.tags ?? [],
  }));
}
