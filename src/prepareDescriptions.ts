import type { Person } from "./fetchAndParseCsv";

export function prepareDescriptionsMarkdown(people: Person[]): string {
  const lines = [
    "# Job Descriptions",
    "",
    ...people.map(
      (p, i) =>
        `- ${i + 1}. ${p.job}\n`
    ),
  ];

  return lines.join("\n");
}
