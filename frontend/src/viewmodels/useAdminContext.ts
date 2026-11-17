import { useOutletContext } from 'react-router-dom';

export interface AdminContext {
  token: string;
  accountId: number;
  onSessionExpired: () => void;
}
export function useAdminContext(): AdminContext {
  return useOutletContext<AdminContext>();
}
