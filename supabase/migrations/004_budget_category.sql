alter table budget_items add column if not exists category text;

update budget_items
set category = item_name
where category is null;

alter table budget_items
  alter column category set not null;
