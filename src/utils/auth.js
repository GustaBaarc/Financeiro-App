export const getAuthRedirectUrl = (path = '/') => {
  const configuredSiteUrl = import.meta.env.VITE_SITE_URL?.trim().replace(/\/$/, '');
  const baseUrl = configuredSiteUrl || window.location.origin;
  const url = new URL(path, `${baseUrl}/`);
  return url.toString();
};
