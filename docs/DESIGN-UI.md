# DESIGN-UI.md

# UI/UX Design Guide — Dashboard

> **Purpose:** Panduan utama untuk AGENTS sebelum mendesain atau mengembangkan UI dashboard.
>
> Dokumen ini mengambil **DNA visual dan prinsip UX dari referensi `Analisa Desain UI UX.pdf`**, lalu disesuaikan dengan insight percakapan proyek: **tampilan/mockup adalah architectural vision**, teknologi mengikuti pengalaman pengguna, dan implementasi harus **efektif, valid, cepat dibuat, tanpa overengineering**.

---

## 1. Prinsip Utama

### 1.1 Design-first, technology-second

Urutan kerja:

```text
BUSINESS PROCESS
      ↓
VISUAL VISION / MOCKUP
      ↓
UX FLOW
      ↓
INTERACTION + STATES
      ↓
DESIGN LANGUAGE
      ↓
COMPONENTS
      ↓
FRONTEND
      ↓
BACKEND / DATA / INTEGRATION
```

Jangan membalik urutan hanya karena framework atau component library sudah tersedia.

**Pertanyaan pertama bukan:**

> "Bagaimana kita coding ini?"

Tetapi:

> "Apa yang harus dilihat user, apa yang harus dilakukan user, dan bagaimana pengalaman itu terasa?"

Referensi secara eksplisit menempatkan mockup sebagai tahap utama untuk menentukan komposisi layar, spatial relationship, hierarchy, typography, color, density, visualization, card treatment, navigation, motion, dan personality.  

### 1.2 Teknologi harus membantu user

Teknologi bukan tujuan akhir.

UI yang terlalu canggih tetapi:
- membingungkan,
- membutuhkan learning curve tinggi,
- menambah operational error,
- atau membuat workflow lebih lambat,

harus disederhanakan.

Gunakan prinsip:

```text
Familiar → Useful → Clear → Efficient → Upgradeable
```

Fitur baru sebaiknya diperkenalkan secara **progressive disclosure**, bukan langsung menampilkan seluruh kemampuan sistem.

### 1.3 Jangan overengineering

Target implementasi:

- visual kuat;
- workflow jelas;
- component reusable secukupnya;
- responsive;
- accessible;
- mudah dikembangkan;
- tidak membangun abstraction yang belum diperlukan.

**Rule:**
> Jika sebuah solusi sederhana dapat memberikan UX yang sama, gunakan solusi sederhana.

---

# 2. Design DNA

Dashboard bukan traditional admin dashboard.

Karakter visual yang dipertahankan dari referensi:

| Aspek | Direction |
|---|---|
| Layout | Canvas-first / workspace-first |
| Navigation | Minimal icon rail |
| Content | Floating / layered contextual cards |
| Hierarchy | Canvas → KPI → Context → Detail → Action |
| Shape | Rounded / soft geometry |
| Color | Warm neutral + muted teal + dark + limited accent |
| Typography | Modern grotesk / geometric sans |
| Density | Low–medium |
| Interaction | Contextual, bukan menu-heavy |
| Style | Soft Enterprise Spatial UI |
| Responsive | Recompose, bukan sekadar shrink |

### Prinsip visual utama

> **The workspace is the application. Cards are contextual controls around it.**

Hindari pola:

```text
Sidebar
Header
Card
Card
Card
Table
Card
Card
```

yang membuat **card soup**.

Lebih baik:

```text
APP SHELL
 ├── NAVIGATION
 └── WORKSPACE
      ├── CONTROL BAR
      ├── MAIN CANVAS / VISUAL AREA
      ├── PRIMARY METRICS
      ├── DETAIL
      ├── VISUAL / INSIGHT
      └── ACTION
```

---

# 3. Visual Vision / Mockup

Mockup bukan dekorasi.

Mockup adalah **architectural vision** untuk produk.

Sebelum development, minimal tentukan:

1. Apa yang terlihat pertama?
2. Apa primary action?
3. Apa informasi paling penting?
4. Apa yang bisa diklik?
5. Apa yang berubah setelah user melakukan action?
6. Bagaimana user mengetahui bahwa action berhasil?
7. Bagaimana keadaan loading, empty, error, dan success?
8. Bagaimana layout berubah di tablet/mobile?

### Prioritas visual

