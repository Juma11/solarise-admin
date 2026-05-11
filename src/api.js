const BASE = import.meta.env.VITE_API_URL || 'https://solarise-api.vintechafrica.com';

export const getToken  = () => localStorage.getItem('si_admin_token');
export const setToken  = (t) => localStorage.setItem('si_admin_token', t);
export const clearToken= () => localStorage.removeItem('si_admin_token');

async function req(path, options = {}) {
  const token = getToken();
  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (res.status === 401) { clearToken(); window.location.reload(); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

async function upload(path, formData, method = 'POST') {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data;
}

export const auth = {
  login:          (email, password) => req('/api/auth/login', { method:'POST', body: JSON.stringify({ email, password }) }),
  me:             () => req('/api/auth/me'),
  changePassword: (currentPassword, newPassword) => req('/api/auth/change-password', { method:'POST', body: JSON.stringify({ currentPassword, newPassword }) }),
};

export const usersApi = {
  list:    () => req('/api/users'),
  create:  (fd) => upload('/api/users', fd),
  update:  (id, fd) => upload(`/api/users/${id}`, fd, 'PUT'),
  suspend: (id) => req(`/api/users/${id}/suspend`, { method:'PATCH' }),
  delete:  (id) => req(`/api/users/${id}`, { method:'DELETE' }),
};

export const productsApi = {
  list:   (params = {}) => req('/api/products?' + new URLSearchParams({ active:'all', ...params })),
  create: (fd) => upload('/api/products', fd),
  update: (id, fd) => upload(`/api/products/${id}`, fd, 'PUT'),
  delete: (id) => req(`/api/products/${id}`, { method:'DELETE' }),
};

export const quotesApi = {
  list:         (params = {}) => req('/api/quotes?' + new URLSearchParams(params)),
  get:          (id) => req(`/api/quotes/${id}`),
  updateStatus: (id, status) => req(`/api/quotes/${id}/status`, { method:'PATCH', body: JSON.stringify({ status }) }),
  delete:       (id) => req(`/api/quotes/${id}`, { method:'DELETE' }),
};

export const galleryApi = {
  list:    () => req('/api/gallery?tag=all'),
  upload:  (fd) => upload('/api/gallery', fd),
  feature: (id) => req(`/api/gallery/${id}/feature`, { method:'PATCH' }),
  delete:  (id) => req(`/api/gallery/${id}`, { method:'DELETE' }),
};

export const blogApi = {
  list:   () => req('/api/blog?published=all'),
  create: (fd) => upload('/api/blog', fd),
  update: (id, fd) => upload(`/api/blog/${id}`, fd, 'PUT'),
  delete: (id) => req(`/api/blog/${id}`, { method:'DELETE' }),
};

export const teamApi = {
  list:   () => req('/api/team'),
  create: (fd) => upload('/api/team', fd),
  update: (id, fd) => upload(`/api/team/${id}`, fd, 'PUT'),
  delete: (id) => req(`/api/team/${id}`, { method:'DELETE' }),
};

export const testimonialsApi = {
  list:   () => req('/api/testimonials'),
  create: (data) => req('/api/testimonials', { method:'POST', body: JSON.stringify(data) }),
  update: (id, data) => req(`/api/testimonials/${id}`, { method:'PUT', body: JSON.stringify(data) }),
  delete: (id) => req(`/api/testimonials/${id}`, { method:'DELETE' }),
};

export const positionsApi = {
  list:   () => req('/api/positions'),
  create: (data) => req('/api/positions', { method:'POST', body: JSON.stringify(data) }),
  update: (id, data) => req(`/api/positions/${id}`, { method:'PUT', body: JSON.stringify(data) }),
  delete: (id) => req(`/api/positions/${id}`, { method:'DELETE' }),
};

export const partnersApi = {
  list:   () => req('/api/partners'),
  create: (fd) => upload('/api/partners', fd),
  delete: (id) => req(`/api/partners/${id}`, { method:'DELETE' }),
};

export const settingsApi = {
  get:    () => req('/api/settings'),
  update: (data) => req('/api/settings', { method:'PUT', body: JSON.stringify(data) }),
};
