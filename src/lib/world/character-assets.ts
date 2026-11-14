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
  defaultCharacterId: "academy-scholar-v1",
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
    },
    {
      id: "academy-scholar-v1",
      name: "Học viên phù thủy — đồng phục học viện",
      url: "/models/characters/academy-scholar-v1.vrm",
      format: "VRM-1.0",
      sourceName: "VRM1_Constraint_Twist_Sample + Reading Quest academy outfit",
      sourceRepository: "https://github.com/vrm-c/vrm-specification/tree/master/samples/VRM1_Constraint_Twist_Sample",
      author: "pixiv Inc. (base); BetterMe project (outfit)",
      copyright: "(c) 2022 pixiv Inc.; original outfit authored for BetterMe",
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
        fileSizeBytes: 13_757_752,
        sha256: "8c8225f3f1c934a9fc8b782f15dc70141795bd27e7bb948c3352659e4de5054f",
        meshCount: 8,
        primitiveCount: 26,
        materialCount: 32,
        triangleCount: 67_380,
        humanoidBoneCount: 54,
        expressions: [
          "aa", "angry", "blink", "blinkLeft", "blinkRight", "ee", "happy", "ih",
          "lookDown", "lookLeft", "lookRight", "lookUp", "neutral", "oh", "ou",
          "relaxed", "sad", "surprised"
        ]
      }
    },
    // Academy NPC fittings: generated metrics; source and permission match the player base.
    {
      id: "academy-an-v1",
      name: "Học giả An — áo choàng dẫn đường",
      url: "/models/characters/academy-an-v1.vrm",
      format: "VRM-1.0",
      sourceName: "VRM1_Constraint_Twist_Sample + Reading Quest academy outfit",
      sourceRepository: "https://github.com/vrm-c/vrm-specification/tree/master/samples/VRM1_Constraint_Twist_Sample",
      author: "pixiv Inc. (base); BetterMe project (outfit and hair fitting)",
      copyright: "(c) 2022 pixiv Inc.; original outfit authored for BetterMe",
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
        fileSizeBytes: 12984340,
        sha256: "0b02133a385983dc88fbc2d618a0b558f514f981b3980e7f53a76d7d7fb6210d",
        meshCount: 10,
        primitiveCount: 28,
        materialCount: 25,
        triangleCount: 63612,
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
    },
    {
      id: "academy-khoa-v1",
      name: "Quản sự Khoa — áo choàng học viện",
      url: "/models/characters/academy-khoa-v1.vrm",
      format: "VRM-1.0",
      sourceName: "VRM1_Constraint_Twist_Sample + Reading Quest academy outfit",
      sourceRepository: "https://github.com/vrm-c/vrm-specification/tree/master/samples/VRM1_Constraint_Twist_Sample",
      author: "pixiv Inc. (base); BetterMe project (Khoa face, hair, glasses and menswear)",
      copyright: "(c) 2022 pixiv Inc.; original outfit authored for BetterMe",
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
        fileSizeBytes: 17762116,
        sha256: "ce7e1f46ced9613082cc4f1cd24c1e9f87618062fb14de35b7dc94e3f1b9c483",
        meshCount: 8,
        primitiveCount: 26,
        materialCount: 32,
        triangleCount: 75936,
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
    },
    {
      id: "academy-minh-v1",
      name: "Thủ thư Minh — áo học giả",
      url: "/models/characters/academy-minh-v1.vrm",
      format: "VRM-1.0",
      sourceName: "VRM1_Constraint_Twist_Sample + Reading Quest academy outfit",
      sourceRepository: "https://github.com/vrm-c/vrm-specification/tree/master/samples/VRM1_Constraint_Twist_Sample",
      author: "pixiv Inc. (base); BetterMe project (outfit and hair fitting)",
      copyright: "(c) 2022 pixiv Inc.; original outfit authored for BetterMe",
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
        fileSizeBytes: 12754468,
        sha256: "346976316274c1f48be2383864b77f9157e259cacaaa47486f631c97246c8ee0",
        meshCount: 9,
        primitiveCount: 25,
        materialCount: 25,
        triangleCount: 57636,
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
    // End academy NPC fittings.
  ]
};

/** Resolves a registered character asset entry by id, falling back to the default VRM avatar. */
export function resolveCharacterAssetEntry(
  characterId: string = CHARACTER_ASSET_MANIFEST.defaultCharacterId
): CharacterAssetManifestEntry {
  return (
    CHARACTER_ASSET_MANIFEST.characters.find((entry) => entry.id === characterId) ??
    CHARACTER_ASSET_MANIFEST.characters.find((entry) => entry.id === CHARACTER_ASSET_MANIFEST.defaultCharacterId) ??
    CHARACTER_ASSET_MANIFEST.characters[0]
  );
}

/** Individually fitted academy cast; unknown slots retain the original sample fallback. */
export const NPC_CHARACTER_ASSET_IDS: Readonly<Record<string, string>> = {
  "character.npc.guide_an": "academy-an-v1",
  "character.npc.steward_khoa": "academy-khoa-v1",
  "character.npc.librarian_minh": "academy-minh-v1"
};

export function resolveNpcCharacterAsset(slot: string): CharacterAssetManifestEntry {
  return resolveCharacterAssetEntry(NPC_CHARACTER_ASSET_IDS[slot] ?? "scholar-vrm1");
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
