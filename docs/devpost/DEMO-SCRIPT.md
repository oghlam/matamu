# Mat(a)Mu — Five-Minute Demo Script

## 0:00–0:30 — Problem

Show a damaged road image and introduce the problem: citizens see road hazards first, but fragmented reports are difficult to verify, prioritize, and follow up.

## 0:30–1:00 — Product

Show the Mat(a)Mu PWA. Explain that a citizen captures a road condition with live location. The system creates a structured, privacy-safe observation instead of a free-form complaint.

## 1:00–2:00 — OpenCV 5 pipeline

Submit one image and show the detection overlay/result. Call out OpenCV 5 DNN + YOLOv11n, IQE trust scoring, and YuNet/SFace face blur. Show the GPS watermark as the mobile-safe evidence mechanism.

## 2:00–3:00 — Agentic decision

Show two outcomes:

- a high-confidence report becomes `published`;
- a low-confidence or poor-quality report becomes `pending_verification`.

Open the agentic trace and point to the perception signals, gate decision, reason, and resulting action.

## 3:00–4:00 — Public and operator views

Show the public map, selected evidence, severity, and recurrence. Switch to the operator dashboard and show IQE review, alerts, follow-up, and role-aware controls.

## 4:00–4:30 — Evaluation

Show the 46/46 integration result, 4/4 agentic scenarios, six-photo Sidoarjo evaluation, average trust score 0.805, and documented failure cases.

## 4:30–5:00 — Impact and limitations

Close with the civic value: make road conditions visible and actionable without replacing official engineering judgment. State the limits honestly: small local evaluation set, nano-model recall limits, and human review for ambiguous evidence.
