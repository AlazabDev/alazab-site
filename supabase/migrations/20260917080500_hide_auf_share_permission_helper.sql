revoke all on function public._assert_auf_share_permission(uuid, text)
  from public, anon, authenticated;

grant execute on function public._assert_auf_share_permission(uuid, text)
  to service_role;
