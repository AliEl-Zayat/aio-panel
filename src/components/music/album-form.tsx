"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { musicAlbumService } from "@/services/music-album.service";
import type { MusicAlbum, StreamingLink } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AxiosError } from "axios";
import { Plus, Trash2 } from "lucide-react";

export interface AlbumFormProps {
  readonly initial?: MusicAlbum | null;
  readonly onSuccess: (album: MusicAlbum) => void;
  readonly onCancel?: () => void;
}

export function AlbumForm({
  initial,
  onSuccess,
  onCancel,
}: AlbumFormProps) {
  const t = useTranslations("musicBookmarker");
  const tCommon = useTranslations("common");
  const isEdit = initial != null;

  const [title, setTitle] = useState(initial?.title ?? "");
  const [artist, setArtist] = useState(initial?.artist ?? "");
  const [coverUrl, setCoverUrl] = useState(initial?.coverUrl ?? "");
  const [releaseYear, setReleaseYear] = useState(
    initial?.releaseYear != null ? String(initial.releaseYear) : ""
  );
  const [links, setLinks] = useState<StreamingLink[]>(
    initial?.links?.length ? [...initial.links] : [{ provider: "", url: "" }]
  );
  const [titleError, setTitleError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initial == null) return;
    setTitle(initial.title);
    setArtist(initial.artist ?? "");
    setCoverUrl(initial.coverUrl ?? "");
    setReleaseYear(
      initial.releaseYear != null ? String(initial.releaseYear) : ""
    );
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
    setSubmitError(null);

    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0) {
      setTitleError(t("titleLabel") + " is required.");
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

    const year =
      releaseYear.trim() === ""
        ? null
        : (() => {
            const n = parseInt(releaseYear.trim(), 10);
            return Number.isInteger(n) ? n : null;
          })();

    setIsSubmitting(true);
    try {
      if (isEdit && initial) {
        const updated = await musicAlbumService.update(initial.id, {
          title: trimmedTitle,
          artist: artist.trim() || null,
          coverUrl: coverUrl.trim() || null,
          releaseYear: year,
          links: validLinks,
        });
        onSuccess(updated);
        return;
      }
      const created = await musicAlbumService.create({
        title: trimmedTitle,
        artist: artist.trim() || null,
        coverUrl: coverUrl.trim() || null,
        releaseYear: year,
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
        <Label htmlFor="album-title">{t("titleLabel")}</Label>
        <Input
          id="album-title"
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
        <Label htmlFor="album-artist">{t("artist")} (optional)</Label>
        <Input
          id="album-artist"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          placeholder={t("artist")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="album-coverUrl">{t("coverUrl")} (optional)</Label>
        <Input
          id="album-coverUrl"
          type="url"
          value={coverUrl}
          onChange={(e) => setCoverUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="album-releaseYear">{t("releaseYear")} (optional)</Label>
        <Input
          id="album-releaseYear"
          type="number"
          min={1900}
          max={2100}
          value={releaseYear}
          onChange={(e) => setReleaseYear(e.target.value)}
          placeholder="2024"
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
