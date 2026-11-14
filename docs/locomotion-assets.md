# Character animation provenance

Owner approved suitable free clips on 2026-11-10. These animations change the
player's motion, not its pixiv VRM appearance or the NPC gestures.

## Selected asset and rights

- Author: **Quaternius**, [Universal Animation Library](https://quaternius.com/packs/universalanimationlibrary.html).
- Version: **Standard FREE archive distributed 2025-06-10**, mirrored by J-Ponzo.
  This is a third-party preservation mirror, not an official Quaternius repository.
- Pinned [revision e24c23cf2a1323488a3faa226ea7ea21f644b73e](https://github.com/J-Ponzo/gltf-universal-animation-library/tree/e24c23cf2a1323488a3faa226ea7ea21f644b73e).
  Its README identifies the archive date, creator and CC0 license; its LICENSE is
  CC0 1.0 Universal. The author's specific pack page also identifies CC0.
- License text retained verbatim at `public/models/animations/LICENSE-CC0.txt`.
  License SHA-256: `a2010f343487d3f7618affe54f789f5487602331c0a8d03f49e9a7c547cf0499`.
- The author's current generic license page describes QAL; **that is not the
  basis for this historical CC0 import**. No PRO/SOURCE/current QAL files imported.
- Selected clips: **Walk_Loop** → walk, **Jog_Fwd_Loop** → run. KayKit CC0 was
  previewed and rejected: short-leg/weapon-oriented poses did not fit this avatar.
  Mixamo assets were not imported; its official VRM retarget example was studied.

## Reproduction

Download these two files from the pinned mirror's `glTF/` directory to a local
working directory, then run from the repository root:

```powershell
node scripts/convert-locomotion.mjs output/research/character-locomotion
```

| Input | SHA-256 |
| --- | --- |
| AnimationLibrary_Godot_Standard.gltf | `0ff075c7ad6855c5c2c37a171592ee8f0d6ab2f58259e2be77a9b63dd8027765` |
| AnimationLibrary_Godot_Standard.bin | `6e65377d81558333c4093dbb144a48fd19019343d82b1a3a7992a98ec0e0543c` |

The converter refuses different inputs. It samples only the selected clips at
60 Hz into `public/models/animations/locomotion.json` (104,161 bytes). No meshes,
textures, weapons, combat clips, source skeleton or other model is shipped.

The conversion follows the rest-space rotation rule in
[three-vrm 3.5.5's official retarget example](https://github.com/pixiv/three-vrm/blob/v3.5.5/packages/three-vrm/examples/humanoidAnimation/loadMixamoAnimation.js):
`parentRestWorld * localTrackRotation * inverse(boneRestWorld)`.
The source has mapped, adjacent humanoid chains, +Z forward and meter units after
its glTF root transform. Translation is reduced to vertical hips displacement;
the runtime scales it by target/source rest hips height. Horizontal root motion
cannot drive the game controller.

Runtime uses quaternion interpolation, a shared walk/run phase and speed/stride
cadence. Each actor owns playback state and blend buffers. A single adapter writes
normalized VRM bones before VRM update. The accepted procedural idle/interact
remain, with a procedural locomotion fallback on missing or invalid clip data.
Loading clips does not delay model loading; requests time out after 5 seconds.

Contact correction only pins the flat mid-stance interval (not heel/toe roll),
is capped at 8 cm and fades on release. Swing trajectory and foot world rotation
remain authored. This calibration is for the shipped VRM and flat plaza floor;
another avatar or terrain needs renewed contact and visual checks.

## Visual evidence

Local ignored evidence in `output/research/character-locomotion/`:
`ual-source.webm`, `compare-source-vrm.webm`, `compare-side.png`,
`compare-front.png`, `compare-stop.png`, and `target-gameplay.webm`.
The comparison uses the real runtime adapter and the source model in separate
views; clips may be at different phases. No claim of owner visual acceptance.

## Hands / jump supplement — 2026-11-10

After accepting walk/run/idle, the owner requested more natural hands and a less
rigid jump. The same pinned CC0 archive supplies **Idle_Loop** finger coordination
and **Jump_Start / Jump_Loop / Jump_Land**. No new asset source or license.
The converter now also writes `actions.json` (546,665 bytes), sampled at 60 Hz,
including the endpoint of each clamped one-shot. SHA-256:
`47be920dffc4350e75f7b77a47c85c5684fa53f1990a7990386cb27d20196f80`.
The accepted `locomotion.json` remains byte-identical:
`4011f90a8b5fcc237a0d7e4d16458c03fbce383010be73ea18b364bcf7f17ef2`.

The relaxed hand retains the source's coordinated finger rotations at reduced
curl; run uses a looser fist, greeting keeps the open right hand. Only player
actors load this supplement, leaving NPC gestures and Minh's book pose intact.
Jump_Start skips its first 12% (grounded wind-up), then follows actual upward
velocity. Descent blends the air pose toward the first landing frame. Physics
alone moves the root; authored vertical hip motion applies only on landing.
Floor correction is disabled throughout flight, including a fading run clip.

Ground contact starts a 0.34s stationary / 0.24s moving recovery (revised in the
education refinement below; previously 0.48s / 0.28s). Its duration is
fixed at contact so releasing a movement key cannot rewind the crouch. A new
jump cancels it. The supplement times out after five seconds or falls back to
existing poses when missing/malformed; it never blocks loading the avatar.

Local evidence: `output/research/hands-jump/`, including front/side phase captures,
hand close-ups, gameplay, reduced-motion and missing-supplement checks. The lab
source shows the corresponding original clip frame, while runtime descent also
blends toward ground contact; this is not an equal-timing source playback.
Owner visual acceptance of hands/jump is still pending.

## Education movement refinement — 2026-11-10

Owner approved a calmer hop for the education-focused academy. The source clips,
license and both JSON hashes above are unchanged. Runtime blends jump body bones
toward the source landing clip's settled last frame, never the avatar's T-pose:
upper arms/shoulders retain 40% source influence, forearms/hands 65%, legs 50%,
feet/toes 70%, and torso/head 45%. Finger coordination is unchanged. Landing hip
displacement retains 28% of its difference from the settled source position.
This reduces arm spread, knee tuck and landing depth while retaining articulation.

The configured jump impulse is now 4.8 m/s (previously 7.4); gravity remains
20 m/s². Actual runtime hops peak around 0.6 m, with immediate launch and the same
horizontal control. Recovery is shorter and still fixed at contact. Each rig owns
its reference poses and buffers; attenuation follows a fresh source sample and
does not accumulate during fade-out. Physics remains the only root-height writer.

Front/side A/B and plaza inspection did not justify changing the accepted jog:
its bent elbows and modest torso movement already fit. Walk/run/idle body poses,
speeds and cadence are unchanged. No new assets or dependencies, and no measured
performance improvement is claimed. Local ignored evidence:
`output/research/education-motion/`; comparisons show the same elapsed time, not
the same flight phase because the new arc is shorter. Owner visual feedback on
this refinement remains the next step.

### Balanced-hop visual correction

The owner accepted the low height but found the source's asymmetric stance odd.
The runtime sampler now mirror-averages paired limbs (100% standing, 80% moving),
centers torso twist, reduces lateral leg rotation and adds a small forward arm
swing synchronized to vertical velocity. These adjustments follow each fresh
source sample and regional blend; they do not accumulate during fade-out.
The same source clips, license and JSON hashes above remain unchanged. There is
no new asset or dependency. Evidence is in `output/research/hop-pose/`; unlike the
height-refinement comparison, this A/B uses the same physics and elapsed time.

## Upright walk/jog refinement — 2026-11-10

Owner approved opening the upper back and lifting the gaze while retaining the
jog's forward lean. The runtime sampler adds small pitch offsets in normalized
parent space after each fresh sample: chest -1/-2 degrees, upperChest -5/-8,
neck +2/+3 and head -7/-6 for walk/jog. Existing runWeight interpolates those
offsets; existing locomotion weight fades the result to idle. Source sway/twist,
gait/arm local tracks, hips displacement and cadence remain intact. Arm world
positions naturally follow their corrected torso parents.

Both source JSON hashes and licenses remain unchanged. No new asset/dependency,
NPC change or performance claim. A/B uses the same rig, time and physics;
evidence: `output/research/locomotion-posture/` (ignored). The earlier upper-body
freeze is superseded only for this owner-approved refinement. Balanced hop,
fingers/greeting and idle retain their existing animation sources.
