"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { musicTrackService } from "@/services/music-track.service";
import { musicAlbumService } from "@/services/music-album.service";
import type { MusicTrack, MusicAlbum } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SegmentControl } from "@/components/ui/segment-control";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TrackForm } from "./track-form";
import { AlbumForm } from "./album-form";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";

const MUSIC_TRACKS_QUERY_KEY = ["music-tracks"] as const;
const MUSIC_ALBUMS_QUERY_KEY = ["music-albums"] as const;

type Tab = "tracks" | "albums";

export function MusicClient() {
  const t = useTranslations("musicBookmarker");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("tracks");
  const [createTrackOpen, setCreateTrackOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<MusicTrack | null>(null);
  const [deleteTrack, setDeleteTrack] = useState<MusicTrack | null>(null);
  const [isDeletingTrack, setIsDeletingTrack] = useState(false);
  const [createAlbumOpen, setCreateAlbumOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<MusicAlbum | null>(null);
  const [deleteAlbum, setDeleteAlbum] = useState<MusicAlbum | null>(null);
  const [isDeletingAlbum, setIsDeletingAlbum] = useState(false);

  const { data: tracks = [], isLoading: tracksLoading, error: tracksError } = useQuery({
    queryKey: MUSIC_TRACKS_QUERY_KEY,
    queryFn: () => musicTrackService.list(),
  });

  const { data: albums = [], isLoading: albumsLoading, error: albumsError } = useQuery({
    queryKey: MUSIC_ALBUMS_QUERY_KEY,
    queryFn: () => musicAlbumService.list(),
  });

  const handleTrackCreateSuccess = (track: MusicTrack) => {
    queryClient.invalidateQueries({ queryKey: MUSIC_TRACKS_QUERY_KEY });
    setCreateTrackOpen(false);
  };

  const handleTrackEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: MUSIC_TRACKS_QUERY_KEY });
    setEditingTrack(null);
  };

  const handleDeleteTrack = async () => {
    if (!deleteTrack) return;
    setIsDeletingTrack(true);
    try {
      await musicTrackService.remove(deleteTrack.id);
      queryClient.invalidateQueries({ queryKey: MUSIC_TRACKS_QUERY_KEY });
      setDeleteTrack(null);
    } finally {
      setIsDeletingTrack(false);
    }
  };

  const handleAlbumCreateSuccess = (album: MusicAlbum) => {
    queryClient.invalidateQueries({ queryKey: MUSIC_ALBUMS_QUERY_KEY });
    setCreateAlbumOpen(false);
  };

  const handleAlbumEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: MUSIC_ALBUMS_QUERY_KEY });
    setEditingAlbum(null);
  };

  const handleDeleteAlbum = async () => {
    if (!deleteAlbum) return;
    setIsDeletingAlbum(true);
    try {
      await musicAlbumService.remove(deleteAlbum.id);
      queryClient.invalidateQueries({ queryKey: MUSIC_ALBUMS_QUERY_KEY });
      setDeleteAlbum(null);
    } finally {
      setIsDeletingAlbum(false);
    }
  };

  return (
    <div className="space-y-4">
      <SegmentControl<Tab>
        value={tab}
        onValueChange={setTab}
        options={[
          { value: "tracks", label: t("tracks") },
          { value: "albums", label: t("albums") },
        ]}
        aria-label={t("title")}
      />

      {tab === "tracks" && (
        <>
          <div className="flex justify-end">
            <Button onClick={() => setCreateTrackOpen(true)}>
              <Plus className="me-2 size-4" />
              {t("addTrack")}
            </Button>
          </div>
          {tracksError && (
            <p className="text-destructive text-sm" role="alert">
              {t("loadError")} {tCommon("retry")}
            </p>
          )}
          {tracksLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : tracks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">{t("emptyTracks")}</p>
                <Button className="mt-4" onClick={() => setCreateTrackOpen(true)}>
                  {t("addTrack")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tracks.map((track) => (
                <Card key={track.id}>
                  <CardContent className="pt-4">
                    <div className="flex gap-3">
                      {track.coverUrl && (
                        <img
                          src={track.coverUrl}
                          alt=""
                          className="h-16 w-16 shrink-0 rounded object-cover"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{track.title}</p>
                        <p className="text-muted-foreground text-sm truncate">
                          {track.artist}
                          {track.album ? ` · ${track.album}` : ""}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {track.links?.map((link, i) => (
                            <a
                              key={i}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs text-primary hover:underline"
                              aria-label={`${t("openInNewTab")}: ${link.provider}`}
                            >
                              {link.provider}
                              <ExternalLink className="size-3" />
                            </a>
                          ))}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingTrack(track)}
                          aria-label={t("edit")}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTrack(track)}
                          aria-label={t("delete")}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "albums" && (
        <>
          <div className="flex justify-end">
            <Button onClick={() => setCreateAlbumOpen(true)}>
              <Plus className="me-2 size-4" />
              {t("addAlbum")}
            </Button>
          </div>
          {albumsError && (
            <p className="text-destructive text-sm" role="alert">
              {t("loadError")} {tCommon("retry")}
            </p>
          )}
          {albumsLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : albums.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">{t("emptyAlbums")}</p>
                <Button className="mt-4" onClick={() => setCreateAlbumOpen(true)}>
                  {t("addAlbum")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {albums.map((album) => (
                <Card key={album.id}>
                  <CardContent className="pt-4">
                    <div className="flex gap-3">
                      {album.coverUrl && (
                        <img
                          src={album.coverUrl}
                          alt=""
                          className="h-16 w-16 shrink-0 rounded object-cover"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{album.title}</p>
                        <p className="text-muted-foreground text-sm truncate">
                          {album.artist ?? ""}
                          {album.releaseYear ? ` · ${album.releaseYear}` : ""}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {album.links?.map((link, i) => (
                            <a
                              key={i}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs text-primary hover:underline"
                              aria-label={`${t("openInNewTab")}: ${link.provider}`}
                            >
                              {link.provider}
                              <ExternalLink className="size-3" />
                            </a>
                          ))}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingAlbum(album)}
                          aria-label={t("edit")}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteAlbum(album)}
                          aria-label={t("delete")}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <Dialog open={createTrackOpen} onOpenChange={setCreateTrackOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("createTrack")}</DialogTitle>
          </DialogHeader>
          <TrackForm
            onSuccess={handleTrackCreateSuccess}
            onCancel={() => setCreateTrackOpen(false)}
          />
        </DialogContent>
      </Dialog>
      <Dialog open={editingTrack != null} onOpenChange={(open) => !open && setEditingTrack(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editTrack")}</DialogTitle>
          </DialogHeader>
          {editingTrack && (
            <TrackForm
              initial={editingTrack}
              onSuccess={handleTrackEditSuccess}
              onCancel={() => setEditingTrack(null)}
            />
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteTrack != null} onOpenChange={(open) => !open && setDeleteTrack(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete")}</AlertDialogTitle>
            <AlertDialogDescription>
              Delete &quot;{deleteTrack?.title}&quot;? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTrack}
              disabled={isDeletingTrack}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingTrack ? tCommon("deleting") : t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={createAlbumOpen} onOpenChange={setCreateAlbumOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("createAlbum")}</DialogTitle>
          </DialogHeader>
          <AlbumForm
            onSuccess={handleAlbumCreateSuccess}
            onCancel={() => setCreateAlbumOpen(false)}
          />
        </DialogContent>
      </Dialog>
      <Dialog open={editingAlbum != null} onOpenChange={(open) => !open && setEditingAlbum(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editAlbum")}</DialogTitle>
          </DialogHeader>
          {editingAlbum && (
            <AlbumForm
              initial={editingAlbum}
              onSuccess={handleAlbumEditSuccess}
              onCancel={() => setEditingAlbum(null)}
            />
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteAlbum != null} onOpenChange={(open) => !open && setDeleteAlbum(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete")}</AlertDialogTitle>
            <AlertDialogDescription>
              Delete &quot;{deleteAlbum?.title}&quot;? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAlbum}
              disabled={isDeletingAlbum}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingAlbum ? tCommon("deleting") : t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
