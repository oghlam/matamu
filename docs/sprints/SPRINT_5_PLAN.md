# Mat(a)Mu — Sprint 5 Plan (Final Sprint)

> **Updated: 24 September 2026**  
> OpenCV AI Competition 2026 · Blaz Labs  
> Final Submission Deadline: **26 October 2026, 23:59 Pacific Time**  
> Days Remaining: **32 days**

---

## 🎯 Sprint 5 Objective

**Finalize submission deliverables** for OpenCV AI Competition 2026.

**Status entering Sprint 5:**
- ✅ Sprint 0-4 DONE (CV pipeline, backend, PWA, agentic, integration)
- ✅ Tests: 42/42 integration tests PASS, 4/4 agentic scenarios PASS
- ✅ Documentation: WHY-AGENTIC.md, technical report draft, architecture diagram ready
- ✅ GitHub: Professional presentation with badges, README, comprehensive docs
- ✅ Code: Production-ready (SQLite local, S3 fallback to `/media/`, mock LLM mode)

**What remains:**
1. Google OAuth real credentials (dev bypass mode currently active)
2. Demo video (≤5 minutes)
3. Technical report final polish
4. Devpost submission
5. (Optional) EC2 deployment

---

## 📅 Sprint 5 Timeline (27 Sep - 26 Oct 2026)

### Week 1: 27 Sep - 3 Oct (Polish & OAuth)
**Goal:** Remove dev mode, finalize authentication

| Task | Owner | Estimate | Priority |
|------|-------|----------|----------|
| Create Google OAuth Client ID | You | 10 min | HIGH |
| Update backend `.env`: `GOOGLE_CLIENT_ID` | You | 2 min | HIGH |
| Update PWA `.env`: `VITE_GOOGLE_CLIENT_ID` | You | 2 min | HIGH |
| Set `BYPASS_AUTH=0` (production mode) | You | 1 min | HIGH |
| Test OAuth flow: login → capture → logout | You | 15 min | HIGH |
| Verify PWA "Masuk (Mode Dev)" button hidden | You | 2 min | MEDIUM |
| Test `/admin/` login redirect works | You | 5 min | MEDIUM |

**Total effort:** ~40 minutes

---

### Week 2-3: 4 Oct - 17 Oct (Video Production)
**Goal:** Create ≤5 minute demo video

#### Pre-Production (4-6 Oct)
| Task | Owner | Estimate | Priority |
|------|-------|----------|----------|
| Write video script (narration draft) | AI/You | 2 hours | HIGH |
| Plan screen recording sequence | You | 1 hour | HIGH |
| Prepare demo data (clean DB, 6 Sidoarjo photos only) | You | 30 min | HIGH |
| Test recording setup (OBS Studio / ScreenFlow) | You | 30 min | MEDIUM |

#### Production (7-10 Oct)
| Task | Owner | Estimate | Priority |
|------|-------|----------|----------|
| Record dashboard walkthrough (Overview, Reports, IQE, Agentic) | You | 1 hour | HIGH |
| Record PWA walkthrough (Capture, My Reports, Public Map) | You | 1 hour | HIGH |
| Record agentic trace demo (show decision routing) | You | 30 min | HIGH |
| Record 3D map + traffic demo (PowerUp TomTom) | You | 30 min | MEDIUM |
| Total raw footage | — | ~3 hours | — |

#### Post-Production (11-14 Oct)
| Task | Owner | Estimate | Priority |
|------|-------|----------|----------|
| Edit video (cut, transitions, zoom highlights) | You | 3 hours | HIGH |
| Generate voice-over (Gemini 3.1 Flash TTS via LiteLLM) | AI | 30 min | MEDIUM |
| *OR* Record manual narration (English) | You | 1 hour | MEDIUM |
| Add captions/subtitles (English) | You | 1 hour | MEDIUM |
| Add background music (royalty-free) | You | 30 min | LOW |
| Export final (1080p MP4, ≤5 min, ≤100MB) | You | 30 min | HIGH |

**Total effort:** ~8-10 hours

