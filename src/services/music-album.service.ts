import { apiClient } from "@/lib/api-client";
import { ApiUrlConstants } from "@/lib/api-url-constants";
import type { MusicAlbum } from "@/types/api";

export const musicAlbumService = {
  async list(): Promise<MusicAlbum[]> {
    const { data } = await apiClient.get<MusicAlbum[]>(ApiUrlConstants.MUSIC_ALBUMS);
    return data;
  },

  async getById(id: number): Promise<MusicAlbum> {
    const { data } = await apiClient.get<MusicAlbum>(
      ApiUrlConstants.MUSIC_ALBUM_BY_ID(id)
    );
    return data;
  },

  async create(body: {
    title: string;
    artist?: string | null;
    coverUrl?: string | null;
    releaseYear?: number | null;
    links?: { provider: string; url: string }[];
  }): Promise<MusicAlbum> {
    const { data } = await apiClient.post<MusicAlbum>(
      ApiUrlConstants.MUSIC_ALBUMS,
      body
    );
    return data;
  },

  async update(
    id: number,
    body: {
      title?: string;
      artist?: string | null;
      coverUrl?: string | null;
      releaseYear?: number | null;
      links?: { provider: string; url: string }[];
    }
  ): Promise<MusicAlbum> {
    const { data } = await apiClient.patch<MusicAlbum>(
      ApiUrlConstants.MUSIC_ALBUM_BY_ID(id),
      body
    );
    return data;
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(ApiUrlConstants.MUSIC_ALBUM_BY_ID(id));
  },
};
