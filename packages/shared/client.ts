import { ofetch } from "ofetch"
import type { FetchOptions } from "ofetch"
import type { SourceID, SourceResponse } from "./types"

export class NewsNowClient {
  private fetch: typeof ofetch

  constructor(baseURL: string, options?: FetchOptions) {
    this.fetch = ofetch.create({
      baseURL,
      retry: 0,
      timeout: 15000,
      ...options
    })
  }

  async getSource(id: SourceID, latest = false, token?: string): Promise<SourceResponse> {
    const url = latest ? `/s?id=${id}&latest` : `/s?id=${id}`
    const headers: Record<string, string> = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    
    return this.fetch<SourceResponse>(url, {
      headers
    })
  }

  async getEntire(sources: SourceID[]): Promise<SourceResponse[]> {
    return this.fetch<SourceResponse[]>("/s/entire", {
      method: "POST",
      body: {
        sources
      }
    })
  }
}

