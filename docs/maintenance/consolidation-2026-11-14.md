# Hợp nhất BetterMe — 14/11/2026

Bản hợp nhất đã qua kiểm source, runtime và bốn gate; checkpoint và chuyển
checkout được thực hiện theo kế hoạch đã được owner cho phép.

## Nguồn và quyết định

- Nền: working tree Plaza tại `e3f606e`, gồm terrain, study route, LOD,
  Cổng Mây sửa và water capture culling chưa commit.
- Nhân vật: working tree environment tại `2e07a39` cùng refinement chưa commit;
  nhập player nữ, An/Khoa/Minh, motion và test thực với VRM, không nhập sky/rain cũ.
- Root: chuẩn art, source UI, skill game-ui-workflow, spec và kế hoạch liên quan.
- Animation v0.3b: state machine/test đã trùng Plaza trước ghép; các scene,
  camera/physics/HUD khác biệt là thế hệ trước và được giữ trong recovery.
- Orphan `deploy-main`: app trước proxy/U2; không ghi đè app hiện hành.
  Orphan `t001-toolchain`: kiến trúc locale/theme/tracker cũ, các route không
  thuộc bốn space hiện hành. Nguồn độc nhất giữ recovery, không phục hồi vào app.
- Tám tài liệu lịch sử sky/plaza trùng tên khác nội dung: giữ bản Plaza trong
  checkpoint; bản environment/root vẫn có trong recovery. Không lùi sky mới.

## Adapter khi ghép

Hội thoại truyền lineIndex đến NPC. NPC nhìn theo delta y; contact pose có
`footGroundY` để giữ chân theo mặt đỡ -2/0/4/7. Camera/terrain/physics của Plaza
giữ nguyên, player frame -2, overview -1, effects 0, render tự động.

Plaza dùng jumpSpeed 7.4; test hop environment cũ dùng 4.8. Giữ profile hiện
hành, test cả profile lịch sử (đỉnh 0.5–0.7m) và hiện hành (1.3–1.6m), không
đổi physics để ép test cũ pass. Test mới bắt sai cao độ đã RED rồi GREEN.

Asset scripts khai báo trực tiếp `meshoptimizer@1.1.1` và `sharp@0.35.5`,
import qua exports package thay vì cấu trúc nội bộ pnpm. Không nâng stack.
`output/` giờ là artifact local đã phân loại/bảo toàn, không là input app/test;
lint/typecheck chỉ bỏ output sinh, vẫn kiểm mọi source/script/test của checkpoint.

## Asset và phục hồi

Runtime Git giữ 7 đảo chi tiết + 7 LOD/texture, 10 núi gồm Cổng Mây sửa, các
model/clip/manifest/license cần thiết. Khoa portrait source giữ ngoài `public`
trong `scripts/assets` làm fixture test bảo toàn mặt/tóc/morph đã duyệt.

Nguồn Blender: `D:/Dev/ArtSources/BetterMe` (~1.89 GiB ở lượt sao đầu);
README/manifest ghi dependency ngoài và cách export. Không copy nguồn Blender
vào Git. 19 Blend hiện hành mở được, không thiếu texture/library.

Recovery: `C:/Users/MrThien/BetterMe-recovery/2026-11-14`: 9,602 path entries,
7,353 unique file blobs, 5,927,404,746 bytes; 3 sample restores thành công.
Bundle 5 work branches hợp lệ, chứa đủ lịch sử; không chứa hidden Codex refs.
Không đọc/hash `.env*`; cấu hình riêng phải được giữ nguyên khi gỡ checkout.

Evidence local: `D:/Dev/Projects/BetterMe/output/consolidation-2026-11-14`.
Các JSON quyết định/hash/log được giữ ở đây, không chứa raw browser auth state.
Khôi phục: tra checkout + path trong recovery manifest, lấy blob theo SHA;
không tự chép đè file mới. Git bundle dùng để lấy lại lịch sử nhánh cũ.

## Kiểm tra và giới hạn

