"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AddFab() {
  const pathname = usePathname();
  if (pathname === "/add") return null;

  return (
    <Link href="/add" className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-40">
      <Button
        size="lg"
        className="h-14 w-14 rounded-full shadow-lg"
        aria-label="Add transaction"
      >
        <Plus className="h-7 w-7" />
      </Button>
    </Link>
  );
}
