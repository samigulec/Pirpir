"use client";

import { RegionSettings } from "./HeaderControls";
import { ProfileMenu } from "./ProfileMenu";

/** Her sayfanın başlığında sağ taraf: ülke · dil · para birimi ve profil menüsü. */
export function HeaderActions({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <RegionSettings compact={compact} />
      <ProfileMenu />
    </div>
  );
}
