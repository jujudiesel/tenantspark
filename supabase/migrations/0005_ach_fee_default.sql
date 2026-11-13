-- Default tenant bank-transfer fee matches the market ($2.49).
alter table public.payment_settings alter column ach_fee_cents set default 249;
update public.payment_settings set ach_fee_cents = 249 where ach_fee_cents = 195;
