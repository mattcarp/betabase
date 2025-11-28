# RLHF Demo - Quick Reference Card

## 🎯 Setup (5 minutes)

```bash
# 1. Apply schema (if not already done)
./scripts/apply-rlhf-schema.sh
# OR paste supabase/migrations/007_rlhf_feedback_schema.sql into Supabase SQL Editor

# 2. Seed demo data
npx tsx scripts/seed-enhanced-rlhf-demo.ts

# 3. Start server
npm run dev

# 4. Open browser
open http://localhost:3000
```

---

## 📋 Demo Flow (5-7 minutes)

| Time | Action | Key Message |
|------|--------|-------------|
| 0:00 | Navigate to **Curate** tab | "This is where knowledge curation happens" |
| 0:30 | Show **Accuracy Trend** chart | "85% → 96% improvement from curator feedback" |
| 1:15 | Expand **"What authentication method..."** | "Security lead corrected JWT → AWS Cognito" |
| 2:45 | Show **document relevance markers** | "Green check = relevant, Red X = not helpful" |
| 4:00 | Expand **"AOMA v2 vs v3..."** | "Product owner enhanced incomplete answer" |
| 5:15 | Show **multi-tenant** examples | "AOMA vs Beta Base - isolated knowledge" |
| 6:00 | Return to **charts** | "Upward trend = systematic curation working" |
| 6:30 | **Close** | "Human expertise + AI = something greater" |

---

## 💬 Key Talking Points

### Opening
> "The Beta Base isn't just another chatbot—it's a **learning system** where domain experts curate and refine AI knowledge."

### During Demo
> "Every correction, every validation, every document relevance marker makes the system smarter for everyone in the organization."

### Multi-Tenant
> "Feedback for AOMA doesn't pollute knowledge for other applications. This is **enterprise-grade knowledge management**."

### Closing
> "This is how we achieve **enterprise-grade accuracy** for mission-critical applications."

---

## 🎤 Q&A Responses

**Q: How is this different from ChatGPT?**
> "ChatGPT is trained on the entire internet. The Beta Base is trained on YOUR organization's knowledge, with YOUR domain experts curating the responses."

**Q: How much time does curation take?**
> "Most feedback takes 10-30 seconds. A curator can review 20-30 interactions per hour. But the impact is multiplicative—one correction improves hundreds of future queries."

**Q: Can we automate this?**
> "Some validation can be automated, but **human judgment is irreplaceable** for nuanced corrections and strategic priorities. That's why we call it Human-in-the-Loop."

---

## 🎨 What to Show

### Charts (Top of page)
- **Left:** Accuracy Trend (green line going up)
- **Right:** Feedback Distribution (bar chart)

### Stats Cards
- **Pending Review:** Shows active curation queue
- **Submitted:** Completed feedback count
- **Avg Rating:** Quality metric

### Feedback Cards
1. **hitl-demo-correction-1** - Authentication correction
2. **hitl-demo-validation-2** - RLHF loop explanation (5 stars)
3. **hitl-demo-aoma-arch-3** - AOMA deployment diagram
4. **hitl-demo-enhancement-4** - AOMA v3 migration enhancement
5. **hitl-demo-no-context-5** - Missing SLA info
6. **hitl-demo-learned-6** - Multi-tenant isolation (perfect)

### Document Relevance Markers
- Expand any card
- Show **green checkmarks** on relevant docs
- Show **red X** on irrelevant docs
- Explain: "This trains the system to prioritize the right sources"

---

## ⚡ Live Interaction (Optional)

If time permits:
1. Expand a feedback card
2. Click **thumbs up** or **thumbs down**
3. Add a **star rating** (1-5)
4. Type in **detailed correction** text area
5. Click **Submit**

> "The interface is designed for speed—curators can provide feedback in seconds."

---

## 🚨 Troubleshooting

### Charts not rendering
- Refresh page
- Check browser console (F12)

### No feedback items
```bash
npx tsx scripts/seed-enhanced-rlhf-demo.ts
```

### Database connection error
- Check `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

---

## 📊 Success Metrics to Highlight

- **96% accuracy** (up from 85%)
- **145 helpful responses** validated
- **32 corrections** applied
- **18 detailed edits** from curators
- **Multi-tenant** knowledge isolation

---

## 🎬 Final Checklist

- [ ] Database schema applied
- [ ] Demo data seeded (6 examples)
- [ ] Server running (`npm run dev`)
- [ ] Curate tab loads without errors
- [ ] Charts render correctly
- [ ] All 6 feedback cards visible
- [ ] Document relevance markers display
- [ ] Practiced demo flow (5-7 min)
- [ ] Reviewed Q&A responses

---

**Print this card and keep it visible during the demo!**