```text
1. Primary workspace / visual
2. Primary action
3. Important information
4. Context
5. Secondary information
6. Supporting controls
```

Jangan memulai dari component list.

Mulai dari **komposisi layar**.

---

# 4. Layout Architecture

## 4.1 App Background

Background berfungsi sebagai visual frame antara browser dan application workspace.

Karakter:
- muted;
- tidak mengganggu content;
- tidak terlalu kontras.

Referensi menggunakan muted/desaturated teal sebagai contoh.

## 4.2 Application Surface

Desktop dapat menggunakan application surface yang terasa seperti sebuah workspace.

Karakter:

```text
border-radius: 28px;
overflow: hidden;
```

Tidak wajib pixel-identical. Gunakan nilai tersebut sebagai visual direction, bukan hukum absolut.

## 4.3 Navigation Rail

Desktop:

- icon-first;
- compact;
- 72–84px;
- active state jelas;
- tooltip untuk icon-only navigation.

Tablet:

- sekitar 64px;
- tetap compact.

Mobile:

> **Jangan mempertahankan sidebar 72px.**

Gunakan:
- top navigation;
- bottom navigation;
- atau menu drawer,

sesuai kebutuhan workflow.

---

# 5. Grid & Structural Layout

Gunakan **CSS Grid / Flexbox** untuk structural layout.

### Jangan

Jangan meniru screenshot dengan absolute positioning untuk seluruh dashboard.

### Absolute positioning hanya untuk

- floating KPI;
- marker;
- overlay;
- badge;
- contextual control;
- decorative positioning yang memang membutuhkan overlay.

Structural layout tetap:

```text
Grid
Flex
Container
Flow layout
```

Contoh struktur konseptual:

```text
Dashboard
├── Navigation
└── Main
    ├── Header / Control Bar
    ├── Workspace / Canvas
    └── Supporting Information
```

---

# 6. Spacing System

Gunakan spacing konsisten.

Base scale:

```text
4
8
12
16
20
24
32
40
48
64
```

Rekomendasi:

| Element | Spacing |
|---|---:|
| Page padding | 24–32px |
| Card padding | 16–24px |
| Card gap | 12–16px |
| Section gap | 24–32px |
| KPI internal | 8–12px |
| Icon → label | ~8px |
| Major section | ~32px |

Whitespace adalah bagian dari information architecture.

Jangan mengisi semua ruang hanya karena ruang tersedia.

---

# 7. Radius

Gunakan hierarchy.

```text
sm       8px
md       12px
lg       16px
xl       20px
shell    28px
pill     999px
```

Guideline:

- Shell: 28px
- Large card: 20px
- Medium card: 16px
- Small component: 12px
- Badge: 8px
- Pill: 999px

Jangan semua element memakai radius yang sama.

---

# 8. Color System

Gunakan warna sesedikit mungkin.

Baseline dari referensi:

```css
--bg-app: #9FC2C5;
--surface: #F8F8F3;
--surface-2: #F1F2ED;

--text-primary: #111311;
--text-secondary: #686C68;
--text-muted: #949893;

--border: rgba(20, 25, 22, .08);

--accent: #F4A900;
--dark: #050605;

--success: #67B57A;
--warning: #E8A629;
--danger: #D96868;

--overlay: rgba(255,255,255,.72);
```

Nilai di atas adalah **starting token**, bukan kewajiban jika mockup final membutuhkan penyesuaian.

### Accent

Orange/yellow hanya untuk semantic emphasis:

- active;
- selected;
- CTA;
- important metric;
- progress;
- notification;
- selected marker.

**Jangan gunakan accent sebagai dekorasi random.**

### Rule

```text
1 background
1 primary surface
1 secondary surface
1 primary text
1 secondary text
1 accent
3 semantic colors
```

Sudah cukup untuk sebagian besar dashboard.

---

# 9. Typography

Gunakan satu font family utama agar konsisten.

Direction yang sesuai referensi:

- Inter;
- Manrope;
- Geist;
- Plus Jakarta Sans.

Untuk visual seperti referensi, **Manrope** dapat digunakan sebagai starting direction.

### Scale

```text
Display       32–40px / 700
Page title    24–28px / 700
Section       16–18px / 600–650
Body          14px / 400
Label         12px / 500
Caption       10–11px / 500
Metric        24–32px / 600
```

