alter table transactions
  add column if not exists food_name text null,
  add column if not exists restaurant_name text null,
  add column if not exists source_url text null,
  add column if not exists image_url text null;

create index if not exists idx_transactions_food_expense_lookup
  on transactions(type, food_name, restaurant_name)
  where type = 'EXPENSE';
