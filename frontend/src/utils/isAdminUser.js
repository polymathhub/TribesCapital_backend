const getRoleName = (role) => {
  if (typeof role === 'string') return role;
  return role?.name || role?.roleName || role?.role?.name || '';
};

export function isAdminUser(candidate) {
  const roles = [
    ...(Array.isArray(candidate?.roles) ? candidate.roles : []),
    candidate?.role,
    candidate?.roleName,
  ];
  const roleNames = roles
    .map((role) => getRoleName(role).trim().toLowerCase().replace(/[\s_]+/g, '-'))
    .filter(Boolean);

  return Boolean(
    candidate?.isAdmin
    || candidate?.isSuperAdmin
    || roleNames.includes('admin')
    || roleNames.includes('super-admin'),
  );
}
