import { getTranslations } from "next-intl/server";
import { MusicClient } from "@/components/music/music-client";

export default async function MusicPage() {
  const t = await getTranslations("musicBookmarker");
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium">{t("title")}</h2>
      <MusicClient />
    </div>
  );
}
