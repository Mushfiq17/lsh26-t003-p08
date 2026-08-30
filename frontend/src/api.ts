import axios from 'axios';

const API_BASE = 'http://localhost:8000';

export const api = {
  getStudents: async (params: {
    search?: string;
    class?: string;
    status?: string;
    optional?: string;
    page?: number;
    page_size?: number;
    sort?: string;
  }) => {
    const response = await axios.get(`${API_BASE}/students`, { params });
    return response.data;
  },

  getStudent: async (studentId: string) => {
    const response = await axios.get(`${API_BASE}/students/${studentId}`);
    return response.data;
  },

  getStudentTrace: async (studentId: string) => {
    const response = await axios.get(`${API_BASE}/students/${studentId}/trace`);
    return response.data;
  },

  getAnalytics: async () => {
    const response = await axios.get(`${API_BASE}/analytics`);
    return response.data;
  },

  getCheckingList: async (listType: 'optional' | 'practical-fail' | 'absent') => {
    const response = await axios.get(`${API_BASE}/checking-lists/${listType}`);
    return response.data;
  },

  seedDemo: async () => {
    const response = await axios.post(`${API_BASE}/seed/demo`);
    return response.data;
  },

  processBatch: async (payload: { class_name: string; students: any[]; batch_id?: string }) => {
    const response = await axios.post(`${API_BASE}/process`, payload);
    return response.data;
  },

  getBoundaryTests: async () => {
    const response = await axios.get(`${API_BASE}/tests/boundary`);
    return response.data;
  },

  getAudits: async () => {
    const response = await axios.get(`${API_BASE}/audit`);
    return response.data;
  },

  getClassInsights: async () => {
    const response = await axios.get(`${API_BASE}/ai/insights`);
    return response.data;
  },

  getStudentAdvice: async (studentId: string) => {
    const response = await axios.get(`${API_BASE}/ai/student-advice/${studentId}`);
    return response.data;
  }
};
