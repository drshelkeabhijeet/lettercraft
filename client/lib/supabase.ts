import { getApiUrl } from "./query-client";

export interface SupabaseStyleProfile {
  id: string;
  profile_name: string;
  description: string;
  created_at: string;
}

export async function fetchStyleProfiles(): Promise<SupabaseStyleProfile[]> {
  try {
    const apiUrl = getApiUrl();
    const url = new URL("/api/style-profiles", apiUrl);
    
    const response = await fetch(url.toString(), {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Failed to fetch profiles:", response.status, errorData);
      return [];
    }

    const data = await response.json();
    return data as SupabaseStyleProfile[];
  } catch (error) {
    console.error("Error fetching style profiles:", error);
    return [];
  }
}