Jangan membuat terlalu banyak ukuran font.

### Rule

Angka / metric penting harus menjadi **visual anchor**.

---

# 10. Card System

Jangan membuat semua informasi menjadi card.

Gunakan empat tipe dasar:

### A. Container Card

Untuk grouping.

```text
Header
Content
Footer / Actions
```

### B. Metric Card

Untuk KPI atau status penting.

```text
Icon
Metric
Label
Optional change/status
```

### C. Visual Card

Untuk:

- image;
- chart;
- preview;
- map;
- visualization;
- media.

### D. Floating Card

Untuk informasi contextual di atas workspace/canvas.

Floating card adalah salah satu elemen penting dari visual language referensi.

---

# 11. Section Architecture

Gunakan hierarchy:

```text
Dashboard
├── Workspace / Canvas
├── Primary Metrics
├── Main Insight
├── Secondary Information
└── Actions
```

Bukan:

```text
Dashboard
├── Card
├── Card
├── Card
├── Card
├── Card
└── Card
```

Tujuannya adalah membuat user memahami **prioritas informasi**, bukan melihat kumpulan komponen.

---

# 12. Search & Filter

Control bar adalah bagian penting dari workspace.

Gunakan component reusable:

```text
<SearchInput />
<FilterSelect />
<FilterGroup />
<IconButton />
```

Jangan hard-code setiap filter secara terpisah.

### Desktop

```text
Search | Filter | Filter | Filter | Action
```

### Tablet

```text
Search
Filter group
```

### Mobile

```text
Search
[ Filters ]
```

Jangan memaksa 5–6 dropdown horizontal pada mobile.

---

# 13. Navigation Interaction

Minimal state untuk navigation:

```text
Default
Hover
Active
Disabled
```

Icon-only navigation membutuhkan:

- tooltip;
- visible active state;
- keyboard support;
- accessible label.

Contoh active state:

```text
○ Default
[○] Hover
[●] Active
◌ Disabled
```

---

# 14. Canvas / Workspace Interaction

"Canvas" tidak harus berarti map.

Bisa berupa:

- product workspace;
- media intelligence;
- image processing;
- AI workspace;
- monitoring;
- analytics;
- workflow;
- chart;
- data visualization.

Interaction yang umum:

```text
Hover     → tooltip / preview
Click     → detail
Double click → focus
Select    → highlight
Filter    → update workspace
Reset     → restore state
Fullscreen → expand workspace
```

Tidak semua interaction harus diterapkan. Gunakan hanya jika memang mendukung workflow.

---

# 15. Contextual Information

Information sebaiknya muncul di tempat user membutuhkannya.

Contoh:

```text
User selects item
      ↓
Workspace highlights item
      ↓
Detail panel updates
      ↓
Relevant action becomes available
```

> **Interaction should propagate through the dashboard.**

Jangan membuat setiap component terasa seperti aplikasi terpisah.

---

# 16. Detail Panel

Detail panel dapat mengikuti pola:

```text
Entity / Item
Metadata

KPI   KPI   KPI

Status / Insight

[ Primary Action ]
```

Gunakan untuk:
- detail item;
- asset;
- campaign;
- AI result;
- monitoring entity;
- selected object;
- processing result.

Detail panel harus menjawab:

1. Apa yang dipilih?
2. Kondisinya bagaimana?
3. Apa informasi pentingnya?
4. Apa action berikutnya?

---

# 17. Badge

Badge harus memiliki **semantic meaning**.

Contoh:

```text
● Active
● Processing
● Pending
● Warning
● Offline
● Verified
● Failed
```

Style:

```css
display: inline-flex;
align-items: center;
gap: 6px;
padding: 4px 9px;
border-radius: 999px;
font-size: 11px;
font-weight: 600;
```

Jangan membuat badge terlalu besar.

Jangan menggunakan badge hanya untuk dekorasi.

---

# 18. Iconography

Gunakan satu icon system.

**Lucide** adalah baseline yang sesuai karena:

- clean;
- geometric;
- outline;
- consistent stroke;
- cocok untuk React.

Jangan mencampur Lucide + FontAwesome + Material Icons + custom SVG tanpa alasan visual yang jelas.

---

# 19. Shadows & Glass

Gunakan soft shadow.

Baseline:

