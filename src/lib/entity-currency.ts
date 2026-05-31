import type { Currency, Entity } from "@/types/database";

export function entityUsesMultipleCurrencies(entity: Entity | undefined): boolean {
  return entity?.name === "Personal";
}

export function itemsMixCurrencies(
  items: { currency: Currency }[]
): boolean {
  return new Set(items.map((i) => i.currency)).size > 1;
}

export function shouldConvertForView(
  entityFilter: string,
  entities: Entity[],
  relatedItems: { currency: Currency }[] = []
): boolean {
  if (entityFilter === "all") return true;
  const entity = entities.find((e) => e.id === entityFilter);
  if (entityUsesMultipleCurrencies(entity)) {
    return itemsMixCurrencies(relatedItems) || true;
  }
  return false;
}
