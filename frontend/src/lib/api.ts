// API Configuration and Authentication Utilities

export const API_BASE_URL = (
    process.env.NEXT_PUBLIC_API_URL ||
    "https://international-student-planner-production-c1eb.up.railway.app"
).replace(/^http:\/\/https:\/\//, "https://").replace(/\/+$/, "");

export interface UserProfile {
    id?: string;
    name: string;
    email: string;
    subscription?: {
        plan_type?: string;
        status?: string;
        start_date?: string;
    };
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
    user?: UserProfile;
}

export function getAuthToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
}

export function getAuthHeaders(): Record<string, string> {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getStoredUser(): UserProfile | null {
    if (typeof window === "undefined") return null;
    try {
        const userStr = localStorage.getItem("user");
        return userStr ? JSON.parse(userStr) : null;
    } catch {
        return null;
    }
}

export function setAuthSession(token: string, user?: UserProfile): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("token", token);
    if (user) {
        localStorage.setItem("user", JSON.stringify(user));
    }
    window.dispatchEvent(new Event("auth-change"));
}

export function clearAuthSession(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth-change"));
}

export async function fetchCurrentUser(token: string): Promise<UserProfile | null> {
    const res = await fetch(`${API_BASE_URL}/me`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    if (res.status === 401 || res.status === 403) return null;
    if (!res.ok) {
        throw new Error(`/me request failed with status ${res.status}`);
    }
    return await res.json();
}
