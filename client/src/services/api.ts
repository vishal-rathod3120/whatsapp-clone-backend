const API_BASE = 'http://localhost:3000/api/v1';

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

    if (res.status === 401) {
      const refreshed = await this.refreshToken();
      if (refreshed) return this.request<T>(path, options);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(err.message || `HTTP ${res.status}`);
    }

    return res.json();
  }

  private async refreshToken(): Promise<boolean> {
    const refresh = localStorage.getItem('refreshToken');
    if (!refresh) return false;
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refresh }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  // Auth
  async login(phoneNumber: string, password: string) {
    const phone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    const data = await this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber: phone, password, device: { deviceType: 'WEB', deviceName: navigator.userAgent.slice(0, 50) } }),
    });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    return data;
  }

  async register(displayName: string, phoneNumber: string, password: string) {
    const phone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    const data = await this.request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ displayName, phoneNumber: phone, password, device: { deviceType: 'WEB', deviceName: navigator.userAgent.slice(0, 50) } }),
    });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    return data;
  }

  async logout() {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({}),
      });
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  // Users
  async getProfile() { return this.request<any>('/users/me'); }
  async updateProfile(data: any) { return this.request<any>('/users/me', { method: 'PATCH', body: JSON.stringify(data) }); }
  async searchUsers(query: string) { return this.request<any>(`/users/search?q=${encodeURIComponent(query)}`); }

  // Chats
  async getChatList(cursor?: string) {
    const qs = cursor ? `?cursor=${cursor}` : '';
    return this.request<any>(`/chats${qs}`);
  }
  async getChatById(chatId: string) { return this.request<any>(`/chats/${chatId}`); }
  async createDirectChat(targetUserId: string) {
    return this.request<any>('/chats/direct', { method: 'POST', body: JSON.stringify({ targetUserId }) });
  }
  async createGroupChat(title: string, memberUserIds: string[]) {
    return this.request<any>('/chats/group', { method: 'POST', body: JSON.stringify({ title, memberUserIds }) });
  }
  async markChatRead(chatId: string) {
    return this.request<any>(`/chats/${chatId}/read`, { method: 'POST' });
  }

  // Messages
  async getMessages(chatId: string, cursor?: string) {
    const qs = cursor ? `?cursor=${cursor}` : '';
    return this.request<any>(`/chats/${chatId}/messages${qs}`);
  }
}

export const api = new ApiService();
