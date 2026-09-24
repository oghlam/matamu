# Prompt for ChatGPT Image Generation: Mat(a)Mu Agentic Vision System Diagram

Create a professional, modern technical architecture diagram for an **Agentic Computer Vision System** called "Mat(a)Mu" for road damage monitoring. The diagram should be **visually stunning, easy to understand, and competition-ready** for the OpenCV AI Competition 2026.

## Visual Style Requirements:
- **Modern tech aesthetic**: Use a clean, professional design with rounded corners, soft shadows, and subtle gradients
- **Color scheme**: 
  - Primary: Teal/cyan (#00CED1) for main flow
  - Accent: Orange (#FF8C00) for AI/ML components
  - Success: Green (#32CD32) for approved/published paths
  - Warning: Amber (#FFB84D) for pending/review paths
  - Neutral: Light gray (#F5F5F5) for backgrounds, dark gray (#2C3E50) for text
- **Typography**: Clean sans-serif fonts, bold headers, legible body text
- **Layout**: Left-to-right flow with clear vertical separation between layers
- **Icons**: Use simple, modern iconography (camera, shield, brain, database, check/warning symbols)

## Diagram Structure:

### LAYER 1: INPUT (Left side - Sky Blue background)
**Title: "Citizen Report"**
- **Icon**: Smartphone with camera
- **Components** (vertical stack):
  1. Photo capture (camera icon + JPEG label)
  2. GPS location (pin icon + lat/lng coordinates)
  3. Timestamp (clock icon)
  4. Reporter identity (user icon + "Google OAuth")
- **Arrow**: Large cyan arrow pointing right labeled "CAPTURE" → to Layer 2

---

### LAYER 2: PERCEPTION (Center-left - Light Orange background)
**Title: "Multi-Signal Intelligence"**
**Subtitle**: "6 Perception Signals"

Create **6 rounded boxes** arranged in 2 columns × 3 rows, each with:
- Icon + Technology name + Output metric

**Box 1** (top-left):
- Icon: Grid/detection symbol
- **YOLOv11n**
- Tech: "OpenCV 5 DNN"
- Output: "detected_class, confidence, bbox"
- Color: Orange accent

**Box 2** (top-right):
- Icon: Diamond/quality symbol
- **IQE**
- Tech: "Laplacian blur + brightness"
- Output: "trust_score (0-1)"
- Color: Blue accent

**Box 3** (middle-left):
- Icon: Face/mask symbol
- **SFace + YuNet**
- Tech: "Face detection + blur"
- Output: "faces_blurred (count)"
- Color: Purple accent

**Box 4** (middle-right):
- Icon: Checklist/structured symbol
- **TypeSafe AI**
- Tech: "5 parallel questions"
- Output: "severity, urgency, confidence"
- Color: Teal accent

**Box 5** (bottom-left):
- Icon: Cloud/brain symbol
- **Bedrock Sonnet 4.5**
- Tech: "Multimodal reasoning"
- Output: "severity (fallback)"
- Color: Deep purple accent

**Box 6** (bottom-right):
- Icon: Map/location cluster symbol
- **PostGIS**
- Tech: "Spatial analysis"
- Output: "nearby_count (50m)"
- Color: Green accent

**Arrow**: Large orange arrow pointing right labeled "PERCEIVE" → to Layer 3

---

### LAYER 3: DECISION (Center - Light Yellow background)
**Title: "Confidence-Gated Routing"**
**Subtitle**: "5 Decision Gates"

Create a **vertical decision tree** with 5 diamond-shaped gates:

**Gate 1** (top):
- Diamond icon with "?" symbol
- **Photo Quality < 0.5?**
- YES → Red arrow to "Pending" (right)
- NO → Down to Gate 2

**Gate 2**:
- Diamond icon
- **YOLO Conf < 0.5?**
- YES → Red arrow to "Pending"
- NO → Down to Gate 3

**Gate 3**:
- Diamond icon
- **Trust Score < 0.65?**
- YES → Red arrow to "Pending"
- NO → Down to Gate 4

**Gate 4**:
- Diamond icon
- **EXIF GPS Gap > 0.5 km?**
- YES → Red arrow to "Pending"
- NO → Down to Gate 5

**Gate 5** (bottom - larger diamond):
- Diamond icon with star
- **TypeSafe Confidence?**
- Three branches:
  - **≥ 0.70** → Green arrow to "Published (Auto)" (right)
  - **0.40-0.69** → Yellow arrow to "Published (Monitor)"
  - **< 0.40** → Red arrow to "Pending"

**Two outcome boxes on right**:
1. **Published** (green rounded box with check icon)
2. **Pending** (amber rounded box with warning icon)

**Arrow**: Large green/amber split arrow pointing right labeled "DECIDE" → to Layer 4

---

### LAYER 4: ACTION (Right side - Light Green background for Published, Light Amber for Pending)
**Title: "Automated Execution"**

Create **two parallel action paths**:

#### **Path A: PUBLISHED** (Green zone - top half)
**Icon**: Checkmark shield
**Actions** (vertical stack of rounded boxes):
1. ✅ **Status = published** (database icon)
2. 📝 **Haiku 4.5: Generate summary** (text icon)
3. 🚨 **IF severity=high → Alert operator** (bell icon)
4. 🔁 **IF nearby ≥ 3 → Recurring follow-up** (loop icon)
5. 📋 **Write trace JSON** (file icon)

#### **Path B: PENDING** (Amber zone - bottom half)
**Icon**: Warning triangle
**Actions** (vertical stack of rounded boxes):
1. ⏸ **Status = pending_verification** (database icon)
2. 👁 **Queue to IQE dashboard** (eye icon + "Human Review")
3. 💬 **Show review_reason** (speech bubble icon)
4. 📋 **Write trace JSON** (file icon)

**Arrow**: Large arrow pointing right labeled "ACT" → to Layer 5

---

### LAYER 5: OUTPUT (Far right - White background with subtle gradient)
**Title: "Real-Time Results"**

Create **3 output destinations** (rounded boxes with icons):

**Box 1** (top):
- Icon: Map pin
- **Public Map**
- "Real-time updates"
- "Published reports only"
- Color: Teal accent

**Box 2** (middle):
- Icon: Dashboard gauge
- **Operator Dashboard**
- "Alerts + Follow-ups"
- "IQE Queue (pending cases)"
- Color: Orange accent

**Box 3** (bottom):
- Icon: Document/file
- **Audit Trail**
- "Trace JSON per observation"
- "`docs/agentic-traces/*.json`"
- Color: Purple accent

---

### BOTTOM BANNER (Full width - Dark Gray background, White text)
**Title: "Key Metrics"**

Create **4 metric cards** (horizontal row):

**Card 1**:
- Icon: Rocket
- **100×**
- "Scalability"
- "1 operator = 1000 reports/day"

**Card 2**:
- Icon: Clock
- **2 sec**
- "Response Time"
- "High-confidence auto-publish"

**Card 3**:
- Icon: Target
- **80%**
- "Auto-Processed"
- "20% human review"

**Card 4**:
- Icon: Shield check
- **100%**
- "Auditability"
- "Full trace per observation"

---

### TOP HEADER (Full width - Teal gradient background, White text)
**Left side**:
- Logo placeholder (circular)
- **Mat(a)Mu**
- "Agentic Vision System"

**Right side**:
- **OpenCV AI Competition 2026**
- "Blaz Labs Track"

---

## Additional Visual Elements:

1. **Flow Arrows**: 
   - Use animated-style dashed lines with arrow heads
   - Color-code by stage (cyan → orange → yellow → green/amber)
   - Add small labels on arrows ("CAPTURE", "PERCEIVE", "DECIDE", "ACT")

2. **Background Layers**:
   - Each layer (1-5) should have subtle vertical color bands
   - Add very light vertical gridlines for structure

3. **Highlight Boxes**:
   - Add a **glowing highlight box** around Gate 5 (TypeSafe) labeled "AI Confidence Gate"
   - Add a **badge** on IQE Queue labeled "Human Oversight"

4. **Inset Diagram** (bottom-right corner, small):
   - Mini comparison chart:
     - Traditional: "Human → 10 reports/day"
     - Mat(a)Mu: "AI+Human → 1000 reports/day"
   - Bar chart visualization

5. **Technology Stack Badge** (top-right corner):
   - Small rounded box listing:
     - OpenCV 5.0
     - Django 5.1
     - React 19
     - Bedrock Claude
     - TypeSafe AI
     - PostGIS

---

## Text Annotations:

Add **3 callout bubbles** (speech bubble style with pointers):

**Callout 1** (pointing to Perception layer):
"Not just detection — 6 intelligence signals working together"

**Callout 2** (pointing to Gate 5):
"Confidence-calibrated routing: High conf → auto, Low conf → human"

**Callout 3** (pointing to Trace JSON):
"Every decision logged for regulatory compliance"

---

## Dimensions & Export:
- **Size**: 3840 × 2160 px (4K resolution for presentation)
- **Aspect ratio**: 16:9 (horizontal landscape)
- **Format**: PNG with transparent or white background
- **DPI**: 300 for print quality

---

## Final Polish:
- Add subtle drop shadows on all boxes for depth
- Use rounded corners (12-16px radius) on all containers
- Ensure text is large enough to read at presentation scale
- Include version number "v1.0" in bottom-right
- Add small "Perception → Decision → Action" tagline under main title

---

## Example Color Palette (HEX codes):
- Teal: #00CED1
- Orange: #FF8C00
- Green: #32CD32
- Amber: #FFB84D
- Purple: #9370DB
- Red: #DC143C
- Dark Gray: #2C3E50
- Light Gray: #F5F5F5
- White: #FFFFFF

Generate this as a **single comprehensive diagram** that tells the complete story of Mat(a)Mu's agentic vision system from citizen input to automated action, emphasizing the intelligence, automation, and safety of the system.
