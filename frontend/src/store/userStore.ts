import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserState {
  token: string | null;
  userId: string | null;
  role: string | null;
  email: string | null;
  name: string | null;
  setUser: (token: string, userId: string, role: string, email: string, name: string) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      token: localStorage.getItem("token"), // Initial sync
      userId: localStorage.getItem("userId"),
      role: null,
      email: null,
      name: null,
      setUser: (token, userId, role, email, name) => {
        localStorage.setItem("token", token);
        localStorage.setItem("userId", userId);
        set({ token, userId, role, email, name });
      },
      logout: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        set({ token: null, userId: null, role: null, email: null, name: null });
      },
    }),
    {
      name: "user-storage",
    }
  )
);