- Integration RED: 12 fail / 7 pass; GREEN: 19/19 (2 files).
- Hop/action regression: 14/14 (2 files). Typecheck đầu: exit 0.
- LOD rebuild: 7 models, 1,661,757 triangles, 35,794,311 bytes; cả 11 file
  GLB/texture/manifest khớp SHA-256 với runtime.
- `pnpm typecheck`, `pnpm lint`, `pnpm build`: exit 0; build 11/11 static entries.
- `pnpm vitest run --maxWorkers=2`: 967/967 tests, 109/109 files, 180.37s.
- Runtime closure: 101 file public, 423,915,934 bytes; mọi URI buffer/image
  ngoài GLB/glTF/VRM resolve được. Hai sample export từ ART khớp byte với runtime.
- Browser 1440×1000/DPR1: overview, 8 hướng, Cổng Mây sửa, ban đêm,
  walking và ba NPC đúng asset; An/Khoa/Minh mở/chuyển/đóng hội thoại được.
- 390×844/reduced motion: hội thoại không tràn ngang; HUD hiện hành chiếm
  nhiều diện tích màn hình, chưa được thiết kế lại trong round hợp nhất.
- Bàn phím thực: lên y=4, qua cầu lên y=7, xuống hồ y=-2; nhảy và đáp đúng mặt đỡ.
  Real-VRM tests kiểm -2/0/4/7, authored/procedural tại 30/60/120 Hz.
- Chặn model: fallback vẫn di chuyển. Chặn từng locomotion/actions JSON:
  dùng procedural tương ứng, tải lại trở về ready.
- Đổi map ba lần: personal 125 geometries/56 textures; Plaza 306/140,
  không tăng qua vòng lặp. Nước: 180/180 main renders, camera mismatch 0;
  offscreen captures 0, quay lại captures phục hồi.
- Không dùng dev bypass để kết luận về auth/Supabase thật. Không thay schema.

### Hiệu năng thực đo

Mỗi view 3 mẫu × 30 giây, cùng camera/1440×1000/DPR1/study noon, không build
hay test đồng thời. Số dưới là median của ba mẫu; raw JSON giữ local.

| View | Trước ghép NPC | Sau ghép NPC | p95 trước → sau |
|---|---:|---:|---:|
| Toàn cảnh | 99.6 FPS | 92.9 FPS | 10.1 → 20.0 ms |
| Đi bộ | 99.7 FPS | 80.0 FPS | 10.2 → 20.1 ms |

Overview calls 295→503, triangles 2,290,923→2,950,995. Walking calls
273→481, triangles 1,915,854→2,575,926. p99 sau ghép khoảng 30ms; không có
frame >50ms trong ba mẫu overview và một frame trong ba mẫu walking.
Hai view này có NPC: đây là chi phí bản nhân vật chi tiết đã duyệt. Không
kết luận rằng bản ghép nhanh bằng bản primitive. Chưa có ba cặp mẫu riêng
cho góc không thấy NPC nên chưa chứng minh ngưỡng p95 10% của protocol;
probe nhìn ra trời đạt ~100FPS/p95 10.2ms nhưng không thay thế phép so cặp.
Thời điểm asset response cuối/request count có trong raw metrics; đó không
phải phép đo cold network độc lập hoặc thời gian tất cả shader sẵn sàng.

### Tự review riêng

Đối chiếu diff tích hợp, frame order, terrain/IK, dialogue propagation,
cleanup VRM và fallback, manifest/license, imports/dependencies, runtime URI,
nguồn ART và closure. Không thay auth, RLS, sync hay economy. Bản nguồn cũ
và prototype không tích hợp vẫn có recovery. Chỉ stage allowlist source,
asset runtime, fixture và docs; không stage output, Blend, cache hoặc config.
Reviewer là chính agent theo yêu cầu owner làm đơn; không dùng subagent.

LOD hiện vẫn tải bảy file lúc vào Plaza. Culling water capture không phải
view-dependent streaming. Thêm nhân vật VRM làm tăng tài nguyên; cleanup ổ đĩa
không tự chứng minh tăng FPS. Không đổi GPU, schema, auth hoặc deploy trong round.
