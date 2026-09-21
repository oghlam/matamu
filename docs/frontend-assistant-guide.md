# Panduan: Asisten Front-end untuk Mat(a)Mu

## Singkatnya

**Tidak perlu** asisten front-end khusus sekarang. Sprint 0-2 fokus ke backend + CV.
**Saat Sprint 3** (7-13 Okt), barulah front-end jadi fokus — dan saat itu bisa pakai.

---

## Kapan Front-end Mulai Dikerjakan?

```
Sprint 0 (21-22 Sep) → Setup Vite + Tailwind (skeleton only, 30 menit)
Sprint 1 (23-29 Sep) → TIDAK ADA front-end (fokus CV pipeline)
Sprint 2 (30 Sep-6 Okt) → TIDAK ADA front-end (fokus backend + Bedrock)
Sprint 3 (7-13 Okt) → FRONT-END JADI FOKUS UTAMA (7 hari penuh)
```

**Artinya:** Anda masih punya 2 minggu sebelum perlu memikirkan tampilan.

---

## Opsi: Pakai Asisten Front-end atau Tidak?

### Opsi A: Tidak Pakai Asisten (Saya yang kerjakan)

**Cocok kalau:**
- Anda mau saya yang tulis React + Tailwind code langsung
- Tampilan cukup functional, tidak perlu design yang sangat polished
- Lebih cepat (satu agent, tidak perlu koordinasi)

**Hasilnya:**
- Functional PWA: capture, upload, map, list
- UI bersih tapi minimal (Tailwind default)
- Cukup untuk demo kompetisi

### Opsi B: Pakai Asisten Front-end (UI/UX Specialist)

**Cocok kalau:**
- Mau tampilan lebih profesional, polished
- Mau ada design system (warna, spacing, komponen konsisten)
- Mau micro-interactions (loading state, toast, animasi)

**Plus:**
- Tampilan lebih estetik → nilai UX (10% skor kompetisi) naik
- Design system konsisten antara warga + operator view

**Minus:**
- Butuh koordinasi antara saya (backend) + asisten (frontend)
- Butuh spec yang jelas: "asisten bikin komponen X, saya sambungkan ke API Y"
- Bisa jadi bottleneck kalau asisten tidak paham context project

### Opsi C: Hybrid (REKOMENDASI)

```
Sprint 0-2: Saya kerjakan semua (backend + CV + skeleton frontend)
Sprint 3:
  ├── Saya: sambungkan frontend ke API (data flow, map data, upload)
  └── Asisten front-end: polish UI (design system, responsive, animasi)
```

**Kenapa hybrid:**
- Saya sudah paham context project (API schema, data model, agentic flow)
- Asisten front-end fokus ke "make it look good" — tidak perlu paham backend
- Efisien: saya handle logic, asisten handle aesthetics

---

## Rekomendasi

**Untuk kompetisi ini: Opsi C (Hybrid)**

1. **Sekarang (Sprint 0-2):** Tidak perlu asisten. Saya kerjakan backend + CV + skeleton.
2. **Sprint 3:** Bisa panggil asisten front-end untuk polish tampilan.
3. **Sprint 4-5:** Tidak perlu asisten (fokus integration + dokumentasi).

**Kalau mau simpel:** Opsi A saja. Saya kerjakan semuanya. Untuk kompetisi, functional UI sudah cukup — yang dinilai adalah "end-to-end working system", bukan design award.

---

## Kalau Pakai Asisten, Apa yang Harus Disiapkan?

Sebelum asisten front-end mulai (Sprint 3), siapkan:

1. **API sudah jalan** (Sprint 2 selesai) — asisten butuh endpoint untuk test
2. **Spec UI** — list screen + komponen yang perlu dibuat:
   - `/capture` — camera + GPS + submit
   - `/my-reports` — list + status
   - `/` (map) — MapLibre + pins + heatmap + filter
   - `/admin` — dashboard widgets
3. **Design reference** — kasih lihat blueprint RAIP (`assets/dashboard-ui.png` + `assets/mobile-ui.png`) sebagai acuan
4. **API contract** — dari Django Ninja (auto-generate Swagger/OpenAPI)
