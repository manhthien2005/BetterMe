# Pet Companion Research — nuôi pet từ bé đến lớn + voice theo loài

> Nghiên cứu khả thi cho yêu cầu: (1) pet lớn dần theo ngày khi user hoàn thành habit, có food/tương tác + điểm thân mật; (2) chọn xoay tua giữa chó và mèo, lời thoại sync theo pet, mở rộng về sau.
> Trạng thái: **research xong — chưa implement**. Ngày: 2026-07-07.

## 1. Các app/game làm tốt nhất — cơ chế đã kiểm chứng

### Finch (chuẩn vàng của "gentle pet")
- Chim lớn qua **5 giai đoạn**: Baby → Toddler → Child → Teenager → Adult, đo bằng "adventure days" (ngày có hoạt động): Baby 7 ngày → Toddler 15 → Child 20 → Teen 25; tổng **67 ngày hoạt động** để trưởng thành. Mỗi giai đoạn mở khóa customization mới (headpatch, cánh, bụng).
- Hoàn thành goal → **Energy** cho pet đi adventure (goal ~5 energy); energy reset mỗi ngày.
- **Micropets**: gắn 1 trứng vào 1 goal cụ thể, hoàn thành goal đó 7 lần thì nở — cơ chế "trứng nở theo habit" rất hợp để BetterMe học theo.
- **Không bao giờ chết, không bao giờ trách**: bản beta từng có đại bàng Terry săn chim khi thiếu energy — bị gỡ ngay vì guilt phản tác dụng. Miss ngày → chim chỉ đợi.
- Nguồn: finch.fandom.com (Stages of Growth, Energy, Micropets), help.finchcare.com.

### Habitica — kinh tế cho ăn
- Hoàn thành task → rơi ngẫu nhiên trứng/potion/food (variable reward). Pet nở với food bar 10%; food ưa thích +10%/món, thường +4%/món → **9 món ưa thích** để pet thành mount. Bài học: con số nhỏ, hữu hạn, đếm được — user nhìn thấy đích.

### Neko Atsume — vòng lặp có đi có lại (reciprocity)
- Mèo chỉ ghé khi app đóng, để lại **quà** (cá) → mua đồ mới → hút mèo hiếm. Thế giới "sống tiếp khi vắng mình" khiến user quay lại xem. Không phạt vắng mặt: quên đồ ăn thì mèo chỉ không ghé, không chết.
- Bài học đắt nhất cho BetterMe: **"pet để dành quà cho bạn" là lý do quay lại không-tội-lỗi**, thay cho "pet đang đói".

### Pokémon — thang điểm thân mật
- Friendship **0–255** (1 byte), base 70; ngưỡng tiến hóa 220 (Gen II–VII) / 160 (Gen VIII+); checker chia **7 tier lời thoại** theo mức điểm — chính là mẫu "dialogue gating theo bond tier".

### Duolingo / số liệu retention
- Nhảy retention lớn nhất là **ngày 1 → ngày 2**, tăng dần đến ngày 7 rồi phẳng dần; loss-aversion bắt đầu tác dụng ~ngày 7. **Leniency thắng**: tính năng Earn Back (gỡ mất streak) làm retention tăng, không giảm.
- Benchmark app health/fitness: D1 ~25–30%, D7 ~13–18%, D30 ~7–8%. Đa số habit tracker bị bỏ trong 2 tuần đầu → pacing phải có "mốc chờ" ở ngày 2, ngày 5–7, ngày 30.

## 2. Mô hình số đề xuất cho BetterMe (7 habit/ngày, localStorage)

### Growth — lớn theo "ngày có chăm" (không theo volume)
- 1 ngày có ≥1 habit hoàn thành = **1 growth day** cho pet đang active (partial day vẫn tính — gentle).
- Giai đoạn (nhanh hơn Finch vì cần payoff sớm): Bé 5 ngày → Nhóc 10 → Nhí 15 → Teen 20 → **Trưởng thành ở 50 growth days** (~2 tháng dùng đều). Evolution đầu tiên rơi vào ngày 5 — đúng vùng cliff tuần đầu.
- Không bao giờ tụt giai đoạn. Miss ngày = không cộng, không trừ.

### Food & feeding — cầu nối habit → pet
- 1 habit xong = **1 món ăn** vào kho chung (không phân biệt pet). Ngày 100% (7/7) = thêm 1 món đặc biệt.
- Cho ăn là **hành động chạm** (tap món ăn → pet nhai, nhún, +bond) — đây là "interaction" anh muốn; mỗi món +2 bond. Kho có trần 21 món để chống binge-then-quit.

