"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Entity } from "@/types/database";

export type EntityFilter = string | "all";

interface EntityContextValue {
  entities: Entity[];
  selectedEntityId: EntityFilter;
  setSelectedEntityId: (id: EntityFilter) => void;
  lastUsedEntityId: string | null;
  setLastUsedEntityId: (id: string) => void;
}

const EntityContext = createContext<EntityContextValue | null>(null);

export function EntityProvider({
  entities,
  children,
}: {
  entities: Entity[];
  children: React.ReactNode;
}) {
  const [selectedEntityId, setSelectedEntityId] = useState<EntityFilter>("all");
  const [lastUsedEntityId, setLastUsedEntityIdState] = useState<string | null>(
    null
  );

  useEffect(() => {
    const stored = localStorage.getItem("lastEntityId");
    if (stored) setLastUsedEntityIdState(stored);
    const storedFilter = localStorage.getItem("entityFilter");
    if (storedFilter) setSelectedEntityId(storedFilter as EntityFilter);
  }, []);

  const setLastUsedEntityId = (id: string) => {
    setLastUsedEntityIdState(id);
    localStorage.setItem("lastEntityId", id);
  };

  const handleSetSelected = (id: EntityFilter) => {
    setSelectedEntityId(id);
    localStorage.setItem("entityFilter", id);
  };

  return (
    <EntityContext.Provider
      value={{
        entities,
        selectedEntityId,
        setSelectedEntityId: handleSetSelected,
        lastUsedEntityId,
        setLastUsedEntityId,
      }}
    >
      {children}
    </EntityContext.Provider>
  );
}

export function useEntityContext() {
  const ctx = useContext(EntityContext);
  if (!ctx) throw new Error("useEntityContext must be used within EntityProvider");
  return ctx;
}
