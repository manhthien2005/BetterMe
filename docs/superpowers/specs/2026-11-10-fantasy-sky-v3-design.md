# Fantasy sky V3 — ngày, hoàng hôn và đêm

Ngày 2026-11-10. Owner yêu cầu brainstorm và trực tiếp thực thi nâng cấp toàn diện bầu trời fantasy theo cảm hứng Genshin, gồm subagent chuẩn bị asset. Hướng và thông số cụ thể dưới đây do Codex chọn để owner nghiệm thu trong game; camera/fade vừa được duyệt là bất biến.

## Hướng chọn

Trời nhiều lớp với màu khí quyển, mây có khối và khoảng trống, ánh sáng vàng đào/hồng tím khi mặt trời hạ, đêm xanh chàm có trăng chi tiết và sao nhỏ. Chuyển tiếp theo độ cao mặt trời TP.HCM thay vì bật/tắt màu theo nhãn buổi. Mây ngày sáng ở đỉnh, bụng lavender nhẹ; mây hoàng hôn bắt màu theo hướng nắng; đêm giảm độ phủ/độ sáng để mở vùng sao, nhưng không biến trời mưa thành quang.

Đã cân nhắc skybox ảnh (nhẹ nhưng đóng băng bố cục, khó đổi giờ) và volumetric raymarch (có chiều sâu nhưng nhiều chi phí GPU). Chọn cloud impostor với biên hữu cơ, shader khí quyển và batch sao. ImageGen không khả dụng trong phiên: không gọi API trả phí hoặc đọc khóa; dùng asset code-native do subagent dựng và texture nguồn đã có, ghi provenance thật. Không tuyên bố có bộ raster AI mới.

## Phạm vi và cấu trúc

- Public Plaza là bầu trời chính được thay thế. Personal giữ ánh sáng/camera theo spec hiện hữu; kiểm chuyển map không leak. Asset package có thể tái sử dụng về sau, nhưng không thay layout/map ngoài bầu trời.
- Giữ HCMC timezone, NOAA sun direction, weather/live/preview contract, một directional light đổ bóng, gameplay dễ nhìn về đêm. Không sửa camera.ts, map-config.ts, character fade hoặc physics.
- New pure asset package: bố cục/shape mây, palette, deterministic star catalog, provenance và bản runtime trăng được chuẩn hóa từ nguồn có sẵn.
- New pure sky model: trọng số day/twilight/night liên tục, weather attenuation, cloud thinning. New renderer: sphere gradient shader + directional glow, cloud cards ở nhiều độ cao, một Points batch sao, mặt trời/trăng tách biệt cùng weather attenuation, một dải fantasy nhẹ ở trời đêm quang.
- Reduced motion dừng trôi mây và lấp lánh/aurora; giờ và thời tiết tiếp tục cập nhật. Cùng asset giữ nguyên qua preview, không tải lại mỗi lần đổi giờ. Lỗi tải texture trăng giữ fallback hình học/shader.

## Tiêu chí nghiệm thu

1. 07:30 / 12:15 / 17:30 / 20:30 khác nhau rõ nhưng chuyển tiếp liên tục; thêm mẫu ±1 phút tại các mốc để test domain.
2. Mây không thành tấm chữ nhật, có khoảng trống và độ sâu quanh 360°, có lớp cao khi camera ngẩng. Đêm mây thưa hơn ngày cùng cloudCover; overcast/rain vẫn nhiều mây và che sao.
3. Trăng chi tiết, sao nhỏ không phải khối; không có đường cắt biên sáng hay tấm aurora hình chữ nhật. Nền và HUD dễ đọc; một nguồn bóng chính.
4. 1440×1000 và 390×844; xoay hướng, di chuyển, reset, giảm motion, đổi Personal/Plaza ba vòng; asset error và console/shader error.
5. Cặp đo RAF p95/p99 ba lượt cùng scene/browser/DPR với baseline; ghi draw calls, triangles, texture/geometry và dung lượng asset. Đây là proxy frame pacing, không chứng nhận thiết bị owner. Mục tiêu không tăng p95/p99 >10% và giảm chi phí cảnh đêm.
6. Dừng đúng dev trước pnpm verify; cả bốn gates pass. Khởi động dev lại. Không commit/push.
