// QA Service für Backend-Integration

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

export interface TestCase {
  id: string;
  test_id: string;
  suite_id: string;
  title: string;
  description: string;
  status: 'success' | 'error' | 'warning' | 'pending' | 'skipped';
  note?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TestSuite {
  id: string;
  name: string;
  icon: string;
  description?: string;
  created_by: string;
  created_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  tooltip_delay: 'fest' | 'kurz' | 'lang';
  sidebar_width: number;
  entries_per_page: number;
  general_tooltips: boolean;
  updated_at: string;
}

class QAService {
  private authToken: string = '';

  setAuthToken(token: string) {
    this.authToken = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE}/api${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.authToken}`,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Test Cases
  async getTestCases(suiteId?: string): Promise<TestCase[]> {
    const query = suiteId ? `?suite_id=${suiteId}` : '';
    return this.request(`/test-cases${query}`);
  }

  async createTestCase(testCase: Omit<TestCase, 'id' | 'created_at' | 'updated_at'>): Promise<TestCase> {
    return this.request('/test-cases', {
      method: 'POST',
      body: JSON.stringify(testCase),
    });
  }

  async updateTestCase(id: string, updates: Partial<TestCase>): Promise<TestCase> {
    return this.request(`/test-cases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteTestCase(id: string): Promise<void> {
    return this.request(`/test-cases/${id}`, {
      method: 'DELETE',
    });
  }

  // Test Suites
  async getTestSuites(): Promise<TestSuite[]> {
    return this.request('/test-suites');
  }

  async createTestSuite(testSuite: Omit<TestSuite, 'id' | 'created_at'>): Promise<TestSuite> {
    return this.request('/test-suites', {
      method: 'POST',
      body: JSON.stringify(testSuite),
    });
  }

  // User Settings
  async getUserSettings(userId: string): Promise<UserSettings | null> {
    try {
      return await this.request(`/user-settings/${userId}`);
    } catch (error) {
      // Wenn keine Einstellungen gefunden, null zurückgeben
      return null;
    }
  }

  async updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<UserSettings> {
    return this.request(`/user-settings/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async createUserSettings(settings: Omit<UserSettings, 'id' | 'updated_at'>): Promise<UserSettings> {
    return this.request('/user-settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  }

  // Statistiken
  async getTestStatistics(suiteId?: string): Promise<{
    total: number;
    success: number;
    error: number;
    warning: number;
    pending: number;
    skipped: number;
  }> {
    const query = suiteId ? `?suite_id=${suiteId}` : '';
    return this.request(`/test-statistics${query}`);
  }
}

export const qaService = new QAService();
export default qaService;