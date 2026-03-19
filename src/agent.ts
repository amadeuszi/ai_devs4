import { appendFileSync, mkdirSync } from "fs";
import { join } from "path";
import { fetchPowerPlants } from "./tools/fetchPowerPlants";
import { fetchPersonLocations } from "./tools/fetchPersonLocations";
import { fetchAccessLevel } from "./tools/fetchAccessLevel";
import { fetchTransportPeople } from "./tools/fetchTransportPeople";
import { verify } from "./tools/verify";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const API_KEY = process.env.AI_DEVS_API_KEY!;
const BASE_URL = process.env.BASE_URL!;

const LOG_DIR = join(__dirname, "..", "log");
mkdirSync(LOG_DIR, { recursive: true });

function logTool(toolName: string, args: unknown, result: unknown) {
  const timestamp = new Date().toISOString();
  const entry = { timestamp, tool: toolName, args, result };
  const filePath = join(LOG_DIR, `${toolName}.json`);
  appendFileSync(filePath, JSON.stringify(entry, null, 2) + "\n---\n");
}

const toolDefinitions = [
  {
    type: "function" as const,
    function: {
      name: "fetch_power_plants",
      description:
        "Fetches the list of nuclear power plants with their locations (city names), active status, power output, and code.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "fetch_transport_people",
      description:
        "Fetches the list of transport workers (men aged 20-40 born in Grudziądz). Returns name, surname, birth date, job description, and tags.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "fetch_person_locations",
      description:
        "Fetches the list of GPS coordinates (latitude, longitude) where people were seen. Accepts an array of people — returns results for each.",
      parameters: {
        type: "object",
        properties: {
          people: {
            type: "array",
            description: "List of people to check",
            items: {
              type: "object",
              properties: {
                name: { type: "string", description: "Person's first name" },
                surname: { type: "string", description: "Person's surname" },
              },
              required: ["name", "surname"],
            },
          },
        },
        required: ["people"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "fetch_access_level",
      description:
        "Checks the access level of people. Accepts an array of people — returns results for each.",
      parameters: {
        type: "object",
        properties: {
          people: {
            type: "array",
            description: "List of people to check",
            items: {
              type: "object",
              properties: {
                name: { type: "string", description: "Person's first name" },
                surname: { type: "string", description: "Person's surname" },
                birthYear: { type: "number", description: "Person's birth year" },
              },
              required: ["name", "surname", "birthYear"],
            },
          },
        },
        required: ["people"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "web_search",
      description:
        "Searches the internet for information, e.g. GPS coordinates of a city, power plant location, etc.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "verify",
      description:
        "Submits the final answer for verification. Call ONLY when you have all data: name, surname, access level, and power plant code.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Person's first name" },
          surname: { type: "string", description: "Person's surname" },
          accessLevel: { type: "number", description: "Person's access level" },
          powerPlant: { type: "string", description: "Power plant code (e.g. PWR1234PL)" },
        },
        required: ["name", "surname", "accessLevel", "powerPlant"],
      },
    },
  },
];

async function executeTool(
  name: string,
  args: Record<string, unknown>,
): Promise<string> {
  console.log(`  → tool: ${name}(${JSON.stringify(args)})`);

  switch (name) {
    case "fetch_power_plants": {
      const result = await fetchPowerPlants(BASE_URL, API_KEY);
      logTool(name, args, result);
      return JSON.stringify(result);
    }
    case "fetch_transport_people": {
      const result = await fetchTransportPeople(BASE_URL, API_KEY);
      logTool(name, args, result);
      return JSON.stringify(result);
    }
    case "fetch_person_locations": {
      const people = args.people as { name: string; surname: string }[];
      const results = await Promise.all(
        people.map(async (p) => ({
          name: p.name,
          surname: p.surname,
          locations: await fetchPersonLocations(API_KEY, p.name, p.surname),
        })),
      );
      logTool(name, args, results);
      return JSON.stringify(results);
    }
    case "fetch_access_level": {
      const people = args.people as { name: string; surname: string; birthYear: number }[];
      const results = await Promise.all(
        people.map(async (p) => {
          const res = await fetchAccessLevel(API_KEY, p.name, p.surname, p.birthYear);
          return res;
        }),
      );
      logTool(name, args, results);
      return JSON.stringify(results);
    }
    case "web_search": {
      const result = await webSearch(args.query as string);
      logTool(name, args, result);
      return result;
    }
    case "verify": {
      const result = await verify(API_KEY, {
        name: args.name as string,
        surname: args.surname as string,
        accessLevel: args.accessLevel as number,
        powerPlant: args.powerPlant as string,
      });
      logTool(name, args, result);
      return JSON.stringify(result);
    }
    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}

async function webSearch(query: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      tools: [{ type: "web_search_preview" }],
      input: query,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return JSON.stringify({ error: `Web search failed: ${res.status}`, details: text });
  }

  const data = await res.json();
  const textOutput = data.output?.find((o: { type: string }) => o.type === "message");
  const content = textOutput?.content?.[0]?.text ?? JSON.stringify(data.output);
  return content;
}

type Message =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

const SYSTEM_PROMPT = `Follow these steps EXACTLY in order. After each step, call the appropriate tool. NEVER end the conversation with text — always call tools.

STEP 1: Call fetch_power_plants and fetch_transport_people in parallel.
STEP 2: Call web_search for EACH power plant city to get its GPS coordinates. Search: "GPS coordinates [city name]".
STEP 3: Call fetch_person_locations with ALL transport people at once.
STEP 4: Calculate the distance (haversine) from each person's location to each power plant. List the distance for each pair. Select people who were within 100km of a power plant.
STEP 5: Call fetch_access_level for the people from step 4 (use birthYear from their birth date).
STEP 6: Pick the person with the HIGHEST accessLevel (higher is better).
STEP 7: Call verify with: name, surname, accessLevel, powerPlant (the power plant code e.g. PWR1234PL).

RULES:
- You MUST call verify at the end. The task is NOT complete without verify.
- If you want to respond with text instead of calling a tool — STOP and call a tool instead.
- Do not summarize, do not describe a plan — call tools immediately.`;

export async function runAgent(userPrompt: string): Promise<string> {
  const messages: Message[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userPrompt },
  ];

  const MAX_ITERATIONS = 20;
  let verifySucceeded = false;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    console.log(`\n=== Agent iteration ${i + 1} ===`);

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1",
        messages,
        tools: toolDefinitions,
      }),
    });

    if (!res.ok) {
      throw new Error(`OpenAI error: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    const choice = data.choices[0];
    const msg = choice.message;

    messages.push(msg);

    if (msg.content) {
      console.log(`  Agent: ${msg.content}`);
    }

    if (choice.finish_reason === "stop" || !msg.tool_calls?.length) {
      if (verifySucceeded) {
        console.log("\n=== Agent finished (verify succeeded) ===");
        return msg.content ?? "(no response)";
      }

      console.log("  ⚠ Agent tried to stop without calling verify — pushing back");
      messages.push({
        role: "user",
        content: "You are not done! You MUST call verify. Go back to the last step you haven't completed and continue. Call a tool NOW.",
      });
      continue;
    }

    const toolResults = await Promise.all(
      msg.tool_calls.map(async (tc: ToolCall) => {
        const args = JSON.parse(tc.function.arguments);
        const result = await executeTool(tc.function.name, args);
        if (tc.function.name === "verify") {
          try {
            const parsed = JSON.parse(result);
            if (parsed.success) verifySucceeded = true;
          } catch {}
        }
        console.log(`  ← ${tc.function.name}: ${result.slice(0, 200)}...`);
        return { role: "tool" as const, tool_call_id: tc.id, content: result };
      }),
    );

    messages.push(...toolResults);
  }

  throw new Error("Agent exceeded max iterations");
}
