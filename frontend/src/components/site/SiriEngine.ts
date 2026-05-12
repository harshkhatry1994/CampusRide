// ─── Siri AI Engine v2 — Real Data + Memory ──────────────────────
// Fetches live bike data from the CampusRide backend API.

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ─── Types ────────────────────────────────────────────────────────
export type QuickReply = { label: string; value: string };

export type SiriResponse = {
  text: string;
  quickReplies?: QuickReply[];
  bikeCards?: ApiBike[];
  bookingSummary?: BookingSummary | null;
};

export interface ApiBike {
  _id: string;
  name: string;
  brand: string;
  model: string;
  category: string;
  pricePerHour: number;
  pricePerDay: number;
  mileage: number;
  fuelType: string;
  rating: number;
  available: boolean;
  imageUrl: string;
  description: string;
  engineCC?: number;
  color?: string;
  helmetIncluded?: boolean;
  securityDeposit?: number;
  pickupLocation?: string;
  topSpeed?: number;
  features?: string[];
}

export interface BookingSummary {
  bikeName: string;
  pricePerDay: number;
  days: number;
  total: number;
  pickup: string;
}

// ─── Conversation memory ──────────────────────────────────────────
export interface ChatMemory {
  selectedBike: ApiBike | null;
  rentalDays: number;
  pickupLocation: string;
  budget: number | null;
  preferredCategory: string | null;
}

export function createMemory(): ChatMemory {
  return {
    selectedBike: null,
    rentalDays: 1,
    pickupLocation: "Campus Hub Main Gate",
    budget: null,
    preferredCategory: null,
  };
}

// ─── Bike data cache ──────────────────────────────────────────────
let bikeCache: ApiBike[] = [];
let lastFetch = 0;
const CACHE_TTL = 60_000; // 1 min

export async function fetchBikes(): Promise<ApiBike[]> {
  if (bikeCache.length && Date.now() - lastFetch < CACHE_TTL) return bikeCache;
  try {
    const res = await fetch(`${API}/api/bikes?limit=100`);
    const json = await res.json();
    if (json.success) {
      bikeCache = json.data.bikes || [];
      lastFetch = Date.now();
    }
  } catch {
    /* keep stale cache */
  }
  return bikeCache;
}

// ─── Intent detection ─────────────────────────────────────────────
type Intent =
  | "greeting"
  | "farewell"
  | "bike_search"
  | "booking_help"
  | "faq"
  | "invoice"
  | "booking_status"
  | "verification"
  | "select_bike"
  | "book_now"
  | "contact"
  | "unknown";