```css
box-shadow: 0 8px 30px rgba(0,0,0,.06);
```

Untuk floating:

```css
box-shadow: 0 16px 40px rgba(0,0,0,.10);
```

Hindari hard shadow seperti:

```css
0 4px 4px #000;
```

### Glass / transparency

Gunakan secara terbatas untuk:

- floating controls;
- overlay;
- toolbar;
- contextual information.

Main cards tetap **solid**.

Jangan membuat seluruh dashboard menjadi glassmorphism.

---

# 20. Responsive Strategy

Responsive berarti **recomposition**, bukan mengecilkan desktop.

## Desktop ≥ 1280

```text
Navigation rail
        +
Control bar
        +
Large workspace
        +
Floating KPI
        +
Detail / Visual / Insight
```

## Tablet 768–1279

- navigation lebih compact;
- beberapa visual card dapat turun ke row berikutnya;
- controls dapat wrap;
- workspace tetap menjadi fokus.

## Mobile < 768

Recomposition total:

```text
Header
Search
Workspace
KPI
Details
Insights
Bottom Navigation
```

Desktop:

```text
Left Rail
```

Mobile:

```text
Bottom Navigation
```

---

# 21. Mobile Card Behavior

Untuk KPI kecil, gunakan horizontal scrolling jika membantu mempertahankan hierarchy.

```css
display: flex;
overflow-x: auto;
scroll-snap-type: x mandatory;
```

Jangan membuat dashboard mobile menjadi halaman yang sangat panjang hanya karena semua card dipaksa stacking.

Gunakan stacking ketika informasi memang perlu dibaca berurutan.

---

# 22. Touch & Interaction Target

Minimum clickable hit area:

```text
~44 × 44px
```

Icon boleh berukuran:

```text
20–24px
```

tetapi area klik harus cukup besar.

Jangan membuat:

```text
24 × 24 clickable area
```

hanya demi mempertahankan ukuran icon.

---

# 23. Motion

Motion harus subtle.

Baseline:

```text
Hover      120–180ms
Card       180–240ms
Panel      250–300ms
Modal      200–250ms
```

Easing:

```css
cubic-bezier(.2,.8,.2,1)
```

Contoh:

```css
transition:
  transform 180ms ease,
  box-shadow 180ms ease,
  background 180ms ease;
```

Hindari:

- bounce;
- elastic;
- overshoot;
- 3D rotation;

kecuali memang menjadi bagian dari product interaction yang jelas.

---

# 24. Loading / Empty / Error

Setiap data-driven component minimal memiliki:

```text
Loading
Loaded
Empty
Error
```

Loading harus **contextual**.

Jangan menampilkan satu spinner besar untuk seluruh dashboard jika hanya satu card yang sedang mengambil data.

Contoh:

```text
Loading
████████████

Empty
No data available

Error
Unable to load data
[Retry]
```

---

# 25. Accessibility

Minimum:

- WCAG AA sebagai target;
- keyboard navigation;
- visible focus ring;
- ARIA labels;
- semantic HTML;
- reduced motion;
- color bukan satu-satunya indikator.

Gunakan:

```html
<button aria-label="Open settings">
```

bukan clickable `<div>` untuk interactive control.

---

# 26. Design System — Hasil dari Mockup

**Jangan membuat design system sebelum mengetahui visual direction.**

Urutan:

```text
Mockup
 ↓
Interaction
 ↓
States
 ↓
Responsive behavior
 ↓
User flow
 ↓
Color
 ↓
Typography
 ↓
Spacing
 ↓
Radius
 ↓
Grid
 ↓
Cards
 ↓
Buttons / Inputs / Icons
 ↓
Motion
```

Design system adalah **hasil ekstraksi dari visual yang sudah disepakati**, bukan alat untuk memaksa mockup mengikuti component library.

---

# 27. Component Architecture — Secukupnya

Jika menggunakan React/Next.js, gunakan struktur sederhana.

Contoh:

```text
components/
├── app-shell/
│   ├── AppShell
│   ├── Sidebar
│   ├── MobileNav
│   └── Header
│
├── navigation/
│   ├── NavItem
│   └── Tooltip
│
├── controls/
│   ├── SearchInput
│   ├── FilterSelect
│   └── IconButton
│
├── cards/
│   ├── Card
│   ├── MetricCard
│   ├── VisualCard
│   ├── DetailCard
│   └── FloatingCard
│
├── data-display/
│   ├── Badge
│   ├── Stat
│   └── Progress
│
└── feedback/
    ├── Skeleton
    ├── EmptyState
    └── ErrorState
```

