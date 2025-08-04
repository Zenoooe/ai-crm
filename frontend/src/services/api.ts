/**
 * API服务文件
 * 提供统一的HTTP请求接口
 */
import axios, { AxiosInstance, AxiosResponse } from 'axios';

// 创建axios实例
const apiClient: AxiosInstance = axios.create({
  baseURL: 'http://localhost:8001/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token过期，清除本地存储并跳转到登录页
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API服务类
export class ApiService {
  /**
   * GET请求
   */
  static async get<T = any>(url: string, config?: any): Promise<AxiosResponse<T>> {
    return apiClient.get(url, config);
  }

  /**
   * POST请求
   */
  static async post<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return apiClient.post(url, data, config);
  }

  /**
   * PUT请求
   */
  static async put<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return apiClient.put(url, data, config);
  }

  /**
   * DELETE请求
   */
  static async delete<T = any>(url: string, config?: any): Promise<AxiosResponse<T>> {
    return apiClient.delete(url, config);
  }

  /**
   * PATCH请求
   */
  static async patch<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return apiClient.patch(url, data, config);
  }
}

// 导出实例和服务类
export const apiService = ApiService;
export { apiClient };
export default apiService;