export interface FindHimAnswer {
  name: string;
  surname: string;
  accessLevel: number;
  powerPlant: string;
}

export interface VerifyResult {
  success: boolean;
  response: unknown;
}

export async function verify(apiKey: string, answer: FindHimAnswer): Promise<VerifyResult> {
  const verifyUrl = `${process.env.BASE_URL}/verify`;

  const body = {
    apikey: apiKey,
    task: "findhim",
    answer,
  };

  console.log("Sending verify:", JSON.stringify(body, null, 2));

  const res = await fetch(verifyUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = res.headers.get("content-type")?.includes("application/json")
    ? await res.json()
    : { message: await res.text() };

  console.log("Verify response:", res.status, data);

  return { success: res.ok, response: data };
}
