create table if not exists member_fee_schedules (
  id bigserial primary key,
  user_id bigint not null references users(id),
  monthly_fee integer not null check (monthly_fee >= 0),
  effective_from_month text not null check (effective_from_month ~ '^[0-9]{4}-[0-9]{2}$'),
  effective_to_month text null check (effective_to_month is null or effective_to_month ~ '^[0-9]{4}-[0-9]{2}$'),
  note text null,
  created_at timestamptz not null default now()
);

create index if not exists idx_member_fee_schedules_user_month
  on member_fee_schedules(user_id, effective_from_month, effective_to_month);
