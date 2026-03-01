"use client";

import { useState, useEffect, useCallback } from "react";
import { Map, MapControls, useMap } from "@/components/ui/map";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { MapPin, Loader2 } from "lucide-react";

const NOMINATIM_USER_AGENT = "aio-panel-address-picker/1.0";

async function reverseGeocode(
  lat: number,
  lon: number
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      {
        headers: { "Accept-Language": "en", "User-Agent": NOMINATIM_USER_AGENT },
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { display_name?: string };
    return data.display_name ?? null;
  } catch {
    return null;
  }
}

/** Listens for map click and runs reverse geocode, then calls onPick. */
function MapClickCapture({
  onPick,
  onGeocoding,
}: {
  onPick: (address: string, lng: number, lat: number) => void;
  onGeocoding: (loading: boolean) => void;
}) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!isLoaded || !map) return;

    const handleClick = async (e: { lngLat: { lng: number; lat: number } }) => {
      const { lng, lat } = e.lngLat;
      onGeocoding(true);
      const address = await reverseGeocode(lat, lng);
      onGeocoding(false);
      if (address) {
        onPick(address, lng, lat);
      } else {
        onPick(`${lat.toFixed(6)}, ${lng.toFixed(6)}`, lng, lat);
      }
    };

    map.on("click", handleClick);
    map.getCanvas().style.cursor = "crosshair";
    return () => {
      map.off("click", handleClick);
      map.getCanvas().style.cursor = "";
    };
  }, [map, isLoaded, onPick, onGeocoding]);

  return null;
}

export interface AddressWithMapPickerProps {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
  readonly rows?: number;
  /** Optional translation for "Pick on map" button */
  readonly pickOnMapLabel?: string;
  /** Optional translation for dialog title */
  readonly pickOnMapTitle?: string;
  /** Optional translation for "Use this address" / hint */
  readonly pickOnMapHint?: string;
}

/** [longitude, latitude] - default Cairo area */
const DEFAULT_CENTER: [number, number] = [31.2357, 30.0444];
const DEFAULT_ZOOM = 10;

export function AddressWithMapPicker({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 2,
  pickOnMapLabel = "Pick on map",
  pickOnMapTitle = "Pick location",
  pickOnMapHint = "Click on the map to set address from location.",
}: AddressWithMapPickerProps) {
  const [mapOpen, setMapOpen] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  const handlePick = useCallback(
    (address: string) => {
      onChange(address);
      setMapOpen(false);
    },
    [onChange]
  );

  const handleGeocoding = useCallback((loading: boolean) => {
    setGeocoding(loading);
  }, []);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className="min-h-0 flex-1 resize-y"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setMapOpen(true)}
          title={pickOnMapLabel}
          aria-label={pickOnMapLabel}
          className="shrink-0 self-end"
        >
          <MapPin className="size-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{pickOnMapHint}</p>

      <Dialog open={mapOpen} onOpenChange={setMapOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{pickOnMapTitle}</DialogTitle>
          </DialogHeader>
          <Card className="flex-1 min-h-[320px] overflow-hidden p-0">
            <div className="h-[320px] w-full relative">
              <Map center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM}>
                <MapClickCapture
                  onPick={(address) => handlePick(address)}
                  onGeocoding={handleGeocoding}
                />
                <MapControls showZoom showLocate position="bottom-right" />
              </Map>
              {geocoding && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                  <Loader2 className="size-8 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          </Card>
        </DialogContent>
      </Dialog>
    </div>
  );
}
