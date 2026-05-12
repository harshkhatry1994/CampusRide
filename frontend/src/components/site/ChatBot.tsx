import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageCircle,
  X,
  Send,
  ShieldAlert,
  CheckCircle2,
  Bot,
  User,
  Sparkles,
  Star,
  Fuel,
  Gauge,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  processSiriMessage,
  SUGGESTED_PROMPTS,
  createMemory,
  fetchBikes,
  type SiriResponse,
  type QuickReply,
  type ApiBike,
  type ChatMemory,
  type BookingSummary,
} from "./SiriEngine";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ─── Types ────────────────────────────────────────────────────────
type Message = {
  id: string;
  sender: "bot" | "user";
  text: string;
  quickReplies?: QuickReply[];
  bikeCards?: ApiBike[];
  bookingSummary?: BookingSummary | null;
  timestamp: Date;
};

// ─── Image resolver (mirrors BikeCard.tsx) ────────────────────────
function resolveImg(url: string) {
  if (!url) return "";
  if (url.startsWith("/uploads/")) return `${API}${url}`;
  if (url.startsWith("http")) return url;
  return url;
}

// ─── Live Bike Card ───────────────────────────────────────────────
function LiveBikeCard({ bike, onSelect }: { bike: ApiBike; onSelect: (b: ApiBike) => void }) {
  return (
    <button
      onClick={() => onSelect(bike)}
      className="w-full flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 p-2.5 shadow-sm transition-all hover:shadow-md hover:border-amber-300 dark:hover:border-amber-500/50 active:scale-[0.98] text-left"
    >
      {bike.imageUrl ? (
        <img
          src={resolveImg(bike.imageUrl)}
          alt={bike.name}
          className="h-14 w-14 rounded-lg object-cover shrink-0 bg-slate-100 dark:bg-slate-800"
        />
      ) : (
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow">
          <span className="text-lg font-bold">{bike.category?.[0] || "B"}</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 truncate">
          {bike.brand} {bike.name}
        </p>
        <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
          <span className="flex items-center gap-0.5">
            <Fuel className="h-2.5 w-2.5" />
            {bike.fuelType}
          </span>
          <span>·</span>
          <span className="flex items-center gap-0.5">
            <Gauge className="h-2.5 w-2.5" />
            {bike.mileage} km/l
          </span>
          <span>·</span>
          <span className="flex items-center gap-0.5">
            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
            {bike.rating}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className={cn(
              "text-[9px] px-1.5 py-0.5 rounded-full font-semibold",
              bike.available ? "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400" : "bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400",
            )}
          >
            {bike.available ? "Available" : "Booked"}
          </span>
          {bike.helmetIncluded && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
              ⛑️ Helmet
            </span>
          )}
        </div>
      </div>
      <div className="text-right shrink-0">
        <span className="text-sm font-bold text-amber-600 dark:text-amber-500">₹{bike.pricePerDay}</span>
        <span className="text-[9px] text-slate-400 block">/day</span>
        <span className="text-[10px] text-slate-400">₹{bike.pricePerHour}/hr</span>
      </div>
    </button>
  );
}

// ─── Booking Summary Card ─────────────────────────────────────────
function BookingSummaryCard({ summary }: { summary: BookingSummary }) {
  return (
    <div className="rounded-xl border-2 border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/5 p-3 shadow-sm">
      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-sm mb-2">
        <CheckCircle2 className="h-4 w-4" /> Booking Estimate
      </div>
      <div className="space-y-1 text-[12px] text-slate-700 dark:text-slate-300">
        <div className="flex justify-between">
          <span>🏍️ Bike</span>
          <span className="font-semibold">{summary.bikeName}</span>
        </div>
        <div className="flex justify-between">
          <span>📅 Duration</span>
          <span>
            {summary.days} day{summary.days > 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex justify-between">
          <span>💰 Rate</span>
          <span>₹{summary.pricePerDay}/day</span>
        </div>
        <div className="flex justify-between">
          <span>📍 Pickup</span>
          <span>{summary.pickup}</span>
        </div>
        <div className="flex justify-between border-t border-amber-200 dark:border-amber-800 pt-1 mt-1 font-bold text-amber-800 dark:text-amber-400">
          <span>Total</span>
          <span>₹{summary.total.toLocaleString("en-IN")}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Typing Indicator ─────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 shadow">
        <Bot className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1.5">
        <span className="h-2 w-2 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="h-2 w-2 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="h-2 w-2 bg-violet-400 rounded-full animate-bounce" />
      </div>
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────
function MessageBubble({
  msg,
  onQuickReply,
  onSelectBike,
}: {
  msg: Message;
  onQuickReply: (v: string) => void;
  onSelectBike: (b: ApiBike) => void;
}) {
  const isUser = msg.sender === "user";

  return (
    <div
      className={cn(
        "flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser && (
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 shadow mt-0.5">
          <Bot className="h-3.5 w-3.5 text-white" />
        </div>
      )}
      <div className="flex flex-col gap-2 max-w-[85%]">
        <div
          className={cn(
            "px-4 py-3 rounded-2xl text-[13px] leading-relaxed shadow-sm whitespace-pre-line transition-colors",
            isUser
              ? "bg-gradient-to-r from-violet-500 to-indigo-600 text-white rounded-br-sm shadow-violet-500/20"
              : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-sm",
          )}
        >
          {msg.text.split(/(\*\*.*?\*\*)/).map((part, i) =>
            part.startsWith("**") && part.endsWith("**") ? (
              <strong key={i} className="font-bold">
                {part.slice(2, -2)}
              </strong>
            ) : (
              <span key={i}>{part}</span>
            ),
          )}
        </div>

        {/* Bike cards from real API */}
        {msg.bikeCards && msg.bikeCards.length > 0 && (
          <div className="space-y-2">
            {msg.bikeCards.map((bike) => (
              <LiveBikeCard key={bike._id} bike={bike} onSelect={onSelectBike} />
            ))}
          </div>
        )}

        {/* Booking summary */}
        {msg.bookingSummary && <BookingSummaryCard summary={msg.bookingSummary} />}

        {/* Quick replies */}
        {msg.quickReplies && msg.quickReplies.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {msg.quickReplies.map((qr, i) => (
              <button
                key={i}
                onClick={() => onQuickReply(qr.value)}
                className="text-[11px] font-medium px-3 py-1.5 rounded-full border border-violet-200 dark:border-violet-500/40 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-500/20 hover:border-violet-300 transition-all hover:scale-105 active:scale-95"
              >
                {qr.label}
              </button>
            ))}
          </div>
        )}

        <span
          className={cn(
            "text-[10px] mt-0.5",
            isUser ? "text-right text-slate-400" : "text-slate-400",
          )}
        >
          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      {isUser && (
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 shadow mt-0.5">
          <User className="h-3.5 w-3.5 text-white" />
        </div>
      )}
    </div>
  );
}

// ─── Main ChatBot ─────────────────────────────────────────────────
export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const memoryRef = useRef<ChatMemory>(createMemory());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Read settings
  const [settings, setSettings] = useState<{
    enabled: boolean;
    welcomeMessage: string;
    faqs: { q: string; a: string }[];
  }>({
    enabled: true,
    welcomeMessage:
      "Hi, I'm Siri 👋\nYour premium bike rental assistant at CampusRide.\n\nI pull **real-time data** from our fleet — bikes, prices, and availability are always up to date!\n\nHow can I help you today?",
    faqs: [],
  });

  // Initial load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("siri_settings");
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse siri_settings", e);
      }
    }
  }, []);

  // Listen for setting changes
  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem("siri_settings");
      if (saved) setSettings(JSON.parse(saved));
    };
    window.addEventListener("storage", handleStorage);
    // Also set interval to check local storage manually to catch same-tab changes quickly
    const int = setInterval(handleStorage, 2000);
    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(int);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Prefetch bikes on mount
  useEffect(() => {
    fetchBikes();
  }, []);

  // Welcome on first open
  useEffect(() => {
    if (isOpen && !hasGreeted) {
      setHasGreeted(true);
      setIsTyping(true);
      setTimeout(() => {
        setMessages([
          {
            id: "welcome",
            sender: "bot",
            text: settings.welcomeMessage,
            quickReplies: SUGGESTED_PROMPTS.slice(0, 4),
            timestamp: new Date(),
          },
        ]);
        setIsTyping(false);
      }, 800);
    }
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen, hasGreeted, settings.welcomeMessage]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isTyping) return;

      const userMsg: Message = {
        id: `u-${Date.now()}`,
        sender: "user",
        text: text.trim(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsTyping(true);

      try {
        const response: SiriResponse = await processSiriMessage(
          text,
          memoryRef.current,
          settings.faqs,
        );
        const botMsg: Message = {
          id: `b-${Date.now()}`,
          sender: "bot",
          text: response.text,
          quickReplies: response.quickReplies,
          bikeCards: response.bikeCards,
          bookingSummary: response.bookingSummary,
          timestamp: new Date(),
        };
        // Small delay for natural feel
        await new Promise((r) => setTimeout(r, 400 + Math.random() * 400));
        setMessages((prev) => [...prev, botMsg]);

        // Record to history
        const savedHistory = localStorage.getItem("siri_chat_history");
        const history = savedHistory ? JSON.parse(savedHistory) : [];
        history.unshift({ user: text.trim(), bot: response.text, timestamp: new Date() });
        if (history.length > 50) history.pop();
        localStorage.setItem("siri_chat_history", JSON.stringify(history));
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            sender: "bot",
            text: "⚠️ Something went wrong. Please try again!",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [isTyping, settings.faqs],
  );

  const handleSelectBike = useCallback(
    (bike: ApiBike) => {
      memoryRef.current.selectedBike = bike;
      sendMessage(`Tell me about ${bike.brand} ${bike.name}`);
    },
    [sendMessage],
  );

  const handleQuickReply = useCallback(
    (value: string) => {
      sendMessage(value);
    },
    [sendMessage],
  );

  if (!settings.enabled) return null;

  return (
    <>
      {/* FAB */}
      <button
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-2xl transition-all duration-300",
          "bg-gradient-to-br from-violet-500 to-indigo-600 text-white",
          "hover:scale-110 hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] active:scale-95",
          "flex items-center justify-center",
          isOpen && "scale-0 opacity-0 pointer-events-none",
        )}
        onClick={() => setIsOpen(true)}
        aria-label="Open Siri chatbot"
      >
        <MessageCircle className="h-6 w-6 drop-shadow" />
        <span className="absolute inset-0 rounded-full bg-violet-400 animate-ping opacity-30" />
      </button>

      {/* Chat Window */}
      <div
        className={cn(
          "fixed bottom-6 right-6 z-50 w-[360px] sm:w-[390px] h-[580px] max-h-[88vh]",
          "rounded-2xl overflow-hidden flex flex-col transition-all duration-300 origin-bottom-right",
          "shadow-[0_20px_60px_rgba(0,0,0,0.25)] border border-slate-200/80 dark:border-slate-800",
          "bg-white dark:bg-slate-900",
          isOpen ? "scale-100 opacity-100" : "scale-50 opacity-0 pointer-events-none",
        )}
      >
        {/* Header */}
        <div className="relative px-5 pt-5 pb-4 bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 text-white shrink-0">
          <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 backdrop-blur-sm shadow-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-indigo-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg leading-none tracking-tight">Siri</h3>
                  <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                    LIVE
                  </span>
                </div>
                <p className="text-[12px] text-violet-200 mt-1">
                  Smart Rental Assistant · Real-time data
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="grid h-8 w-8 place-items-center rounded-full text-white/70 hover:text-white hover:bg-white/15 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 transition-colors">
          {messages.length === 0 && !isTyping && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-3 px-4">
                <div className="grid h-14 w-14 mx-auto place-items-center rounded-2xl bg-violet-100 dark:bg-violet-900/30">
                  <Bot className="h-7 w-7 text-violet-500 dark:text-violet-400" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Start a conversation with Siri</p>
              </div>
            </div>
          )}
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              onQuickReply={handleQuickReply}
              onSelectBike={handleSelectBike}
            />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Extra prompts when few messages */}
        {messages.length === 1 && !isTyping && (
          <div className="px-3 pb-2 bg-white dark:bg-slate-900 shrink-0">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1 mb-1.5">
              Try asking
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_PROMPTS.slice(4).map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickReply(p.value)}
                  className="text-[11px] font-medium px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-violet-500/10 hover:border-violet-200 dark:hover:border-violet-500/30 hover:text-violet-700 dark:hover:text-violet-400 transition-all"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Siri anything..."
              disabled={isTyping}
              className="flex-1 h-11 px-4 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-300 dark:focus:border-violet-500 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className={cn(
                "grid h-11 w-11 shrink-0 place-items-center rounded-full transition-all shadow",
                "bg-gradient-to-br from-violet-500 to-indigo-600 text-white",
                "hover:shadow-lg hover:scale-105 active:scale-95",
                "disabled:from-slate-200 disabled:to-slate-300 disabled:text-slate-400 disabled:shadow-none disabled:scale-100 dark:disabled:from-slate-800 dark:disabled:to-slate-900",
              )}
            >
              <Send className="h-4 w-4 ml-0.5" />
            </button>
          </form>
          <p className="text-center mt-2 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            Powered by Siri AI ·{" "}
            <span
              onClick={() => setDisclaimerOpen(true)}
              className="text-violet-500 dark:text-violet-400 hover:underline cursor-pointer font-semibold"
            >
              Disclaimer
            </span>
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <Dialog open={disclaimerOpen} onOpenChange={setDisclaimerOpen}>
        <DialogContent className="max-w-md bg-card border border-border/60 shadow-2xl p-0 overflow-hidden sm:rounded-[2rem]">
          <div className="bg-gradient-to-br from-violet-600 to-indigo-700 px-6 py-6 text-white text-center">
            <ShieldAlert className="h-10 w-10 mx-auto mb-2 opacity-90 drop-shadow-md" />
            <DialogTitle className="text-2xl font-bold tracking-tight">
              AI Chat Disclaimer
            </DialogTitle>
            <DialogDescription className="text-white/80 mt-1 font-medium">
              Important info about Siri
              </DialogDescription>
          </div>
          <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">
              Please read before relying on AI assistance:
            </p>
            <ul className="space-y-3">
              {[
                [
                  "Live Data",
                  "Bike details and prices are fetched in real-time from our database.",
                ],
                ["Availability", "Availability shown is current but may change by checkout time."],
                [
                  "Admin Verification",
                  "Bookings require admin approval after document verification.",
                ],
                ["Policies", "Standard Rental, Payment, and Refund policies always apply."],
                [
                  "AI Limitations",
                  "Siri may occasionally misunderstand — verify with human support.",
                ],
                ["Privacy", "Chat messages are processed securely per our Privacy Policy."],
              ].map(([title, desc]) => (
                <li key={title} className="flex gap-2 items-start">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    <strong>{title}:</strong> {desc}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <DialogFooter className="p-4 border-t border-border/40 bg-muted/20">
            <Button
              onClick={() => setDisclaimerOpen(false)}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold hover:scale-[1.02] transition-transform"
            >
              I Understand & Accept
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
