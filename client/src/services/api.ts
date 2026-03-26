const API_BASE = '/api/v1';

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const url = `${API_BASE}${path}`;
    console.log(`[API] ${options.method || 'GET'} ${url}`);

    const res = await fetch(url, { ...options, headers });

    if (res.status === 401) {
      const refreshed = await this.refreshToken();
      if (refreshed) return this.request<T>(path, options);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    if (!res.ok) {
      const errBody = await res.text().catch(() => 'No error body');
      console.error('BACKEND ERROR:', res.status, errBody);
      try {
        const errJson = JSON.parse(errBody);
        throw new Error(errJson.message || `HTTP ${res.status}`);
      } catch {
        throw new Error(errBody || `HTTP ${res.status}`);
      }
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

  // Status/Stories
  async createTextStatus(textContent: string, bgColor: string) {
    return this.request<any>('/status/text', { method: 'POST', body: JSON.stringify({ textContent, bgColor }) });
  }
  async createImageStatus(imageUrl: string, caption?: string) {
    return this.request<any>('/status/image', { method: 'POST', body: JSON.stringify({ imageUrl, caption }) });
  }
  async getMyStatuses() { return this.request<any>('/status/mine'); }
  async getContactStatuses() { return this.request<any>('/status/contacts'); }
  async markStatusViewed(statusId: string) { return this.request<any>(`/status/${statusId}/view`, { method: 'POST' }); }
  async deleteStatus(statusId: string) { return this.request<any>(`/status/${statusId}`, { method: 'DELETE' }); }

  // Block
  async blockUser(userId: string) { return this.request<any>(`/users/block/${userId}`, { method: 'POST' }); }
  async unblockUser(userId: string) { return this.request<any>(`/users/block/${userId}`, { method: 'DELETE' }); }
  async getUser(userId: string) { return this.request<any>(`/users/${userId}`); }
  
  // Link Preview
  async getLinkPreview(chatId: string, url: string) { 
    return this.request<any>(`/chats/${chatId}/messages/link-preview?url=${encodeURIComponent(url)}`); 
  }
  async getCallHistory(cursor?: string) {
    const qs = cursor ? `?cursor=${cursor}` : '';
    return this.request<any>(`/calls${qs}`);
  }
  async updateProfile(data: any) { return this.request<any>('/users/me', { method: 'PATCH', body: JSON.stringify(data) }); }
  async uploadAvatar(file: File) {
    const token = this.getToken();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'IMAGE');
    const res = await fetch(`${API_BASE}/media/upload`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    });
    
    if (!res.ok) {
        const errText = await res.text();
        console.error('BACKEND ERROR PAYLOAD:', errText);
        throw new Error('Upload failed: ' + errText);
    }
    const data = await res.json();
    // The backend stores the file locally. Build the accessible URL.
    // data.url may be a signed S3 url or undefined if using local storage.
    // For local, the file is served at /uploads/<filename> via static assets.
    const avatarUrl = data.url || `/uploads/${data.attachmentId}`;
    await this.updateProfile({ avatarUrl });
    return data;
  }
  
  async uploadMedia(file: File, type: 'IMAGE' | 'VIDEO' | 'FILE' | 'AUDIO' = 'IMAGE') {
    const token = this.getToken();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    const res = await fetch(`${API_BASE}/media/upload`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
        const errText = await res.text();
        console.error('BACKEND ERROR PAYLOAD:', errText);
        throw new Error('Upload failed: ' + errText);
    }
    return await res.json();
  }

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

  async deleteMessage(chatId: string, messageId: string, forEveryone: boolean) {
    return this.request<any>(`/chats/${chatId}/messages/${messageId}?forEveryone=${forEveryone}`, {
      method: 'DELETE',
    });
  }

  async deleteGroup(chatId: string) {
    return this.request<any>(`/chats/${chatId}`, {
      method: 'DELETE',
    });
  }

  async updateDisappearingTimer(chatId: string, timer: number | null) {
    return this.request<any>(`/chats/${chatId}/disappearing-messages`, {
      method: 'PATCH',
      body: JSON.stringify({ timer }),
    });
  }

  async starMessage(chatId: string, messageId: string) {
    return this.request<any>(`/chats/${chatId}/messages/${messageId}/star`, {
      method: 'POST',
    });
  }

  async unstarMessage(chatId: string, messageId: string) {
    return this.request<any>(`/chats/${chatId}/messages/${messageId}/star`, {
      method: 'DELETE',
    });
  }

  async getStarredMessages() {
    return this.request<any>(`/chats/dummy/messages/starred`);
  }

  // Group Management
  async addGroupMembers(chatId: string, userIds: string[]) {
    return this.request<any>(`/chats/${chatId}/members`, {
      method: 'POST',
      body: JSON.stringify({ userIds }),
    });
  }

  async removeGroupMember(chatId: string, userId: string) {
    return this.request<any>(`/chats/${chatId}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  async updateMemberRole(chatId: string, userId: string, role: string) {
    return this.request<any>(`/chats/${chatId}/members/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  async updateGroupInfo(chatId: string, data: { title?: string; avatarUrl?: string }) {
    return this.request<any>(`/chats/${chatId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async togglePin(chatId: string, isPinned: boolean) {
    return this.request<any>(`/chats/${chatId}/pin`, {
      method: 'PATCH',
      body: JSON.stringify({ isPinned }),
    });
  }

  async updateMute(chatId: string, isMuted: boolean, mutedUntil?: string | null) {
    return this.request<any>(`/chats/${chatId}/mute`, {
      method: 'PATCH',
      body: JSON.stringify({ isMuted, mutedUntil }),
    });
  }

  async updateWallpaper(chatId: string, wallpaperUrl: string | null) {
    return this.request<any>(`/chats/${chatId}/wallpaper`, {
      method: 'PATCH',
      body: JSON.stringify({ wallpaperUrl }),
    });
  }
}

export const api = new ApiService();
