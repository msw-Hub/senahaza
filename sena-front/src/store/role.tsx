import { create } from "zustand";

type Role = "VIEWER" | "EDITOR" | "ROOT";

interface RoleStore {
  role: Role;
  setRole: (role: Role) => void;
}

export const useRoleStore = create<RoleStore>((set) => ({
  role: "VIEWER",
  setRole: (role: Role) => set({ role }),
}));
