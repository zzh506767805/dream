// 安全的本地存储工具函数
// 处理localStorage在某些环境下不可用的情况

/**
 * 安全地获取localStorage中的字符串值
 * @param key 存储键
 * @param defaultValue 默认值
 * @returns 存储的值或默认值
 */
export function safeGetItem(key: string, defaultValue: string = ''): string {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  
  try {
    const item = localStorage.getItem(key);
    return item !== null ? item : defaultValue;
  } catch (error) {
    console.warn(`Failed to get item from localStorage: ${key}`, error);
    return defaultValue;
  }
}

/**
 * 安全地设置localStorage中的字符串值
 * @param key 存储键
 * @param value 要存储的值
 * @returns 是否成功存储
 */
export function safeSetItem(key: string, value: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`Failed to set item in localStorage: ${key}`, error);
    return false;
  }
}

/**
 * 安全地从localStorage中删除项目
 * @param key 存储键
 * @returns 是否成功删除
 */
export function safeRemoveItem(key: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Failed to remove item from localStorage: ${key}`, error);
    return false;
  }
}

/**
 * 安全地获取localStorage中的JSON对象
 * @param key 存储键
 * @param defaultValue 默认值
 * @returns 解析后的对象或默认值
 */
export function safeGetJSONItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.warn(`Failed to get JSON item from localStorage: ${key}`, error);
    return defaultValue;
  }
}

/**
 * 安全地设置localStorage中的JSON对象
 * @param key 存储键
 * @param value 要存储的对象
 * @returns 是否成功存储
 */
export function safeSetJSONItem<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    const jsonString = JSON.stringify(value);
    localStorage.setItem(key, jsonString);
    return true;
  } catch (error) {
    console.warn(`Failed to set JSON item in localStorage: ${key}`, error);
    return false;
  }
}

/**
 * 检查localStorage是否可用
 * @returns 是否可用
 */
export function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    const testKey = '__ls_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 获取localStorage的使用情况
 * @returns 使用情况信息
 */
export function getStorageUsage(): {
  used: number;
  total: number;
  percentage: number;
} {
  if (!isLocalStorageAvailable()) {
    return { used: 0, total: 0, percentage: 0 };
  }
  
  let used = 0;
  const total = 5 * 1024 * 1024; // 5MB 大多数浏览器的默认限制
  
  try {
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage.getItem(key)?.length || 0;
      }
    }
  } catch (error) {
    console.warn('Failed to calculate localStorage usage', error);
  }
  
  return {
    used,
    total,
    percentage: total > 0 ? (used / total) * 100 : 0
  };
}

/**
 * 清除所有localStorage数据
 * @param confirm 是否确认清除
 * @returns 是否成功清除
 */
export function clearAllStorage(confirm: boolean = false): boolean {
  if (!confirm) {
    console.warn('Please set confirm=true to clear all localStorage');
    return false;
  }
  
  if (!isLocalStorageAvailable()) {
    return false;
  }
  
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.warn('Failed to clear localStorage', error);
    return false;
  }
}

/**
 * 获取所有localStorage键
 * @returns 所有键的数组
 */
export function getAllKeys(): string[] {
  if (!isLocalStorageAvailable()) {
    return [];
  }
  
  const keys: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        keys.push(key);
      }
    }
  } catch (error) {
    console.warn('Failed to get all localStorage keys', error);
  }
  
  return keys;
}

/**
 * 检查指定键是否存在
 * @param key 存储键
 * @returns 是否存在
 */
export function hasKey(key: string): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }
  
  try {
    return localStorage.getItem(key) !== null;
  } catch (error) {
    console.warn(`Failed to check key existence: ${key}`, error);
    return false;
  }
}

/**
 * 批量设置多个键值对
 * @param items 键值对对象
 * @returns 成功设置的键数量
 */
export function setBatch(items: Record<string, any>): number {
  if (!isLocalStorageAvailable()) {
    return 0;
  }
  
  let successCount = 0;
  for (const [key, value] of Object.entries(items)) {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, stringValue);
      successCount++;
    } catch (error) {
      console.warn(`Failed to set batch item: ${key}`, error);
    }
  }
  
  return successCount;
}

/**
 * 批量获取多个键的值
 * @param keys 键数组
 * @returns 键值对对象
 */
export function getBatch(keys: string[]): Record<string, string | null> {
  if (!isLocalStorageAvailable()) {
    return {};
  }
  
  const result: Record<string, string | null> = {};
  for (const key of keys) {
    try {
      result[key] = localStorage.getItem(key);
    } catch (error) {
      console.warn(`Failed to get batch item: ${key}`, error);
      result[key] = null;
    }
  }
  
  return result;
} 