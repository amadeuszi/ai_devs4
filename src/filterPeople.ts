import type { Person } from "./fetchAndParseCsv";

function getAge(birthDate: string, referenceYear: number): number {
  const birth = new Date(birthDate);
  const refDate = new Date(referenceYear, 0, 1);
  let age = refDate.getFullYear() - birth.getFullYear();
  if (
    refDate.getMonth() < birth.getMonth() ||
    (refDate.getMonth() === birth.getMonth() && refDate.getDate() < birth.getDate())
  ) {
    age--;
  }
  return age;
}

export function filterPeople(people: Person[]): Person[] {
  return people.filter((p) => {
    const age = getAge(p.birthDate, 2026);
    return p.gender === "M" && age >= 20 && age <= 40 && p.birthPlace === "Grudziądz";
  });
}
