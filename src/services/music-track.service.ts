import { apiClient } from "@/lib/api-client";
import { ApiUrlConstants } from "@/lib/api-url-constants";
import type { MusicTrack } from "@/types/api";

export const musicTrackService = {
  async list(): Promise<MusicTrack[]> {
    const { data } = await apiClient.get<MusicTrack[]>(ApiUrlConstants.MUSIC_TRACKS);
    return data;
  },

  async getById(id: number): Promise<MusicTrack> {
    const { data } = await apiClient.get<MusicTrack>(
      ApiUrlConstants.MUSIC_TRACK_BY_ID(id)
    );
    return data;
  },

  async create(body: {
    title: string;
    artist: string;
    album?: string | null;
    coverUrl?: string | null;
    links?: { provider: string; url: string }[];
  }): Promise<MusicTrack> {
    const { data } = await apiClient.post<MusicTrack>(
      ApiUrlConstants.MUSIC_TRACKS,
      body
    );
    return data;
  },

  async update(
    id: number,
    body: {
      title?: string;
      artist?: string;
      album?: string | null;
      coverUrl?: string | null;
      links?: { provider: string; url: string }[];
    }
  ): Promise<MusicTrack> {
    const { data } = await apiClient.patch<MusicTrack>(
      ApiUrlConstants.MUSIC_TRACK_BY_ID(id),
      body
    );
    return data;
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(ApiUrlConstants.MUSIC_TRACK_BY_ID(id));
  },
};
