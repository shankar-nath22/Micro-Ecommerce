import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserState {
  token: string | null;
  role: string | null;
  email: string | null;
  setUser: (token: string, role: string, email: string) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      token: localStorage.getItem("token"), // Initial sync
      role: null,
      email: null,
      setUser: (token, role, email) => {
        localStorage.setItem("token", token);
        set({ token, role, email });
      },
      logout: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        set({ token: null, role: null, email: null });
      },
    }),
    {
      name: "user-storage",
    }
  )
);
