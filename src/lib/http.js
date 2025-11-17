"use client";

import axios from 'axios';

const backendBase = (process.env.NEXT_PUBLIC_BACKEND_URL ?? '').replace(/\/$/, '');
const apiBase = backendBase ? `${backendBase}/api` : '/api';

export const api = axios.create({
  baseURL: apiBase
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