**Video Structure (5 min):**
```
0:00-0:30  Intro (problem statement: manual review bottleneck)
0:30-1:30  Agentic Vision explanation (perception → decision → action)
1:30-2:30  Dashboard demo (Overview map, IQE queue, Agentic traces)
2:30-3:30  PWA demo (Capture flow, My Reports, Public Map 3D)
3:30-4:30  Technical highlights (6 signals, 5 gates, trace JSON)
4:30-5:00  Impact & conclusion (100× scalability, competition alignment)
```

---

### Week 3-4: 14 Oct - 20 Oct (Technical Report)
**Goal:** Finalize technical report for submission

| Task | Owner | Estimate | Priority |
|------|-------|----------|----------|
| Review `docs/technical-report-draft.md` | You | 30 min | HIGH |
| Add architecture diagram image | You | 10 min | HIGH |
| Add agentic trace screenshot | You | 10 min | MEDIUM |
| Add dashboard/PWA screenshots (4-6 images) | You | 30 min | MEDIUM |
| Polish Section 4 (Agentic Vision Loop) | AI | 1 hour | HIGH |
| Polish Section 7 (Limitations & Failure Cases) | AI | 1 hour | MEDIUM |
| Add Section 9 (Competition Criteria Alignment) | AI | 1 hour | HIGH |
| Proofread (grammar, formatting, consistency) | You | 1 hour | MEDIUM |
| Export PDF (professional formatting) | You | 30 min | HIGH |
| Final review checklist (all competition requirements) | You | 30 min | HIGH |

**Total effort:** ~6 hours

**Technical Report Structure (final):**
```
1. Executive Summary (½ page)
2. Problem Statement (½ page)
3. Technical Stack (1 page)
4. Agentic Vision Loop (2 pages) ← Deep-dive with diagram
5. AWS Deployment (½ page)
6. Evaluation (1 page) ← Tests, metrics, benchmark
7. Limitations & Failure Cases (1 page) ← Honest assessment
8. Responsible Use (½ page) ← Privacy, human-in-loop, audit
9. Competition Criteria Alignment (1 page) ← Map to scoring rubric
10. Conclusion (½ page)

Total: ~8-10 pages
Appendix: Code snippets, trace JSON examples
```

---

### Week 5: 21 Oct - 26 Oct (Submission & Buffer)
**Goal:** Submit to Devpost before deadline

#### 21-23 Oct: Devpost Preparation
| Task | Owner | Estimate | Priority |
|------|-------|----------|----------|
| Create Devpost project page | You | 30 min | HIGH |
| Write project description (500 words) | AI | 1 hour | HIGH |
| Upload demo video (YouTube unlisted OR Devpost direct) | You | 15 min | HIGH |
| Upload technical report PDF | You | 5 min | HIGH |
| Add GitHub repo link | You | 2 min | HIGH |
| Add screenshots (dashboard, PWA, diagram) | You | 30 min | MEDIUM |
| Add team member info | You | 10 min | MEDIUM |
| Add tech stack tags | You | 10 min | MEDIUM |
| Review submission checklist | You | 30 min | HIGH |

**Total effort:** ~3-4 hours

#### 24-25 Oct: Final Review
| Task | Owner | Estimate | Priority |
|------|-------|----------|----------|
| Test all links (GitHub, video, docs) | You | 15 min | HIGH |
| Verify video plays correctly | You | 10 min | HIGH |
| Verify PDF downloads correctly | You | 5 min | HIGH |
| Run final integration tests (42/42 PASS) | You | 10 min | HIGH |
| Run agentic scenario tests (4/4 PASS) | You | 10 min | HIGH |
| Check README.md renders correctly on GitHub | You | 5 min | MEDIUM |
| Check WHY-AGENTIC.md renders correctly | You | 5 min | MEDIUM |
| Backup entire repo (ZIP download) | You | 5 min | MEDIUM |

**Total effort:** ~1 hour

