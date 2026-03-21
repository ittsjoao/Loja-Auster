const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export async function getCoinsBalance(feedzEmployeeId: number): Promise<number> {
  try {
    const response = await fetch(`${API_BASE_URL}/coins/${feedzEmployeeId}`);
    if (!response.ok) return 0;
    const data = await response.json();
    return data.balance ?? 0;
  } catch {
    return 0;
  }
}
