# Deferred Work

- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-project-setup-infrastructure.md`
  summary: `admin.ts` và `server.ts` thiếu runtime guard khi SUPABASE env vars bị missing, createClient sẽ nhận undefined
  evidence: Env vars là manual prerequisites per spec; standard TS `!` operator không throw tại runtime; trong mis-configured env app sẽ fail với Supabase error thay vì message rõ ràng

- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-project-setup-infrastructure.md`
  summary: `progress_seconds` trong `watch_history` thiếu CHECK constraint ngăn giá trị âm
  evidence: Không trong scope spec; sẽ cho phép negative progress values gây lỗi logic tại Epic 3 (watch progress); nên thêm `CHECK (progress_seconds >= 0)` trong migration tương lai

- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-project-setup-infrastructure.md`
  summary: `rating` trong `movies` thiếu range constraint (không enforce 0–10)
  evidence: Không trong scope spec; invalid ratings có thể lọc vào qua API trực tiếp; nên thêm `CHECK (rating >= 0 AND rating <= 10)` trong migration tương lai
