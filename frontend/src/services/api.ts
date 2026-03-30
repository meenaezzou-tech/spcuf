import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse, User, Case, TimelineEvent, Document, Contact, Deadline, Resource, LegalTopic, AIChatResponse } from '../types';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: async (email: string, password: string, full_name: string, phone?: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', {
      email,
      password,
      full_name,
      phone,
    });
    return response.data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },
};

// Case API
export const caseAPI = {
  createCase: async (caseData: any): Promise<Case> => {
    const response = await api.post<Case>('/cases', caseData);
    return response.data;
  },

  getCases: async (): Promise<Case[]> => {
    const response = await api.get<Case[]>('/cases');
    return response.data;
  },

  getCase: async (caseId: string): Promise<Case> => {
    const response = await api.get<Case>(`/cases/${caseId}`);
    return response.data;
  },

  updateCase: async (caseId: string, caseData: any): Promise<Case> => {
    const response = await api.put<Case>(`/cases/${caseId}`, caseData);
    return response.data;
  },

  deleteCase: async (caseId: string): Promise<void> => {
    await api.delete(`/cases/${caseId}`);
  },

  getTimeline: async (caseId: string): Promise<TimelineEvent[]> => {
    const response = await api.get<TimelineEvent[]>(`/cases/${caseId}/timeline`);
    return response.data;
  },

  addTimelineEvent: async (caseId: string, eventData: any): Promise<TimelineEvent> => {
    const response = await api.post<TimelineEvent>(`/cases/${caseId}/timeline`, eventData);
    return response.data;
  },
};

// Document API
export const documentAPI = {
  uploadDocument: async (docData: any): Promise<Document> => {
    const response = await api.post<Document>('/documents', docData);
    return response.data;
  },

  getDocuments: async (caseId: string): Promise<Document[]> => {
    const response = await api.get<Document[]>(`/documents/${caseId}`);
    return response.data;
  },

  getDocumentData: async (caseId: string, documentId: string): Promise<any> => {
    const response = await api.get(`/documents/${caseId}/${documentId}`);
    return response.data;
  },
};

// Contact API
export const contactAPI = {
  createContact: async (contactData: any): Promise<Contact> => {
    const response = await api.post<Contact>('/contacts', contactData);
    return response.data;
  },

  getContacts: async (caseId: string): Promise<Contact[]> => {
    const response = await api.get<Contact[]>(`/contacts/${caseId}`);
    return response.data;
  },
};

// Deadline API
export const deadlineAPI = {
  calculateDeadlines: async (removalDate: string, caseId: string): Promise<any> => {
    const response = await api.post('/deadlines/calculate', null, {
      params: { removal_date: removalDate, case_id: caseId },
    });
    return response.data;
  },

  getDeadlines: async (caseId: string): Promise<Deadline[]> => {
    const response = await api.get<Deadline[]>(`/deadlines/${caseId}`);
    return response.data;
  },

  updateDeadline: async (deadlineId: string, completed: boolean): Promise<void> => {
    await api.put(`/deadlines/${deadlineId}`, null, {
      params: { completed },
    });
  },
};

// AI API
export const aiAPI = {
  chat: async (message: string, caseId?: string, mode: string = 'ask_spcuf'): Promise<AIChatResponse> => {
    const response = await api.post<AIChatResponse>('/ai/chat', {
      message,
      case_id: caseId,
      conversation_mode: mode,
    });
    return response.data;
  },
};

// Resource API
export const resourceAPI = {
  getResources: async (): Promise<Resource[]> => {
    const response = await api.get<Resource[]>('/resources');
    return response.data;
  },

  getResourcesByCategory: async (category: string): Promise<Resource[]> => {
    const response = await api.get<Resource[]>(`/resources/${category}`);
    return response.data;
  },
};

// Legal Library API
export const legalLibraryAPI = {
  getTopics: async (): Promise<LegalTopic[]> => {
    const response = await api.get<LegalTopic[]>('/legal-library');
    return response.data;
  },

  getTopic: async (topicId: string): Promise<LegalTopic> => {
    const response = await api.get<LegalTopic>(`/legal-library/${topicId}`);
    return response.data;
  },
};

// Seed API (dev only)
export const seedAPI = {
  seedData: async (): Promise<any> => {
    const response = await api.post('/seed-data');
    return response.data;
  },
};

export default api;
