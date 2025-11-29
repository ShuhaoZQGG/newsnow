/* eslint-disable node/prefer-global/process */
import type { MaybePromise } from "@newsnow/shared/type.util";
import { Platform } from "react-native";
import { NewsNowClient } from "@newsnow/shared/client";

export function safeParseString(str: any) {
  try {
    return JSON.parse(str);
  } catch {
    return "";
  }
}

export class Timer {
  private timerId?: any;
  private start!: number;
  private remaining: number;
  private callback: () => MaybePromise<void>;

  constructor(callback: () => MaybePromise<void>, delay: number) {
    this.callback = callback;
    this.remaining = delay;
    this.resume();
  }

  pause() {
    clearTimeout(this.timerId);
    this.remaining -= Date.now() - this.start;
  }

  resume() {
    this.start = Date.now();
    clearTimeout(this.timerId);
    this.timerId = setTimeout(this.callback, this.remaining);
  }

  clear() {
    clearTimeout(this.timerId);
  }
}

// TODO: Set correct base URL for mobile
// For Android emulator, use 10.0.2.2 to access host localhost
// For iOS simulator, use localhost
const LOCAL_HOST = Platform.OS === "android" ? "10.0.2.2" : "localhost";
const API_PORT = "5173"; // Default Vite port
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || `http://${LOCAL_HOST}:${API_PORT}/api`;

export const client = new NewsNowClient(API_BASE_URL, {
  onRequest({ request, options: _options }) {
    console.log(`[Fetch] Requesting: ${_options.baseURL}${request}`);
  },
  onResponse({ response }) {
    console.log(`[Fetch] Response: ${response.status} ${response.statusText}`);
  },
  onResponseError({ request, response, options: _options }) {
    console.error(`[Fetch Error] ${request}:`, response.status, response._data);
  },
  onRequestError({ request, error }) {
    console.error(`[Fetch Network Error] ${request}:`, error);
  },
});

export function isiOS() {
  return Platform.OS === "ios";
}
