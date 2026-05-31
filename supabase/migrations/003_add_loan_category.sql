insert into categories (user_id, name, kind)
select s.user_id, 'Loan', 'expense'
from settings s
where not exists (
  select 1
  from categories c
  where c.user_id = s.user_id
    and c.name = 'Loan'
    and c.kind = 'expense'
);
