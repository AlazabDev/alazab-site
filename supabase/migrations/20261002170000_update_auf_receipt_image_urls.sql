begin;

update public.auf_maintenance_receipts
set image_url = format(
  'https://r2.alazab.com/receipts/abuauf/2026/auf-%s.jpg',
  lpad(receipt_number::text, 3, '0')
)
where receipt_year = 2026
  and receipt_number between 1 and 120;

-- Guard against partial/misaligned updates.
do $$
declare
  v_count integer;
begin
  select count(*)
  into v_count
  from public.auf_maintenance_receipts
  where receipt_year = 2026
    and receipt_number between 1 and 120
    and image_url = format(
      'https://r2.alazab.com/receipts/abuauf/2026/auf-%s.jpg',
      lpad(receipt_number::text, 3, '0')
    );

  if v_count <> 120 then
    raise exception 'Expected 120 Abu Auf receipt image URLs to be updated, got %', v_count;
  end if;
end
$$;

commit;