### Bond (điểm thân mật) — per-pet, 5 tier
- +2/habit (qua feeding), +5 bonus ngày 100%, +1/lần vuốt ve (chạm pet, tối đa 3/ngày). **Không decay.**
- Tier: 0 **Lạ lẫm** → 60 **Quen mặt** (~tuần 1) → 180 **Bạn thân** (~tuần 3) → 420 **Tri kỷ** (~tuần 6–7) → 840 **Gia đình** (~tháng 3). Khớp đường cong Duolingo: mốc dày tuần đầu, thưa dần.
- Mỗi tier mở: bộ thoại sâu hơn (pet nhớ tên, kể bí mật), idle animation mới, phụ kiện (nơ, khăn), tư thế thân mật hơn (dụi, nằm cạnh).
- Vắng mặt N ngày → khi quay lại pet **tặng quà để dành** + thoại "tớ để phần cậu" (Neko Atsume), tuyệt đối không "pet buồn/đói".

### Multi-pet switching
- Bond + growth **riêng từng pet**; kho food **chung**. Chỉ pet active nhận growth day + bond trong ngày → không có switch-abuse, pet thứ 2 bắt đầu từ bé = trải nghiệm mới thật sự. Pet không active "ở nhà nghỉ ngơi", không decay.

## 3. Tech để vẽ pet lớn dần — verdict

| Phương án | Ưu | Nhược | Phù hợp |
|---|---|---|---|
| **SVG tham số hóa (như Nếp hiện tại)** ✅ | 0 dependency, bundle ~vài KB, đổi stage/mood bằng props, ăn khớp art style pastel, reduced-motion kiểm soát 100%, thêm loài = thêm 1 component | Tự vẽ bằng code, animation phức tạp tốn công | **Chọn** |
| Rive (`@rive-app/react-canvas`) | State machine mood/stage trong 1 file, nhỏ hơn Lottie 10–15×, Duolingo dùng cho characters | Cần học tool Rive, asset pipeline mới, phá pattern "no external assets" | Nâng cấp sau nếu cần animation giàu |
| Pixel sprite (ToffeeCraft Pet Mobile pack có sẵn chó+mèo) | Nhanh, có sẵn | Lệch hẳn aesthetic mochi-pastel, license per-pack | Không khuyến nghị |

- Kiến trúc SVG đề xuất: **1 skeleton chung** (thân blob, mắt, má hồng, miệng — tái dùng từ nep.tsx) + lớp per-species (tai/đuôi/mõm chó vs mèo) + scale/chi tiết per-stage (bé = tròn hơn, ít chi tiết; lớn = thêm pattern, phụ kiện theo bond tier). Ví dụ tham khảo kỹ thuật rig SVG-by-class: github.com/bsawyer/tamagotchi; CSS pet: CodePen "Tamagotchi with Pure CSS" (manz).

## 4. Voice system — thoại sync theo pet

- Bài học Animal Crossing: **8 archetype phục vụ 400+ villager** nhờ (1) catchphrase chèn vào câu chung, (2) subtype, (3) thoại mở khóa theo friendship. → BetterMe chỉ cần **1 bảng thoại/loài**, cấu trúc:
  ```
  voicePack[species][bondTier][event] = string[]  // rotate kiểu shuffle-bag chống lặp
  event: morning | habitDone | easyWin | allDone | feeding | petting | comeback | night
  ```
  Thêm loài mới = thêm 1 voice pack + 1 SVG component. Interpolate {userName}, {habitName}.
- **Giọng chó** (nhiệt tình, trung thành, nhiều chấm than, xưng "em", gọi "Sếp ơi!"): "Sếp tick rồi!! Em thấy hết nha!! 🐾"
- **Giọng mèo** (tsundere — hờ hững nhưng thầm quan tâm, xưng "tôi", gọi "cậu"): "Hm. 5/7 rồi à… cũng tạm. Meo."
- Catchphrase làm chữ ký: chó kết câu "gâu!", mèo "meo~" / "…". Bond tier càng cao thoại càng thân (mèo tier 5 mới chịu nói "tôi… cũng nhớ cậu đó").

## 5. Số phận Nếp + rủi ro

- **Đề xuất**: Nếp không bị thay — trở thành **linh vật vườn/người dẫn chuyện** (onboarding, giới thiệu 2 pet, xuất hiện ở login) *hoặc* là **pet thứ 3 mặc định**. Nếp là brand identity, xóa là mất chữ ký của app.
- Rủi ro cần xử khi implement: bump localStorage key `betterme.dashboard.v1 → v2` + hàm migrate (giữ backward compatible); JSDOM test cho SVG mới; copy phải qua "guilt filter" (không câu nào đổ lỗi); reduced-motion cho mọi animation pet; nếu về sau dùng asset ngoài phải soát license per-pack.

## Nguồn chính
Finch Wiki (Stages of Growth / Energy / Micropets), Bulbapedia Friendship, Habitica Wiki (Pets/Food), Neko Atsume analyses (GameSkinny, Medium), Nookipedia + GameRant (ACNH personalities), Lenny's Podcast — Duolingo streaks (Jackson Shuttleworth), UXCam/Adjust retention benchmarks, Rive vs Lottie (rive.app, Callstack benchmark), itch.io virtual-pet packs, github.com/bsawyer/tamagotchi.
