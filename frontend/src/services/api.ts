const API_BASE_URL = 'http://localhost:3000/api/v1';

// We store the guest token in localStorage
const TOKEN_KEY = 'speedcoder_guest_token';

interface UserProfile {
  id: string;
  username: string;
  is_guest: boolean;
}

let cachedUser: UserProfile | null = null;

export const api = {
  // --- Auth & User ---
  
  async getGuestToken(): Promise<string> {
    let token = localStorage.getItem(TOKEN_KEY);
    if (token) return token;

    const response = await fetch(`${API_BASE_URL}/guests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) throw new Error('Failed to create guest session');
    
    const data = await response.json();
    localStorage.setItem(TOKEN_KEY, data.guest_token);
    return data.guest_token;
  },

  // Helper for auth headers
  async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.getGuestToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  },

  async getCurrentUser(): Promise<UserProfile> {
    if (cachedUser) return cachedUser;
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/me`, { headers });
    if (!response.ok) throw new Error('Failed to get user profile');
    cachedUser = await response.json();
    return cachedUser!;
  },

  async updateProfile(username: string): Promise<UserProfile> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/me`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ user: { username } })
    });
    if (!response.ok) throw new Error('Failed to update user profile');
    cachedUser = await response.json();
    return cachedUser!;
  },

  // --- Snippets ---

  async getRandomSnippet(language?: string) {
    const url = language 
      ? `${API_BASE_URL}/snippets?language=${language}`
      : `${API_BASE_URL}/snippets`;
      
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch snippet');
    return response.json();
  },

  // --- Typing Results ---

  async saveResult(result: {
    snippet_id: string;
    raw_wpm: number;
    total_keystrokes: number;
    correct_chars: number;
    error_count: number;
    time_taken_seconds: number;
  }) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/typing_results`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ typing_result: result })
    });
    
    if (!response.ok) throw new Error('Failed to save result');
    return response.json();
  },

  // --- Leaderboard ---

  async getLeaderboard(language?: string) {
    const url = language 
      ? `${API_BASE_URL}/leaderboard?language=${language}`
      : `${API_BASE_URL}/leaderboard`;
      
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch leaderboard');
    return response.json();
  },

  // --- Multiplayer Races ---

  async createRace(difficulty?: number, language?: string) {
    const headers = await this.getAuthHeaders();
    const params = new URLSearchParams();
    if (difficulty) params.append('difficulty', difficulty.toString());
    if (language) params.append('language', language);
    
    const url = params.toString() ? `${API_BASE_URL}/races?${params.toString()}` : `${API_BASE_URL}/races`;
    const response = await fetch(url, {
      method: 'POST',
      headers
    });
    
    if (!response.ok) throw new Error('Failed to create race');
    return response.json();
  },

  async joinRace(roomCode: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/races/${roomCode}/join`, {
      method: 'POST',
      headers
    });
    
    if (!response.ok) throw new Error('Failed to join race');
    return response.json();
  }
};
