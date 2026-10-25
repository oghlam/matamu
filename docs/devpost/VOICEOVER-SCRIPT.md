# Mat(a)Mu — Video Voiceover Script (5-Minute Run of Show)

*Voice Character: Deep, calm, natural male voice. Conversational yet professional, unhurried pacing.*

---

## 0:00–0:30 — Problem & Motivation
**Visual:** A damaged road photo transitioning to a montage of commuting hazards.
**Narration:**
> "Behind every cracked asphalt and hidden pothole lies a sobering reality. For too long, citizen reports on road damage have been met with bureaucratic silence—leaving communities vulnerable to delays, severe injuries, and tragic fatalities. When pleas for safety go unanswered, citizens are forced onto a frustrating realization: real attention only comes when a tragedy trends online. Desperate times demand a transparent, verifiable voice. It is time to replace 'No Viral, No Justice' with systematic, undeniable truth. Welcome to MATAMU—which literally means 'your eyes'."

---

## 0:30–1:00 — Product Experience (Citizen PWA)
**Visual:** Mat(a)Mu Citizen PWA interface on mobile, showing live location and capture screen.
**Narration:**
> "Meet MATAMU. Instead of a free-form complaint, a citizen captures road conditions directly with their phone. The PWA automatically grabs live location, bakes in a cryptographic GPS watermark for mobile-safe verification, and packages everything into a clean, structured observation."

---

## 1:00–2:00 — OpenCV 5 Pipeline & Evidence Integrity
**Visual:** Submission processing, detection bounding box overlay, IQE trust score badge, SFace privacy face blur, and GPS watermark.
**Narration:**
> "Once submitted, the image hits our OpenCV 5 and YOLOv11n pipeline. We run local defect detection, compute an Image Quality and Evidence trust score, and apply SFace facial blurring to protect bystander privacy. The system knows instantly whether the evidence is sharp, authentic, and properly geolocated."

---

## 2:00–3:00 — Agentic Decision & IQE Review Queue
**Visual:** Switching between two report outcomes (`published` vs `pending_verification`), showing the IQE Trust Score badge, and demonstrating operator intervention for ambiguous reports.
**Narration:**
> "This is where the agentic loop takes over. Based on perception signals and strict quality gates, high-confidence reports automatically route to published status. But what happens when evidence is unclear or trust scores fall below the threshold? That’s where our IQE Trust Score Queue comes in. Ambiguous submissions are routed to pending verification, requiring deliberate human-in-the-loop intervention. Operators can inspect the exact reasoning chain, evaluate the evidence, and make the final call—ensuring absolute accountability before any action is taken."

---

## 3:00–4:00 — Public Map & Operator Dashboard
**Visual:** Public map view with selected report details, severity, and recurrence metrics, then switching to the Django operator dashboard.
**Narration:**
> "On the public side, citizens see an interactive map with verified severity and recurrence data. For municipal operators, the dashboard provides a structured queue for IQE review, role-aware controls, automated alerts, and actionable follow-up tracking."

---

## 4:00–4:30 — Evaluation & Robustness
**Visual:** Showing automated test results (46/46 integration, 4/4 agentic scenarios), six-photo Sidoarjo test run, and failure case documentation.
**Narration:**
> "MATAMU isn't just a prototype. Our automated test suite logs 46 out of 46 passing integration tests and 4 out of 4 agentic scenarios, backed by our Sidoarjo corridor evaluation set showing an average trust score of 0.805, alongside fully documented edge-case limitations."

---

## 4:30–5:00 — Impact & Closing
**Visual:** Closing title screen with GitHub repository, live endpoint URLs, and project summary.
**Narration:**
> "MATAMU makes road conditions visible, verified, and actionable—without ever replacing official municipal engineering judgment. Thank you for watching."