const PATTERNS: { intent: Intent; re: RegExp[] }[] = [
  {
    intent: "greeting",
    re: [/^(hi|hello|hey|hola|namaste|yo|sup)\b/i, /good\s*(morning|evening|afternoon)/i],
  },
  { intent: "farewell", re: [/^(bye|goodbye|thanks|thank|see\s*you|cya)\b/i] },
  {
    intent: "book_now",
    re: [/\bbook\s*(now|this|it)\b/i, /\brent\s*(this|it|now)\b/i, /\bi\s*want\s*to\s*book\b/i],
  },
  { intent: "select_bike", re: [/\bselect\b.*\b(bike|#?\d)/i, /\bchoose\b/i, /\boption\s*[1-3]/i] },
  {
    intent: "bike_search",
    re: [
      /\b(suggest|recommend|show|find|search|list|available|best|cheap|budget|premium|popular)\b/i,
      /under\s*₹?\d+/i,
      /\b(sports?|scooter|cruiser|street|adventure)\s*(bike)?/i,
      /\bmileage\b/i,
      /\broyal\s*enfield\b/i,
      /\bktm\b/i,
      /\btvs\b/i,
      /\bhonda\b/i,
      /\byamaha\b/i,
      /\bbajaj\b/i,
      /\bhero\b/i,
      /\bscooty\b/i,
      /\bbike/i,
      /\bcity\s*(ride|riding)\b/i,
      /\blong\s*(ride|trip)\b/i,
      /\bcouple\b/i,
      /\bsolo\b/i,
      /\bfamily\b/i,
      /\bweekend\b/i,
      /\belectric\b/i,
      /\bpetrol\b/i,
    ],
  },
  {
    intent: "booking_help",
    re: [
      /how\s*(do\s*i|to|can\s*i)\s*book/i,
      /document.*required/i,
      /pickup|drop/i,
      /booking\s*(process|step|guide)/i,
      /rental\s*duration/i,
      /pricing/i,
    ],
  },
  {
    intent: "faq",
    re: [
      /refund/i,
      /cancel/i,
      /deposit/i,
      /fuel\s*policy/i,
      /late\s*charge/i,
      /helmet/i,
      /\bpayment\s*method/i,
      /\brule/i,
      /\bpolicy/i,
    ],
  },
  { intent: "invoice", re: [/invoice/i, /payment\s*(confirm|status|detail)/i, /extra\s*charge/i] },
  {
    intent: "booking_status",
    re: [/booking\s*status/i, /track.*booking/i, /my\s*booking/i, /order\s*status/i],
  },
  { intent: "verification", re: [/selfie/i, /upload.*licen[cs]e/i, /verif/i, /camera/i, /kyc/i] },
  { intent: "contact", re: [/support|contact|help|human|agent|call|email/i] },
];

function detectIntent(input: string): Intent {
  for (const { intent, re } of PATTERNS) {
    for (const r of re) {
      if (r.test(input)) return intent;
    }
  }
  return "unknown";
}

// ─── Smart bike filtering ─────────────────────────────────────────
function filterBikes(bikes: ApiBike[], input: string, memory: ChatMemory): ApiBike[] {
  const q = input.toLowerCase();
  let result = [...bikes];

  // Budget from input
  const budgetMatch = q.match(/under\s*₹?(\d[\d,]*)/);
  if (budgetMatch) {
    const max = parseInt(budgetMatch[1].replace(/,/g, ""));
    memory.budget = max;
    result = result.filter((b) => b.pricePerDay <= max);
  } else if (memory.budget) {
    // use remembered budget only if explicitly mentioned
  }

  // Category
  if (/scoot(er|y)/i.test(q)) {
    result = result.filter((b) => b.category === "Scooter");
    memory.preferredCategory = "Scooter";
  } else if (/sport/i.test(q)) {
    result = result.filter((b) => b.category === "Sports");
    memory.preferredCategory = "Sports";
  } else if (/cruiser|long\s*(ride|trip)|touring/i.test(q)) {
    result = result.filter((b) => b.category === "Cruiser");
    memory.preferredCategory = "Cruiser";
  } else if (/street/i.test(q)) {
    result = result.filter((b) => b.category === "Street");
    memory.preferredCategory = "Street";
  } else if (/adventure/i.test(q)) {
    result = result.filter((b) => b.category === "Adventure");
    memory.preferredCategory = "Adventure";
  }

  // Brand
  const brands = ["royal enfield", "ktm", "tvs", "honda", "yamaha", "bajaj", "hero", "suzuki"];
  for (const brand of brands) {
    if (q.includes(brand)) {
      result = result.filter((b) => b.brand.toLowerCase().includes(brand));
      break;
    }
  }

  // Fuel
  if (/electric/i.test(q)) result = result.filter((b) => b.fuelType === "Electric");
  if (/petrol/i.test(q)) result = result.filter((b) => b.fuelType === "Petrol");

  // Availability
  if (/available/i.test(q)) result = result.filter((b) => b.available);

  // Sort preferences
  if (/cheap|budget|affordable|lowest/i.test(q))
    result.sort((a, b) => a.pricePerDay - b.pricePerDay);
  else if (/premium|expensive|luxury|high.end/i.test(q))
    result.sort((a, b) => b.pricePerDay - a.pricePerDay);
  else if (/mileage|fuel\s*efficient/i.test(q)) result.sort((a, b) => b.mileage - a.mileage);
  else if (/popular|best|top|rating/i.test(q)) result.sort((a, b) => b.rating - a.rating);

  return result;
}

function suggestAlternatives(bikes: ApiBike[], unavailable: ApiBike): ApiBike[] {
  return bikes
    .filter((b) => b.available && b._id !== unavailable._id && b.category === unavailable.category)
    .sort(
      (a, b) =>
        Math.abs(a.pricePerDay - unavailable.pricePerDay) -
        Math.abs(b.pricePerDay - unavailable.pricePerDay),
    )
    .slice(0, 3);
}

// ─── Response builders ────────────────────────────────────────────
const QR_MAIN: QuickReply[] = [
  { label: "🏍️ Available Bikes", value: "Show available bikes" },
  { label: "💎 Premium Bikes", value: "Show premium bikes" },
  { label: "💰 Cheapest Bikes", value: "Show cheapest bikes" },
  { label: "📋 How to book?", value: "How do I book a bike?" },
];

function greetingRes(): SiriResponse {
  return {
    text: "Hi, I'm Siri 👋\nYour premium bike rental assistant at CampusRide.\n\nI can show you real-time bikes, help you book, track orders & answer any questions. What would you like to do?",
    quickReplies: QR_MAIN,
  };
}

function farewellRes(): SiriResponse {
  return { text: "Thanks for chatting! 👋 Ride safe and come back anytime 🏍️" };
}

function noBikesRes(): SiriResponse {
  return {
    text: "😕 No bikes match that criteria right now. Try adjusting your filters or check back soon — our fleet updates frequently!",
    quickReplies: [
      { label: "🏍️ All bikes", value: "Show all available bikes" },
      { label: "💰 Budget bikes", value: "Show cheapest bikes" },
      { label: "📞 Contact support", value: "Contact support" },
    ],
  };
}

async function bikeSearchRes(input: string, memory: ChatMemory): Promise<SiriResponse> {
  const bikes = await fetchBikes();
  if (!bikes.length) {
    return {
      text: "⚠️ I couldn't connect to the bike database right now. Please try again in a moment.",
      quickReplies: QR_MAIN,
    };
  }

  const filtered = filterBikes(bikes, input, memory);
  const availableResults = filtered.filter((b) => b.available).slice(0, 3);
  const unavailableResults = filtered.filter((b) => !b.available).slice(0, 1);

  if (availableResults.length === 0 && unavailableResults.length > 0) {
    const alt = suggestAlternatives(bikes, unavailableResults[0]);
    const uName = `${unavailableResults[0].brand} ${unavailableResults[0].name}`;
    return {
      text: `Sorry, **${uName}** is currently booked out 😔\n\nBut here are similar ${unavailableResults[0].category} bikes available right now:`,
      bikeCards: alt.length ? alt : undefined,
      quickReplies: alt.length
        ? [
            { label: "📋 Book one of these", value: "I want to book" },
            { label: "🔍 More options", value: "Show all available bikes" },
          ]
        : [{ label: "🏍️ All bikes", value: "Show all available bikes" }],
    };
  }

  if (availableResults.length === 0) return noBikesRes();

  const q = input.toLowerCase();
  let heading = "Here are the best bikes from our live inventory";
  if (/cheap|budget/i.test(q)) heading = "Most affordable bikes available right now";
  else if (/premium|luxury/i.test(q)) heading = "Our premium collection for you";
  else if (/mileage/i.test(q)) heading = "Best mileage bikes in our fleet";
  else if (/scoot/i.test(q)) heading = "Scooters available for easy city rides";
  else if (/sport/i.test(q)) heading = "Sports bikes ready for action";
  else if (/cruiser/i.test(q)) heading = "Cruisers perfect for long rides";

  return {
    text: `${heading} 🎯\n\n${availableResults.length} bike${availableResults.length > 1 ? "s" : ""} found — prices are live from our database:`,
    bikeCards: availableResults,
    quickReplies: [
      { label: "📋 Book Now", value: "I want to book" },
      { label: "🔍 More options", value: "Show all available bikes" },
      { label: "📞 Contact Support", value: "Contact support" },
    ],
  };
}

function bookingHelpRes(input: string): SiriResponse {
  const q = input.toLowerCase();

  if (/document|required|need/i.test(q)) {
    return {
      text: "📄 **Documents required:**\n\n✅ Valid Driving Licence (original)\n✅ Aadhaar Card / Government ID\n✅ Live selfie verification\n\n⚠️ Learner's licence is not accepted.\nAll documents are verified digitally during checkout.",
      quickReplies: [
        { label: "📸 Selfie help", value: "How does selfie verification work?" },
        { label: "🏍️ Browse bikes", value: "Show available bikes" },
      ],
    };
  }

  if (/pickup|drop/i.test(q)) {
    return {
      text: "📍 **Pickup & Drop:**\n\n• Default pickup: Campus Hub Main Gate\n• Self-pickup with valid ID\n• Drop at the same location\n• Extended drop available with notice\n• Late returns incur extra charges",
      quickReplies: [{ label: "⏰ Late charges", value: "What are late charges?" }],
    };
  }

  if (/pric(e|ing)|cost|rate/i.test(q)) {
    return {
      text: "💰 **Pricing:**\n\nPrices vary by bike — check any bike card for exact ₹/hour and ₹/day rates.\n\n• Security deposit: ₹500 – ₹2,000\n• Platform fee: ₹49\n• GST: 18%\n• Premium members get extra discounts!\n\nAll prices shown in the chat are **live** from our database.",
      quickReplies: [
        { label: "💰 Cheapest bikes", value: "Show cheapest bikes" },
        { label: "💎 Premium", value: "Show premium bikes" },
      ],
    };
  }

  return {
    text: "📋 **How to book — 4 steps:**\n\n1️⃣ Browse & select a bike\n2️⃣ Choose rental dates & duration\n3️⃣ Upload documents & verify identity\n4️⃣ Pay securely & confirm\n\nAdmin approves after document verification. You'll get an email confirmation! ✉️",
    quickReplies: [
      { label: "📄 Documents", value: "What documents are required?" },
      { label: "🏍️ Browse", value: "Show available bikes" },
    ],
  };
}

function faqRes(input: string, customFaqs: any[] = []): SiriResponse {
  const q = input.toLowerCase();

  // Check custom FAQs first
  if (customFaqs && customFaqs.length > 0) {
    for (const faq of customFaqs) {
      const keywords = faq.q
        .toLowerCase()
        .split(",")
        .map((k: string) => k.trim());
      for (const k of keywords) {
        if (q.includes(k) && k.length > 0) {
          return { text: faq.a, quickReplies: QR_MAIN.slice(0, 2) };
        }
      }
    }
  }

  const faqs: Record<string, string> = {
    refund:
      "💸 **Refund Policy:**\n\n• 24+ hours before pickup: Full refund\n• 12-24 hours: 50% refund\n• Less than 12 hours: No refund\n• Security deposit: Refunded in 3-5 business days",
    cancel:
      "❌ **Cancellation:**\n\n• Cancel from Dashboard → My Bookings\n• 24+ hours: Full refund\n• 12-24 hours: 50% refund\n• No-shows are non-refundable",
    deposit:
      "🔒 **Security Deposit:**\n\n• Scooters/Commuters: ₹500\n• Sports bikes: ₹1,000\n• Premium bikes: ₹2,000\n• Fully refundable after safe return",
    fuel: "⛽ **Fuel Policy:**\n\n• Bike provided with full tank\n• Return with full tank\n• Fuel charges apply if not refueled",
    late: "⏰ **Late Charges:**\n\n• Grace: 30 min\n• 30 min – 2 hrs: ₹100\n• 2-6 hrs: Half-day charge\n• 6+ hrs: Full day charge",
    helmet:
      "⛑️ **Helmet:**\n\n• 1 helmet free with every booking\n• Extra helmet: ₹50/day\n• Mandatory by law!",
    payment:
      "💳 **Payment Methods:**\n\n• UPI (GPay, PhonePe, Paytm)\n• Credit / Debit Cards\n• Net Banking\n• All payments encrypted 🔐",
    rule: "📜 **Rental Rules:**\n\n• Valid Driving Licence required\n• Minimum age: 18\n• No drunk driving\n• No sub-lending\n• Report accidents immediately",
  };

  for (const [key, text] of Object.entries(faqs)) {
    if (q.includes(key)) return { text, quickReplies: QR_MAIN.slice(0, 2) };
  }

  return {
    text: "📚 **I can answer these FAQs:**\n\n• Refund & cancellation\n• Security deposit\n• Fuel policy & late charges\n• Helmet availability\n• Payment methods\n• Rental rules\n\nJust ask about any topic!",
    quickReplies: [
      { label: "💸 Refunds", value: "Refund policy" },
      { label: "❌ Cancellation", value: "Cancellation policy" },
      { label: "🔒 Deposit", value: "Security deposit" },
      { label: "⛽ Fuel", value: "Fuel policy" },
    ],
  };
}

function bookNowRes(memory: ChatMemory, bikes: ApiBike[]): SiriResponse {
  if (memory.selectedBike) {
    const b = memory.selectedBike;
    const days = memory.rentalDays || 1;
    const base = b.pricePerDay * days;
    const deposit = b.securityDeposit || 1000;
    const platform = 49;
    const gst = Math.round(base * 0.18);
    const total = base + deposit + platform + gst;

    const summary: BookingSummary = {
      bikeName: `${b.brand} ${b.name}`,
      pricePerDay: b.pricePerDay,
      days,
      total,
      pickup: b.pickupLocation || memory.pickupLocation,
    };

    return {
      text: `🧾 **Booking Summary:**\n\n🏍️ Bike: **${b.brand} ${b.name}**\n💰 Rate: ₹${b.pricePerDay}/day × ${days} day${days > 1 ? "s" : ""} = ₹${base}\n🔒 Deposit: ₹${deposit}\n📦 Platform fee: ₹${platform}\n💹 GST (18%): ₹${gst}\n\n**Total: ₹${total.toLocaleString("en-IN")}**\n\n📍 Pickup: ${summary.pickup}\n${b.helmetIncluded ? "⛑️ Helmet included free!" : ""}\n\n👉 Head to the bike's page and click **Book Now** to proceed with payment!`,
      bookingSummary: summary,
      quickReplies: [
        { label: "🏍️ View bike page", value: `Tell me about ${b.name}` },
        { label: "🔄 Change bike", value: "Show available bikes" },
      ],
    };
  }

  // No bike selected yet
  const available = bikes.filter((b) => b.available).slice(0, 3);
  return {
    text: "You haven't selected a bike yet! Let me show you what's available — tap a bike card, then say **\"book this\"** 😊",
    bikeCards: available.length ? available : undefined,
    quickReplies: available.length
      ? [
          { label: "🏍️ All bikes", value: "Show available bikes" },
          { label: "💰 Budget bikes", value: "Show cheapest bikes" },
        ]
      : [{ label: "🏍️ Browse bikes", value: "Show available bikes" }],
  };
}

function selectBikeRes(input: string, memory: ChatMemory, bikes: ApiBike[]): SiriResponse {
  const q = input.toLowerCase();

  // Try to match by option number
  const optMatch = q.match(/option\s*(\d)/);
  if (optMatch) {
    // This would work with the last shown results — simplified for now
  }

  // Try to match by bike name
  const match = bikes.find(
    (b) =>
      q.includes(b.name.toLowerCase()) ||
      q.includes(b.brand.toLowerCase() + " " + b.name.toLowerCase()) ||
      q.includes(b.model.toLowerCase()),
  );

  if (match) {
    memory.selectedBike = match;
    const status = match.available ? "✅ Available" : "❌ Currently booked";
    return {
      text: `Great choice! Here's the full details:\n\n🏍️ **${match.brand} ${match.name}**\n📂 Category: ${match.category}\n⛽ Fuel: ${match.fuelType}\n🔧 Engine: ${match.engineCC || "N/A"} CC\n⚡ Mileage: ${match.mileage} km/l\n⭐ Rating: ${match.rating}/5\n💰 ₹${match.pricePerHour}/hr · ₹${match.pricePerDay}/day\n🔒 Deposit: ₹${match.securityDeposit || 1000}\n⛑️ Helmet: ${match.helmetIncluded ? "Included free" : "₹50/day extra"}\n📍 Pickup: ${match.pickupLocation || "Campus Hub Main Gate"}\n\nStatus: ${status}`,
      bikeCards: [match],
      quickReplies: match.available
        ? [
            { label: "📋 Book Now", value: "Book now" },
            { label: "🔍 More options", value: "Show available bikes" },
          ]
        : [{ label: "🔍 Similar bikes", value: `Show ${match.category} bikes` }],
    };
  }

  return {
    text: "I couldn't find that specific bike. Let me show you what's available — try searching by brand or category!",
    quickReplies: QR_MAIN,
  };
}

function verificationRes(input: string): SiriResponse {
  const q = input.toLowerCase();
  if (/selfie|camera/i.test(q)) {
    return {
      text: "📸 **Selfie Verification:**\n\n1. Allow camera permissions\n2. Good lighting, no shadows\n3. Remove sunglasses & caps\n4. Hold at eye level\n5. Keep face centered\n\n**Failing?** Better lighting, clean lens, use Chrome, disable VPN.",
      quickReplies: [{ label: "📄 DL upload", value: "How to upload licence?" }],
    };
  }
  return {
    text: "🔐 **Verification Steps:**\n\n📸 Live selfie capture\n📄 Driving Licence upload (JPG/PNG/PDF, max 5MB)\n🪪 Government ID (Aadhaar)\n\nAll done digitally during checkout — under 2 minutes!",
    quickReplies: [{ label: "📋 Booking steps", value: "How do I book a bike?" }],
  };
}

function invoiceRes(): SiriResponse {
  return {
    text: "💳 **Invoice & Payment Help:**\n\n📥 Download: Dashboard → My Bookings → Download Invoice\n✅ Payment status: Shown in booking details\n💸 Extra charges: Late fees, fuel, damage — see invoice breakdown\n📧 Email invoice: Available from booking page\n\nAll details are in your **Dashboard**.",
    quickReplies: [{ label: "📊 Track booking", value: "Show my booking status" }],
  };
}

function bookingStatusRes(): SiriResponse {
  return {
    text: "📊 **Track your booking:**\n\nGo to **Dashboard → My Bookings** to see:\n\n• ⏳ Pending — Awaiting admin review\n• ✅ Confirmed — Approved & ready\n• ❌ Rejected — Contact support\n• 🎉 Completed — Ride finished\n• 💳 Payment status\n\nBooking updates are also sent to your email!",
    quickReplies: [
      { label: "📥 Invoice help", value: "Download invoice" },
      { label: "📞 Support", value: "Contact support" },
    ],
  };
}

function contactRes(): SiriResponse {
  return {
    text: "📞 **Contact Support:**\n\n📧 Email: support@campusride.com\n📱 Phone: +91 98765 43210\n⏰ Hours: 8 AM – 10 PM daily\n\nOr keep chatting with me — I'll do my best! 😊",
    quickReplies: QR_MAIN.slice(0, 2),
  };
}

function unknownRes(): SiriResponse {
  return {
    text: "🤔 I'm not sure I understood that. I can help with:\n\n• 🏍️ Finding & recommending bikes\n• 📋 Booking guidance\n• ❓ FAQs & policies\n• 💳 Payments & invoices\n• 📊 Booking tracking\n\nTry asking in a different way, or pick an option below!",
    quickReplies: QR_MAIN,
  };
}

// ─── Main processor (async — fetches real data) ───────────────────
export async function processSiriMessage(
  input: string,
  memory: ChatMemory,
  customFaqs: any[] = [],
): Promise<SiriResponse> {
  const trimmed = input.trim();
  if (!trimmed) return unknownRes();

  const intent = detectIntent(trimmed);

  // Check if user mentions a specific bike name for selection
  if (intent === "unknown" || intent === "select_bike") {
    const bikes = await fetchBikes();
    const nameMatch = bikes.find(
      (b) =>
        trimmed.toLowerCase().includes(b.name.toLowerCase()) ||
        trimmed.toLowerCase().includes((b.brand + " " + b.name).toLowerCase()),
    );
    if (nameMatch) return selectBikeRes(trimmed, memory, bikes);
  }

  // Also check custom FAQs early if intent is unknown
  if (intent === "unknown" && customFaqs && customFaqs.length > 0) {
    for (const faq of customFaqs) {
      const keywords = faq.q
        .toLowerCase()
        .split(",")
        .map((k: string) => k.trim());
      for (const k of keywords) {
        if (trimmed.toLowerCase().includes(k) && k.length > 0) {
          return { text: faq.a, quickReplies: QR_MAIN.slice(0, 2) };
        }
      }
    }
  }

  switch (intent) {
    case "greeting":
      return greetingRes();
    case "farewell":
      return farewellRes();
    case "bike_search":
      return bikeSearchRes(trimmed, memory);
    case "booking_help":
      return bookingHelpRes(trimmed);
    case "faq":
      return faqRes(trimmed, customFaqs);
    case "invoice":
      return invoiceRes();
    case "booking_status":
      return bookingStatusRes();
    case "verification":
      return verificationRes(trimmed);
    case "contact":
      return contactRes();
    case "book_now": {
      const bikes = await fetchBikes();
      return bookNowRes(memory, bikes);
    }
    case "select_bike": {
      const bikes = await fetchBikes();
      return selectBikeRes(trimmed, memory, bikes);
    }
    default:
      return unknownRes();
  }
}

// ─── Suggested prompts ────────────────────────────────────────────
export const SUGGESTED_PROMPTS: QuickReply[] = [
  { label: "🏍️ Available Bikes", value: "Show available bikes" },
  { label: "💎 Premium Bikes", value: "Show premium bikes" },
  { label: "💰 Cheapest Bikes", value: "Show cheapest bikes" },
  { label: "📋 How to Book?", value: "How do I book a bike?" },
  { label: "📄 Documents", value: "What documents are required?" },
  { label: "📊 Track Booking", value: "Show my booking status" },
  { label: "📞 Contact Support", value: "Contact support" },
  { label: "❓ FAQs", value: "Show me FAQs" },
];
