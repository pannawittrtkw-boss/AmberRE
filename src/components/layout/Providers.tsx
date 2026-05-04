"use client";

import { SessionProvider } from "next-auth/react";
import { FavoritesProvider } from "@/lib/favorites";
import { CompareProvider } from "@/lib/compare";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <FavoritesProvider>
        <CompareProvider>{children}</CompareProvider>
      </FavoritesProvider>
    </SessionProvider>
  );
}
