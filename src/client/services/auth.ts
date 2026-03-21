import type { User } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export const authService = {
  login: async (email: string, password: string): Promise<User | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) return null;

      const data = await response.json();
      localStorage.setItem("currentUserId", data.user.id);
      localStorage.setItem("currentUser", JSON.stringify(data.user));
      return data.user;
    } catch (error) {
      console.error("Login error:", error);
      return null;
    }
  },

  logout: async (): Promise<void> => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      // Ignore logout API errors
    } finally {
      localStorage.removeItem("currentUserId");
      localStorage.removeItem("currentUser");
    }
  },

  getCurrentUser: async (): Promise<Omit<User, "password"> | null> => {
    try {
      const storedUser = localStorage.getItem("currentUser");
      if (storedUser) return JSON.parse(storedUser);

      const userId = localStorage.getItem("currentUserId");
      if (!userId) return null;

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { "x-user-id": userId },
      });

      if (!response.ok) {
        localStorage.removeItem("currentUserId");
        localStorage.removeItem("currentUser");
        return null;
      }

      const data = await response.json();
      localStorage.setItem("currentUser", JSON.stringify(data.user));
      return data.user;
    } catch (error) {
      console.error("Get current user error:", error);
      return null;
    }
  },

  getAllUsers: async (): Promise<Omit<User, "password">[]> => {
    const response = await fetch(`${API_BASE_URL}/auth/users`);
    if (!response.ok) throw new Error("Erro ao buscar usuários");
    return response.json();
  },

  createUser: async (user: {
    email: string;
    password: string;
    name?: string;
    role?: string;
    profilePicture?: string;
  }): Promise<Omit<User, "password">> => {
    const response = await fetch(`${API_BASE_URL}/auth/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Erro ao criar usuário");
    }
    const data = await response.json();
    return data.user;
  },

  updateUser: async (
    id: string,
    updates: Partial<User & { password?: string }>,
  ): Promise<Omit<User, "password"> | null> => {
    const response = await fetch(`${API_BASE_URL}/auth/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      const error = await response.json();
      throw new Error(error.error || "Erro ao atualizar usuário");
    }

    const data = await response.json();

    // Update localStorage if updating current user
    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
      const parsed = JSON.parse(currentUser);
      if (parsed.id === id) {
        localStorage.setItem("currentUser", JSON.stringify(data.user));
      }
    }

    return data.user;
  },

  deleteUser: async (id: string): Promise<boolean> => {
    const response = await fetch(`${API_BASE_URL}/auth/users/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Erro ao deletar usuário");
    }
    return true;
  },
};