#### 26 Oct: Submission Day
| Time (PT) | Task |
|-----------|------|
| 09:00 | Wake up, coffee, final review |
| 10:00 | Submit to Devpost (first submission) |
| 12:00 | Review submission on Devpost (judge's view) |
| 14:00 | Fix any issues (if needed) |
| 18:00 | Final submission (if updates needed) |
| 23:00 | Deadline buffer (1 hour before cutoff) |
| **23:59** | **DEADLINE** |

**Buffer:** Submit by 18:00 PT (6 hours before deadline) to allow for emergency fixes.

---

## 🎬 Video Production Details

### Tools Recommendation
- **Screen recording**: OBS Studio (free, Windows/Mac) OR ScreenFlow (Mac, paid)
- **Video editing**: DaVinci Resolve (free) OR Adobe Premiere Pro
- **Voice-over**: 
  - Option A: Gemini 3.1 Flash TTS via LiteLLM (automated, English accent)
  - Option B: Your own voice (more authentic, requires microphone)
- **Captions**: YouTube auto-captions OR Kapwing (free online)
- **Music**: YouTube Audio Library (royalty-free)

### Video Recording Checklist
- [ ] Close all unnecessary apps (clean desktop)
- [ ] Clear browser history/cookies (fresh session)
- [ ] Disable notifications (Windows/Mac Do Not Disturb)
- [ ] Use incognito/private window for demo
- [ ] Set browser zoom to 100%
- [ ] Prepare 6 demo photos (Sidoarjo Lingkar Timur)
- [ ] Clean database (only id 3-8 observations)
- [ ] Test GPS mock if needed (or real GPS)
- [ ] Practice narration script 2-3 times
- [ ] Record in 1080p (1920×1080) minimum
- [ ] Use cursor highlighting (OBS Studio plugin)

### Video Script Draft (5 min)

**[0:00-0:30] Hook + Problem**
> "Road damage costs cities billions annually. Traditional monitoring relies on manual surveys—slow, expensive, and unscalable. What if citizens could report damage instantly, and AI could process 1000 reports per day with one operator? Meet Mat(a)Mu."

**[0:30-1:30] Solution: Agentic Vision**
> "Mat(a)Mu is not just a pothole detector. It's an agentic vision system. [Show diagram] When a citizen submits a photo, six intelligence signals activate: YOLO detects damage, IQE validates quality, SFace protects privacy, TypeSafe AI reasons about severity, Bedrock provides deep analysis, and PostGIS detects patterns. The system then decides autonomously: high-confidence reports auto-publish in 2 seconds, edge cases route to human review. This isn't passive AI—it's perception, decision, and action."

**[1:30-2:30] Dashboard Demo**
> "Operators see a live map with real-time updates. [Click Overview] Here's a published report: pothole, high severity, trust score 88%. [Click IQE Queue] Low-confidence cases queue here with AI reasoning—'low light', 'EXIF mismatch'. [Click Agentic Traces] Every decision is logged: TypeSafe confidence 0.92, auto-published. Full transparency."

**[2:30-3:30] Citizen App Demo**
> "Citizens use a PWA. [Open /capture] Live camera with GPS lock. [Take photo] Submit. [Show result] Verified instantly. [Open /my-reports] Track your reports. [Open public map] 3D terrain, live traffic, share links. Privacy-first: faces auto-blurred before storage."

**[3:30-4:30] Technical Deep-Dive**
> "Under the hood: OpenCV 5 DNN runs YOLOv11n. Five confidence gates route decisions. TypeSafe AI asks structured questions. Bedrock Sonnet handles complex cases. PostGIS detects recurring damage. Every observation gets a trace JSON—full auditability for regulatory compliance."

**[4:30-5:00] Impact + Conclusion**
> "Result: 100× scalability. One operator handles 1000 reports per day instead of 10. 80% auto-processed, 20% human-reviewed. 24/7 operation, no bottleneck. This is AI that works in the real world. Mat(a)Mu: Agentic vision for road safety."

---

## 📋 Technical Report Checklist

### Required Sections (OpenCV Competition)
- [x] Executive Summary
- [x] Problem Statement
- [x] Technical Approach
- [x] OpenCV 5 Usage (DNN module for YOLO + SFace)
- [x] Cloud Integration (AWS Bedrock, S3)
- [x] Evaluation & Results
- [x] Limitations & Failure Cases
- [x] Responsible AI Considerations
- [ ] Competition Criteria Alignment (NEW - add this)
- [x] Conclusion

### Visual Assets to Include
- [ ] Architecture diagram (already generated)
- [ ] Agentic flow diagram (from `docs/architecture/agentic-flow.md`)
- [ ] Dashboard screenshot (Overview with map)
- [ ] IQE Queue screenshot (with review_reason visible)
- [ ] Agentic Traces page screenshot (routing table)
- [ ] PWA Capture screenshot (live camera + GPS banner)
- [ ] Public Map screenshot (3D terrain + traffic)
- [ ] Trace JSON example (formatted, syntax-highlighted)

### Technical Details to Emphasize
1. **OpenCV 5 Core Usage:**
   - `cv2.dnn.readNetFromONNX()` for YOLO inference
   - `cv2.dnn.blobFromImage()` for preprocessing
   - SFace face detection via OpenCV DNN
   - Laplacian variance for blur detection
   - All CV processing in `matamu-cv/` module

2. **Agentic Innovation:**
   - 6 perception signals (not single model)
   - 5-gate confidence routing (not binary threshold)
   - Trace JSON per observation (full audit trail)
   - Human-in-loop for edge cases (IQE queue)

3. **Production Readiness:**
   - 100× scalability (1 operator = 1000 reports/day)
   - 24/7 operation (overnight auto-processing)
   - Privacy-by-design (SFace auto-blur)
   - Regulatory compliance (audit trail)

---

## 🚀 Optional: EC2 Deployment

**Status:** Script ready (`docs/deployment/ec2-setup.sh`), deployment optional.

**Decision:** Deploy ONLY if:
- [ ] You want live demo URL for judges (not required—localhost OK)
- [ ] You have time after video + report done (don't risk deadline)
- [ ] You're comfortable with AWS costs (~$10-20/month for t2.small + RDS)

**Alternative:** Demo localhost in video, mention "deployment-ready" in report.

**If deploying:**
1. Provision EC2 t2.small (Ubuntu 22.04)
2. Run `ec2-setup.sh` script
3. Set `USE_POSTGIS=1` in `.env`
4. Point DNS (optional) or use EC2 public IP
5. Update README with live URL
6. Test end-to-end from fresh browser

**Estimate:** 2-3 hours (if no issues)

**Risk:** AWS charges, debugging time, potential downtime during submission week.

**Recommendation:** Skip unless you finish video + report by Oct 18.

---

## 📊 Sprint 5 Effort Summary

| Activity | Time Estimate | Deadline |
|----------|---------------|----------|
| Google OAuth setup | 40 min | Oct 3 |
| Video production | 8-10 hours | Oct 14 |
| Technical report | 6 hours | Oct 20 |
| Devpost submission | 3-4 hours | Oct 23 |
| Final review & buffer | 1 hour | Oct 25 |
| **Total** | **~20 hours** | **Oct 26** |

**Your availability:** 32 days remaining = ~45 minutes/day average.

**Suggested schedule:**
- **Week 1 (Sep 27-Oct 3):** OAuth setup (1 session, 1 hour total)
- **Week 2-3 (Oct 4-17):** Video (3-4 sessions, 2-3 hours each)
- **Week 4 (Oct 14-20):** Report (2-3 sessions, 2 hours each)
- **Week 5 (Oct 21-25):** Submission (1-2 sessions, 2 hours each)
- **Oct 26:** Submit + buffer (final day)

---

## ✅ Sprint 5 Definition of Done

### Video (≤5 min)
- [ ] Shows agentic vision concept clearly
- [ ] Demonstrates dashboard (Overview, IQE, Agentic Traces)
- [ ] Demonstrates PWA (Capture, My Reports, Public Map)
- [ ] Highlights technical innovation (6 signals, 5 gates)
- [ ] Emphasizes production readiness (scalability, audit trail)
- [ ] English voice-over (Gemini TTS or manual)
- [ ] Captions/subtitles included
- [ ] Exported 1080p MP4, ≤100MB
- [ ] Uploaded to YouTube (unlisted) or Devpost

### Technical Report (8-10 pages PDF)
- [ ] All required sections present
- [ ] Architecture diagram embedded
- [ ] Screenshots (dashboard, PWA, traces) included
- [ ] OpenCV 5 usage clearly documented
- [ ] Agentic vision explained with examples
- [ ] Evaluation metrics (42/42 tests, 4/4 scenarios)
- [ ] Limitations & failure cases documented
- [ ] Competition criteria alignment section
- [ ] Professional formatting (headers, page numbers, ToC)
- [ ] Proofread (no typos, consistent terminology)

### Devpost Submission
- [ ] Project page created
- [ ] Video uploaded/linked
- [ ] Technical report uploaded
- [ ] GitHub repo linked
- [ ] Screenshots uploaded (4-6 images)
- [ ] Project description (500 words)
- [ ] Tech stack tags complete
- [ ] Team member info complete
- [ ] Submitted before Oct 26, 23:59 PT

### Code Quality
- [ ] OAuth real credentials (not dev bypass)
- [ ] Integration tests: 42/42 PASS
- [ ] Agentic scenarios: 4/4 PASS
- [ ] No `console.log()` / debug prints in production code
- [ ] README.md up-to-date
- [ ] WHY-AGENTIC.md finalized
- [ ] All docs reflect final state

---

## 🎯 Success Criteria

**Minimum Viable Submission:**
- ✅ Video demo ≤5 min (shows system working)
- ✅ Technical report 8-10 pages (covers all requirements)
- ✅ GitHub repo public (clean, documented)
- ✅ Devpost submitted before deadline

**Competitive Submission:**
- ✅ Everything above PLUS:
- ✅ Professional video production (editing, voice-over, captions)
- ✅ Comprehensive technical report (diagrams, screenshots, examples)
- ✅ GitHub presentation-ready (badges, WHY-AGENTIC.md, architecture diagram)
- ✅ Live demo (optional — localhost OK)

**Award-Winning Submission:**
- ✅ Everything above PLUS:
- ✅ Exceptional video storytelling (hook, narrative arc, impact)
- ✅ Deep technical documentation (trace JSON examples, failure cases, benchmarks)
- ✅ Unique innovation clearly articulated (agentic vision = differentiator)
- ✅ Production-ready evidence (tests, audit trail, responsible AI)

---

## 📞 Sprint 5 Support

**If you need help:**
- Video script writing → Ask AI for draft
- Technical report Section 9 (competition alignment) → Ask AI to write
- Devpost description (500 words) → Ask AI to draft
- OAuth debugging → Share error logs
- Final review → Share submission links for check

**Your role:**
- Record video (screen + voice)
- Review/edit AI-generated content
- Make final decisions (design, copy, timing)
- Submit to Devpost

**AI role:**
- Write scripts, docs, descriptions
- Generate diagrams, examples
- Technical deep-dives
- Proofreading

---

## 🏁 Final Checklist (Oct 26, 2026)

**Morning (09:00-12:00 PT):**
- [ ] Coffee ☕
- [ ] Run integration tests one last time
- [ ] Check GitHub repo loads correctly
- [ ] Check video plays on Devpost
- [ ] Check PDF downloads correctly
- [ ] Submit to Devpost (first attempt)

**Afternoon (12:00-18:00 PT):**
- [ ] Review submission as judge would see it
- [ ] Fix any broken links/images
- [ ] Re-submit if needed (Devpost allows updates)
- [ ] Screenshot confirmation email

**Evening (18:00-23:00 PT):**
- [ ] Final submission locked in
- [ ] Celebrate 🎉
- [ ] Sleep (you earned it)

---

**Good luck! You've built something genuinely innovative. Now it's time to show the world.** 🚀
