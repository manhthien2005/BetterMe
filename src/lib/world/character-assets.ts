export type VrmLicensePermissions = {
  readonly avatarPermission: "everyone" | "onlyAuthor" | "explicitlyLicensedPerson";
  readonly commercialUsage: "corporation" | "personalProfit" | "personalNonProfit";
  readonly allowRedistribution: boolean;
  readonly modification: "allowModificationRedistribution" | "allowModification" | "prohibited";
  readonly creditNotation: "unnecessary" | "required";
};

export type CharacterAssetMetrics = {
  readonly fileSizeBytes: number;
  readonly sha256: string;
  readonly meshCount: number;
  readonly primitiveCount: number;
  readonly materialCount: number;
  readonly triangleCount: number;
  readonly humanoidBoneCount: number;
  readonly expressions: readonly string[];
};

export type CharacterAssetManifestEntry = {
  readonly id: string;
  readonly name: string;
  readonly url: string;
  readonly format: "VRM-1.0" | "VRM-0.0";
  readonly sourceName: string;
  readonly sourceRepository: string;
  readonly author: string;
  readonly copyright: string;
  readonly licenseName: string;
  readonly licenseUrl: string;
  readonly permissions: VrmLicensePermissions;
  readonly metrics: CharacterAssetMetrics;
};

export type CharacterAssetManifest = {
  readonly schemaVersion: 1;
  readonly defaultCharacterId: string;
  readonly characters: readonly CharacterAssetManifestEntry[];
};

export const CHARACTER_ASSET_MANIFEST: CharacterAssetManifest = {
  schemaVersion: 1,
  defaultCharacterId: "scholar-vrm1",
  characters: [
    {
      id: "scholar-vrm1",
      name: "Học viên Nếp (VRoid Sample Avatar)",
      url: "/models/characters/scholar-vrm1.vrm",
      format: "VRM-1.0",
      sourceName: "VRM1_Constraint_Twist_Sample",
      sourceRepository:
        "https://github.com/vrm-c/vrm-specification/tree/master/samples/VRM1_Constraint_Twist_Sample",
      author: "pixiv Inc.",
      copyright: "(c) 2022 pixiv Inc.",
      licenseName: "VRM Public License 1.0",
      licenseUrl: "https://vrm.dev/licenses/1.0/",
      permissions: {
        avatarPermission: "everyone",
        commercialUsage: "corporation",
        allowRedistribution: true,
        modification: "allowModificationRedistribution",
        creditNotation: "unnecessary"
      },
      metrics: {
        fileSizeBytes: 10_776_032,
        sha256: "12c2b97e95e700783a6a550dc0eee2d7880aeedccef9ae67bc4c5a2f0f2631a2",
        meshCount: 3,
        primitiveCount: 13,
        materialCount: 13,
        triangleCount: 36_470,
        humanoidBoneCount: 54,
        expressions: [
          "aa",
          "angry",
          "blink",
          "blinkLeft",
          "blinkRight",
          "ee",
          "happy",
          "ih",
          "lookDown",
          "lookLeft",
          "lookRight",
          "lookUp",
          "neutral",
          "oh",
          "ou",
          "relaxed",
          "sad",
          "surprised"
        ]
      }
    }
  ]
};

/** Resolves a registered character asset entry by id, falling back to the default VRM avatar. */
export function resolveCharacterAssetEntry(
  characterId: string = CHARACTER_ASSET_MANIFEST.defaultCharacterId
): CharacterAssetManifestEntry {
  return (
    CHARACTER_ASSET_MANIFEST.characters.find((entry) => entry.id === characterId) ??
    CHARACTER_ASSET_MANIFEST.characters[0]
  );
}

/**
 * Verifies that a character asset entry or embedded VRM 1.0 metadata permits
 * web distribution and avatar usage by everyone.
 */
export function validateVrmWebDistributionLicense(meta: {
  readonly avatarPermission?: string;
  readonly allowRedistribution?: boolean;
  readonly licenseUrl?: string;
}): { readonly valid: boolean; readonly reason?: string } {
  if (meta.avatarPermission && meta.avatarPermission !== "everyone") {
    return {
      valid: false,
      reason: `avatarPermission "${meta.avatarPermission}" does not allow general player avatar usage.`
    };
  }

  if (meta.allowRedistribution === false) {
    return {
      valid: false,
      reason: "VRM metadata disallows web redistribution (allowRedistribution === false)."
    };
  }

  if (!meta.licenseUrl || !meta.licenseUrl.trim()) {
    return {
      valid: false,
      reason: "VRM metadata is missing a licenseUrl."
    };
  }

  return { valid: true };
}
