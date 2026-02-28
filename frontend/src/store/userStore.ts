import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserState {
  token: string | null;
  role: string | null;
  email: string | null;
  name: string | null;
  setUser: (token: string, role: string, email: string, name: string) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      token: localStorage.getItem("token"), // Initial sync
      role: null,
      email: null,
      name: null,
      setUser: (token, role, email, name) => {
        localStorage.setItem("token", token);
        set({ token, role, email, name });
      },
      logout: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        set({ token: null, role: null, email: null, name: null });
      },
    }),
    {
      name: "user-storage",
    }
  )
);