Jangan membuat component hanya karena sebuah `<div>` muncul dua kali.

**Reuse ketika ada pola yang benar-benar sama.**

---

# 28. Recommended Implementation Stack

Jika project menggunakan React/Next.js:

```text
Next.js
React
TypeScript
Tailwind CSS
shadcn/ui
Radix primitives
Lucide icons
```

Untuk chart jika memang dibutuhkan:

```text
Recharts / ECharts
```

Untuk motion jika memang dibutuhkan:

```text
Framer Motion
```

Namun:

> **Jangan menggunakan library hanya karena library tersedia.**

shadcn/ui boleh digunakan sebagai behavior/accessibility foundation, tetapi visual harus mengikuti design language produk.

Jangan menggunakan shadcn default mentah-mentah jika bertentangan dengan mockup.

---

# 29. Project-Specific UX: Asset / Product Workflow

Untuk konteks aplikasi Asset AI yang dibahas dalam percakapan, workflow utama dapat divisualisasikan sebagai:

```text
CAPTURE / UPLOAD
      ↓
PRODUCT SELECTION
      ↓
BACKGROUND REMOVAL
      ↓
VERIFICATION
      ↓
IDENTIFICATION / NAMING
      ↓
SAVE ASSET
      ↓
ASSET LIBRARY
```

UI harus membuat status proses terlihat jelas tanpa membebani user.

### Contoh workspace

```text
┌──────────────────────────────────────────────┐
│ Navigation        Control / Search           │
├──────────────┬───────────────────────────────┤
│              │                               │
│              │       Product Preview         │
│              │                               │
│              │     [ Remove Background ]     │
│              │                               │
│              ├───────────────────────────────┤
│              │ Name / Metadata / Status      │
│              │ [ Save Asset ]                │
└──────────────┴───────────────────────────────┘
```

### Prinsip penting

User tidak perlu memahami:
- model vision;
- segmentation;
- inference;
- pipeline;
- API;
- storage implementation.

User cukup memahami:

```text
Pilih produk
→ Bersihkan
→ Verifikasi
→ Beri nama
→ Simpan
```

Teknologi bekerja di belakang layar.

---

# 30. Asset Verification UX

Jika sistem melakukan verifikasi otomatis:

```text
Image
 ↓
AI processing
 ↓
Result
 ↓
User confirmation
```

UI harus memberi kesempatan untuk koreksi.

Contoh:

```text
Detected:
"Running Shoes"

Confidence / status:
Verified

[ Edit name ]

[ Save Asset ]
```

Jangan membuat AI result menjadi keputusan final yang tidak bisa dikoreksi user.

---

# 31. Progressive Disclosure

Jangan tampilkan seluruh metadata sekaligus.

Default:

```text
Product
Preview
Name
Status
Primary action
```

Advanced information dapat muncul ketika dibutuhkan:

```text
More details
Metadata
Processing information
Technical information
History
```

Tujuannya mempertahankan **low visual noise**.

---

# 32. UX State Matrix

Setiap workflow utama harus memiliki state yang jelas.

| State | User melihat | User dapat melakukan |
|---|---|---|
| Empty | Belum ada asset | Upload / Capture |
| Processing | Progress / status | Cancel jika aman |
| Result | Preview + result | Review / Edit |
| Verified | Status valid | Save |
| Saved | Confirmation | Open asset |
| Error | Penyebab singkat | Retry |
| Invalid | Masalah input | Correct / Replace |

Tidak perlu membuat state yang tidak dibutuhkan.

---

# 33. Visual Quality Checklist

Sebelum development dianggap selesai secara visual:

### Hierarchy

- [ ] Primary information langsung terlihat.
- [ ] Primary action jelas.
- [ ] Secondary information tidak mengambil perhatian berlebihan.
- [ ] Tidak ada card soup.

### Layout

- [ ] Workspace menjadi fokus.
- [ ] Grid/Flex digunakan untuk structure.
- [ ] Absolute positioning hanya untuk overlay/contextual element.
- [ ] Spacing konsisten.
- [ ] Whitespace cukup.

