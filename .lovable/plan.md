## Plan — Modernize Book Parcel Page

Transform the current 3-step booking into a richer, tech-forward 5-step flow that reflects modern logistics demands (AI prediction, IoT, sustainability, contactless delivery, smart insurance).

### New Step Structure
```
1. Addresses & Contacts   →   2. Parcel Details   →   3. Smart Options   →   4. AI Insights   →   5. Review & Confirm
```

### Step 1 — Addresses & Contacts
- Sender block: full name, phone, source address (with AI-suggested pincode chip)
- Receiver block: full name, phone, destination address
- "Validate with AI" (existing) → expands to show: matched origin/destination post offices, route distance (km), estimated transit days, serviceability badge

### Step 2 — Parcel Details
- Weight (kg) + auto-calculated volumetric weight
- Dimensions: L × W × H (cm) in a 3-input row
- Parcel type: Standard / Express / Same-Day / Fragile / Document
- Contents category dropdown (Electronics, Documents, Apparel, Food, Medicine, Other) with an **AI Auto-detect** chip that reads the description
- Declared value (₹) for insurance
- Description textarea

### Step 3 — Smart Options (NEW)
A grid of toggleable cards, each with icon + short description:
- **Real-time GPS Tracking** (default ON, free)
- **IoT Tamper & Temperature Sensor** (+₹40) — for fragile/medicine
- **Contactless Delivery** (free)
- **OTP-secured Handover** (default ON)
- **Eco-Friendly Packaging** (+₹15) — shows leaf icon
- **Carbon-Neutral Shipping** (+₹20) — offsets emissions
- **Signature Required** (+₹10)
- **Priority Handling** (+₹50)

Delivery preference section:
- Preferred time slot: Morning / Afternoon / Evening / Anytime (pill selector)
- Drop-off instructions textarea (e.g., "Leave with security")

Insurance tier selector (3 cards): Basic (free, up to ₹500) / Standard (+₹25, up to ₹5,000) / Premium (+₹75, up to ₹50,000)

### Step 4 — AI Insights (NEW)
A simulated AI panel that "analyzes" the shipment for ~1s, then reveals:
- **Predicted Delivery Window** with confidence % (e.g., "Feb 28 – Mar 1 · 94% confident")
- **Smart Route Preview** — 3-hop chip strip: Pune GPO → Nagpur Hub → Delhi GPO
- **Risk Score** — Low/Medium/High with reasoning chips (weather OK, route stable)
- **Carbon Footprint** — kg CO₂ estimate with bar comparison (your shipment vs avg)
- **Packaging Recommendation** — AI suggests box size based on dimensions
- **Price Optimization tip** — e.g., "Switch to Standard and save ₹40"

### Step 5 — Review & Confirm
- Existing summary card, expanded with new fields (dimensions, declared value, smart add-ons list, insurance tier, time slot)
- **Live cost breakdown**: base fare, weight charge, add-ons (itemized), insurance, GST 18%, total
- Terms checkbox: "I agree to T&Cs and confirm contents are legal"
- Proceed to Payment button (existing route preserved)

### Visual / Interaction Details
- Keep current dark glassmorphic style, orange-amber gradient accents, framer-motion step transitions
- Step indicator extended to 5 dots with same animation pattern
- New icons from lucide-react: `Ruler`, `Shield`, `Leaf`, `Radio`, `Clock`, `Route`, `TrendingDown`, `User`, `Phone`, `Boxes`, `IndianRupee`
- All toggle/option cards use the existing border `border-white/[0.07]` + active orange ring pattern
- AI Insights panel uses staggered reveal animation (each insight fades in 150ms apart)

### Files to Modify
- `src/pages/user/BookParcel.tsx` — full rewrite of the form body, keep DashboardLayout shell, navigation, and `navigate("/user/payment")` handoff

### Out of Scope
- No changes to Payment page, OrderConfirmation, or routing
- No backend wiring (frontend-only per project memory)
- No new dependencies (uses existing shadcn + lucide + framer-motion)
