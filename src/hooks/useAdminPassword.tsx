// Deprecated. Kept as a thin shim so any leftover import still type-checks.
// The real admin auth now lives in `useAdminAuth.tsx`.
import { useAdminAuth } from "./useAdminAuth";

export const useAdminPassword = () => {
  const { changePassword: changePw } = useAdminAuth();
  return {
    loading: false,
    verifyPassword: async (_input: string) => false,
    changePassword: async (_currentPassword: string, newPassword: string) => {
      return changePw(newPassword);
    },
  };
};
