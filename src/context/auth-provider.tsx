"use client";

import { useSearchParams } from "next/navigation";
import React, {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

interface AuthContextValue {
  loadingProvider: string | null;
  setLoadingProvider: Dispatch<SetStateAction<string | null>>;
  callbackUrl?: string;
}

export const AuthContext = createContext<AuthContextValue>({
  loadingProvider: null,
} as AuthContextValue);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  return (
    <AuthContext.Provider
      value={{ loadingProvider, setLoadingProvider, callbackUrl }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};
