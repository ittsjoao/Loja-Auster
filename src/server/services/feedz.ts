const FEEDZ_KEY = process.env.FEEDZ_API_KEY;
const FEEDZ_BASE = "https://app.feedz.com.br/v2/integracao";

async function feedzFetch(
  path: string,
  options?: RequestInit,
): Promise<Response> {
  if (!FEEDZ_KEY) throw new Error("FEEDZ_API_KEY not configured");

  return fetch(`${FEEDZ_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${FEEDZ_KEY}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
}

export async function getFeedzEmployee(email: string) {
  try {
    const resp = await feedzFetch(
      `/employees?email=${encodeURIComponent(email)}`,
    );
    if (!resp.ok) return null;

    const data = await resp.json();
    if (!data.success || !data.data?.length) return null;

    const employee = data.data[0];
    if (employee.status !== "Ativo") return null;

    return employee;
  } catch (error) {
    console.error("[FEEDZ] Error fetching employee:", error);
    return null;
  }
}

export async function getCoinsBalance(
  feedzEmployeeId: number,
): Promise<number | null> {
  try {
    const resp = await feedzFetch(`/employees/${feedzEmployeeId}/feedzcoins`);
    if (!resp.ok) return null;

    const data = await resp.json();
    return data.data?.feedzcoins ? parseInt(data.data.feedzcoins) : 0;
  } catch (error) {
    console.error("[FEEDZ] Error fetching balance:", error);
    return null;
  }
}

export async function creditCoins(
  feedzEmployeeId: number,
  amount: number,
  description: string,
): Promise<boolean> {
  try {
    const resp = await feedzFetch(`/employees/${feedzEmployeeId}/feedzcoins`, {
      method: "PUT",
      body: JSON.stringify({
        feedzcoins: Math.abs(amount),
        type: 1,
        description,
      }),
    });
    return resp.ok;
  } catch (error) {
    console.error("[FEEDZ] Error crediting coins:", error);
    return false;
  }
}

export async function debitCoins(
  feedzEmployeeId: number,
  amount: number,
  description: string,
): Promise<boolean> {
  try {
    const resp = await feedzFetch(`/employees/${feedzEmployeeId}/feedzcoins`, {
      method: "PUT",
      body: JSON.stringify({
        feedzcoins: -Math.abs(amount),
        type: 1,
        description,
      }),
    });
    return resp.ok;
  } catch (error) {
    console.error("[FEEDZ] Error debiting coins:", error);
    return false;
  }
}