### Color

- [ ] Warna tidak berlebihan.
- [ ] Accent memiliki semantic meaning.
- [ ] Status tidak hanya dibedakan berdasarkan warna.

### Typography

- [ ] Satu font family utama.
- [ ] Hierarchy ukuran jelas.
- [ ] Metric menjadi visual anchor.

### Interaction

- [ ] Hover state.
- [ ] Active state.
- [ ] Disabled state.
- [ ] Focus state.
- [ ] Loading.
- [ ] Empty.
- [ ] Error.
- [ ] Success.

### Responsive

- [ ] Desktop.
- [ ] Tablet.
- [ ] Mobile.
- [ ] Mobile bukan desktop yang diperkecil.
- [ ] Navigation berubah sesuai device.
- [ ] Touch target memadai.

---

# 34. Anti-Patterns

Jangan lakukan hal berikut kecuali ada alasan UX yang kuat:

```text
❌ Dashboard penuh card
❌ Semua card memiliki border
❌ Semua card memiliki shadow
❌ Semua element menggunakan accent
❌ Full glassmorphism
❌ Sidebar besar dengan banyak text
❌ 5–6 filter dipaksa horizontal di mobile
❌ Absolute positioning untuk seluruh layout
❌ Animasi berlebihan
❌ Spinner global untuk semua data
❌ AI result tanpa user correction
❌ Metadata teknis memenuhi layar utama
❌ Component abstraction berlebihan
❌ Meniru screenshot pixel-by-pixel tanpa memahami workflow
❌ Membiarkan framework menentukan visual
```

---

# 35. AGENTS Development Directive

Sebelum menulis code, AGENT wajib memahami:

```text
1. Business process
2. Primary user action
3. Visual hierarchy
4. Mockup / visual vision
5. Interaction states
6. Responsive composition
7. Required components
8. Data dependency
```

### Jangan langsung:

```text
npm install
buat sidebar
buat card
buat table
buat dashboard
```

### Lakukan:

```text
Understand workflow
      ↓
Review / build mockup
      ↓
Validate visual composition
      ↓
Define interaction
      ↓
Implement minimal components
      ↓
Connect real data
      ↓
Refine UX
```

---

# 36. Definition of Done — UI

UI dianggap siap untuk tahap berikutnya apabila:

- workflow utama dapat dipahami tanpa penjelasan panjang;
- visual hierarchy jelas;
- user tahu apa yang harus dilakukan berikutnya;
- state utama tersedia;
- responsive behavior sudah ditentukan;
- tidak ada component yang hanya dibuat demi abstraction;
- teknologi tidak menambah complexity yang tidak perlu;
- visual tetap dekat dengan approved mockup;
- user dapat melakukan koreksi terhadap automated/AI result;
- interface terasa seperti **tool yang membantu pekerjaan**, bukan demo teknologi.

---

# 37. Final Design Direction

Gunakan kalimat berikut sebagai **north star** selama development:

> **Build the experience first. Let the design emerge from the user's work, then let the technology support it.**

Karakter visual:

```text
Soft Enterprise Spatial UI

Minimal
Spatial
Canvas-first
Soft geometry
Low density
Strong hierarchy
Contextual interaction
Premium but practical
Familiar
Upgradeable
```

Bukan:

```text
Traditional Admin Dashboard
Card-heavy SaaS
Full Glassmorphism
Technology-first UI
Feature showcase
```

### Prinsip terakhir

```text
BUSINESS PROCESS
       ↓
USER EXPERIENCE
       ↓
VISUAL / MOCKUP
       ↓
USABLE PRODUCT
       ↓
PROGRESSIVE UPGRADE
```

**Teknologi mengikuti pengalaman. Bukan pengalaman mengikuti teknologi.**

---

## Source / Reference

Dokumen ini menggunakan `Analisa Desain UI UX.pdf` sebagai referensi utama untuk:
- visual DNA;
- layout;
- spacing;
- typography;
- color;
- card architecture;
- responsive strategy;
- interaction;
- accessibility;
- component direction;
- dan perubahan paradigma dari technology-first menjadi design/experience-first.

Referensi tersebut juga menekankan bahwa mockup harus diperlakukan sebagai **architectural vision**, bukan sekadar gambar untuk ditiru pixel-by-pixel.
