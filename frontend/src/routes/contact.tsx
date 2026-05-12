import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Mail, MapPin, Phone, MessageSquare, Send, Globe, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact CampusRide" },
      {
        name: "description",
        content: "Questions, feedback, partnerships — get in touch with the CampusRide team.",
      },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast.success("Message sent! We'll be in touch.");
        setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
      } else {
        throw new Error("Failed to send message");
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
      <div className="grid lg:grid-cols-2 gap-16">
        <div className="space-y-12 animate-in fade-in slide-in-from-left-4 duration-700">
          <div>
            <h1 className="text-5xl font-black tracking-tighter mb-4">
              Get in <span className="text-primary">touch</span>
            </h1>
            <p className="text-muted-foreground text-lg font-medium leading-relaxed max-w-md">
              Have questions about our bikes, pricing, or premium membership? Our team is here to
              help you 24/7.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <ContactCard
              icon={<Mail />}
              label="Email Us"
              value="hello@campusride.app"
              href="mailto:hello@campusride.app"
            />
            <ContactCard
              icon={<Phone />}
              label="Call Support"
              value="+91 98765 43210"
              href="tel:+919876543210"
            />
            <ContactCard
              icon={<MessageCircle />}
              label="WhatsApp"
              value="Live Chat"
              href="https://wa.me/919876543210"
              className="bg-green-500/10 text-green-600 border-green-500/20"
            />
            <ContactCard
              icon={<MapPin />}
              label="Visit Us"
              value="Main Campus, Building 7"
              href="#"
            />
          </div>

          <div className="rounded-[2.5rem] overflow-hidden border border-border/60 shadow-elegant h-[300px] grayscale hover:grayscale-0 transition-all duration-700">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3888.3846660143!2d77.5945627!3d12.9715987!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae1670c9b44e07%3A0xf8dfc3e8517e4fe0!2sBengaluru%2C%20Karnataka!5e0!3m2!1sen!2sin!4v1715360000000!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
            />
          </div>
        </div>

        <div className="animate-in fade-in slide-in-from-right-4 duration-700">
          <form
            onSubmit={submit}
            className="rounded-[3rem] bg-gradient-card border border-border/60 p-8 sm:p-10 space-y-6 shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute right-[-20px] top-[-20px] h-32 w-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="n">Full Name</Label>
                <Input
                  id="n"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="h-12 rounded-xl bg-background/50"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="e">Email Address</Label>
                <Input
                  id="e"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="h-12 rounded-xl bg-background/50"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="p">Phone Number</Label>
                <Input
                  id="p"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="h-12 rounded-xl bg-background/50"
                  placeholder="+91 00000 00000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s">Subject</Label>
                <Input
                  id="s"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                  className="h-12 rounded-xl bg-background/50"
                  placeholder="How can we help?"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="m">Your Message</Label>
              <Textarea
                id="m"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={6}
                required
                className="rounded-2xl bg-background/50 resize-none"
                placeholder="Tell us more about your request..."
              />
            </div>

            <Button
              type="submit"
              disabled={sending}
              className="w-full h-14 bg-gradient-brand text-primary-foreground shadow-glow rounded-2xl font-bold text-lg group"
            >
              {sending ? (
                "Sending Message..."
              ) : (
                <span className="flex items-center gap-2">
                  Send Message{" "}
                  <Send className="h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </span>
              )}
            </Button>

            <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest font-bold">
              Typical response time: under 2 hours
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

function ContactCard({ icon, label, value, href, className }: any) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "p-6 rounded-[2rem] border border-border/60 bg-card hover:border-primary/40 transition-all group",
        className,
      )}
    >
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">
            {label}
          </p>
          <p className="font-bold text-sm">{value}</p>
        </div>
      </div>
    </a>
  );
}
