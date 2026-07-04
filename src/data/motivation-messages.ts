import type { MotivationMessage } from "@/types";
import type { Locale } from "../i18n/locale";

const EN_MOTIVATION_MESSAGES: readonly MotivationMessage[] = [
  {
    id: "good-steady",
    body: "Nice. Stack one more calm day on top of this one.",
    tone: "focused",
    applicableStatuses: ["Good"],
    illustrationKey: "spark",
    active: true,
    weight: 1
  },
  {
    id: "okay-tiny-promises",
    body: "Keep the promise tiny; tiny promises compound.",
    tone: "gentle",
    applicableStatuses: ["Okay"],
    illustrationKey: "tiny-promise",
    active: true,
    weight: 1
  },
  {
    id: "bad-reset",
    body: "A reset day still counts as practice. Pick one small win.",
    tone: "reflective",
    applicableStatuses: ["Bad"],
    illustrationKey: "reset",
    active: true,
    weight: 1
  },
  {
    id: "planned-preview",
    body: "Future you gets a softer start when today you names the next step.",
    tone: "playful",
    applicableStatuses: ["Planned"],
    illustrationKey: "calendar",
    active: true,
    weight: 1
  }
];

const VI_MOTIVATION_MESSAGES: readonly MotivationMessage[] = [
  {
    id: "good-steady",
    body: "Ổn đó. Xếp thêm một ngày bình tĩnh nữa lên hôm nay.",
    tone: "focused",
    applicableStatuses: ["Good"],
    illustrationKey: "spark",
    active: true,
    weight: 1
  },
  {
    id: "okay-tiny-promises",
    body: "Giữ lời hứa thật nhỏ; những lời hứa nhỏ sẽ cộng dồn.",
    tone: "gentle",
    applicableStatuses: ["Okay"],
    illustrationKey: "tiny-promise",
    active: true,
    weight: 1
  },
  {
    id: "bad-reset",
    body: "Một ngày reset vẫn là luyện tập. Chọn một chiến thắng nhỏ thôi.",
    tone: "reflective",
    applicableStatuses: ["Bad"],
    illustrationKey: "reset",
    active: true,
    weight: 1
  },
  {
    id: "planned-preview",
    body: "Bạn của ngày mai sẽ bắt đầu nhẹ hơn khi hôm nay mình gọi tên bước tiếp theo.",
    tone: "playful",
    applicableStatuses: ["Planned"],
    illustrationKey: "calendar",
    active: true,
    weight: 1
  }
];

export const MOTIVATION_MESSAGES: readonly MotivationMessage[] = EN_MOTIVATION_MESSAGES;

export function getMotivationMessages(locale: Locale): readonly MotivationMessage[] {
  return locale === "vi" ? VI_MOTIVATION_MESSAGES : EN_MOTIVATION_MESSAGES;
}
