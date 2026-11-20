"use client";

export function setStorageItem<T>(key: string, value: T) {
    localStorage.setItem(key, JSON.stringify(value));
}

export function getStorageItem<T>(key: string): T | null {
    // 값이 손상됐거나 저장소 접근이 막혀 있으면 없는 것으로 본다.
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) as T : null;
    } catch {
        return null;
    }
}