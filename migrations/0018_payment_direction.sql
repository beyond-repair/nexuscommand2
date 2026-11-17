-- Historical payment rows were written by the receipt form (money the owner says arrived).
-- They are receipts. They must not consume a spending ceiling. New expenditure rows opt in.

alter table payments add column if not exists direction text not null default 'receipt';

alter table payments drop constraint if exists payments_direction_check;

alter table payments add constraint payments_direction_check
  check (direction in ('receipt', 'expenditure'));
