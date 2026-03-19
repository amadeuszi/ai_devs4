import "dotenv/config";
import { runAgent } from "./agent";

async function main() {
  const answer = await runAgent(
    `You need to find which transport person was spotted near a nuclear power plant. You also need to determine their access level and which power plant they were seen near.

We need to find the person with the highest access level.

Steps:
1. Fetch the list of nuclear power plants and the list of transport people.
2. For each transport person, fetch their locations (GPS coordinates).
3. Use web_search to find the GPS coordinates of power plant cities.
4. Compare person coordinates with power plant locations — find who was close to a power plant.
5. For people near a power plant, check their access level.
6. Report the person with the highest access level, their access level, and the power plant code where they were seen.`,
  );

  console.log("\n========== FINAL ANSWER ==========");
  console.log(answer);
}

main().catch(console.error);
