"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { musicTrackService } from "@/services/music-track.service";
import type { MusicTrack, StreamingLink } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AxiosError } from "axios";
import { Plus, Trash2 } from "lucide-react";

export interface TrackFormProps {
  readonly initial?: MusicTrack | null;
  readonly onSuccess: (track: MusicTrack) => void;
  readonly onCancel?: () => void;
}

export function TrackForm({
  initial,
  onSuccess,
  onCancel,
}: TrackFormProps) {
  const t = useTranslations("musicBookmarker");
  const tCommon = useTranslations("common");
  const isEdit = initial != null;

  const [title, setTitle] = useState(initial?.title ?? "");
  const [artist, setArtist] = useState(initial?.artist ?? "");
  const [album, setAlbum] = useState(initial?.album ?? "");
  const [coverUrl, setCoverUrl] = useState(initial?.coverUrl ?? "");
  const [links, setLinks] = useState<StreamingLink[]>(
    initial?.links?.length ? [...initial.links] : [{ provider: "", url: "" }]
  );
  const [titleError, setTitleError] = useState<string | null>(null);
  const [artistError, setArtistError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initial == null) return;
    setTitle(initial.title);
    setArtist(initial.artist);
    setAlbum(initial.album ?? "");
    setCoverUrl(initial.coverUrl ?? "");
    setLinks(
      initial.links?.length
        ? [...initial.links]
        : [{ provider: "", url: "" }]
    );
  }, [initial]);

  const addLink = () => {
    setLinks((prev) => [...prev, { provider: "", url: "" }]);
  };

  const removeLink = (index: number) => {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const updateLink = (index: number, field: "provider" | "url", value: string) => {
    setLinks((prev) =>
      prev.map((l, i) => (i === index ? { ...l, [field]: value } : l))
    );
  };

  const getSubmitErrorMessage = (err: unknown): string => {
    if (err instanceof AxiosError && err.response?.data?.error) {
      return String(err.response.data.error);
    }
    return isEdit ? t("updateError") : t("createError");
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTitleError(null);
    setArtistError(null);
    setSubmitError(null);

    const trimmedTitle = title.trim();
    const trimmedArtist = artist.trim();
    if (trimmedTitle.length === 0) {
      setTitleError(t("titleLabel") + " is required.");
      return;
    }
    if (trimmedArtist.length === 0) {
      setArtistError(t("artist") + " is required.");
      return;
    }

    const validLinks = links.filter(
      (l) => l.provider.trim() !== "" && l.url.trim() !== ""
    );
    const linkErrors = validLinks.some((l) => {
      try {
        new URL(l.url);
        return false;
      } catch {
        return true;
      }
    });
    if (linkErrors) {
      setSubmitError("Each link must have a valid URL.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit && initial) {
        const updated = await musicTrackService.update(initial.id, {
          title: trimmedTitle,
          artist: trimmedArtist,
          album: album.trim() || null,
          coverUrl: coverUrl.trim() || null,
          links: validLinks,
        });
        onSuccess(updated);
        return;
      }
      const created = await musicTrackService.create({
        title: trimmedTitle,
        artist: trimmedArtist,
        album: album.trim() || null,
        coverUrl: coverUrl.trim() || null,
        links: validLinks,
      });
      onSuccess(created);
    } catch (err) {
      setSubmitError(getSubmitErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="track-title">{t("titleLabel")}</Label>
        <Input
          id="track-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("titleLabel")}
          aria-invalid={!!titleError}
        />
        {titleError && (
          <p className="text-destructive text-sm" role="alert">
            {titleError}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="track-artist">{t("artist")}</Label>
        <Input
          id="track-artist"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          placeholder={t("artist")}
          aria-invalid={!!artistError}
        />
        {artistError && (
          <p className="text-destructive text-sm" role="alert">
            {artistError}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="track-album">{t("album")} (optional)</Label>
        <Input
          id="track-album"
          value={album}
          onChange={(e) => setAlbum(e.target.value)}
          placeholder={t("album")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="track-coverUrl">{t("coverUrl")} (optional)</Label>
        <Input
          id="track-coverUrl"
          type="url"
          value={coverUrl}
          onChange={(e) => setCoverUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{t("links")}</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addLink}
            aria-label={t("addLink")}
          >
            <Plus className="me-1 size-4" />
            {t("addLink")}
          </Button>
        </div>
        {links.map((link, index) => (
          <div
            key={index}
            className="flex gap-2 items-end"
            role="group"
            aria-label={`${t("links")} row ${index + 1}`}
          >
            <Input
              placeholder={t("provider")}
              value={link.provider}
              onChange={(e) => updateLink(index, "provider", e.target.value)}
              className="flex-1 min-w-0"
            />
            <Input
              placeholder={t("url")}
              type="url"
              value={link.url}
              onChange={(e) => updateLink(index, "url", e.target.value)}
              className="flex-[2] min-w-0"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeLink(index)}
              aria-label={t("delete")}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
      {submitError && (
        <p className="text-destructive text-sm" role="alert">
          {submitError}
        </p>
      )}
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {tCommon("cancel")}
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? tCommon("saving") : tCommon("save")}
        </Button>
      </div>
    </form>
  );
}
