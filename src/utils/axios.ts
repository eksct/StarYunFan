import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

// 创建axios实例
const service: AxiosInstance = axios.create({
    // baseURL: import.meta.env.VITE_BASE_URL || 'https://api.example.com',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json;charset=UTF-8'
    }
})

// 请求拦截器
service.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {


        // 添加token
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        
        // 添加时间戳防止缓存
        if (config.method === 'get') {
            config.params = {
                ...config.params,
                _t: Date.now()
            }
        }
        
        return config
    },
    (error) => {
        // 对请求错误做些什么
        console.error('请求错误:', error)
        return Promise.reject(error)
    }
)

// 响应拦截器
service.interceptors.response.use(
    (response: AxiosResponse) => {
        // 对响应数据做点什么
        const { data, status } = response
        
        // 统一处理响应数据
        if (status === 200) {
            return data
        } else {
            console.error('响应错误:', data)
            return Promise.reject(new Error(data.message || '请求失败'))
        }
    },
    (error) => {
        // 对响应错误做点什么
        console.error('响应错误:', error)
        
        // 处理不同的HTTP状态码
        if (error.response) {
            const { status, data } = error.response
            
            switch (status) {
                case 401:
                    // 未授权，清除token并跳转到登录页
                    localStorage.removeItem('token')
                    // router.push('/login')
                    break
                case 403:
                    console.error('没有权限访问')
                    break
                case 404:
                    console.error('请求的资源不存在')
                    break
                case 500:
                    console.error('服务器内部错误')
                    break
                default:
                    console.error(`请求失败: ${status}`)
            }
            
            return Promise.reject(new Error(data.message || `请求失败: ${status}`))
        } else if (error.request) {
            // 网络错误
            console.error('网络错误:', error.message)
            return Promise.reject(new Error('网络连接失败，请检查网络'))
        } else {
            // 其他错误
            console.error('请求配置错误:', error.message)
            return Promise.reject(error)
        }
    }
)

// 封装常用的请求方法
export const request = {
    get<T = any>(url: string, params?: any): Promise<T> {
        return service.get(url, { params })
    },
    
    post<T = any>(url: string, data?: any): Promise<T> {
        return service.post(url, data)
    },
    
    put<T = any>(url: string, data?: any): Promise<T> {
        return service.put(url, data)
    },
    
    delete<T = any>(url: string, params?: any): Promise<T> {
        return service.delete(url, { params })
    },
    
    upload<T = any>(url: string, file: File, onProgress?: (progress: number) => void): Promise<T> {
        const formData = new FormData()
        formData.append('file', file)
        
        return service.post(url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
                    onProgress(progress)
                }
            }
        })
    }
}

export default service