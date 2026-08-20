export const getAuthRedirectUrl = (path = '/') => {
  const url = new URL(path, window.location.origin);
  return url.toString();
};
