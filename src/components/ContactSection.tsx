import { useState } from "react";
import { MessageCircle, Youtube, ExternalLink, Copy, Check, Bell } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSiteContent } from "@/hooks/useSiteContent";
import CustomerMessagesDialog from "./CustomerMessagesDialog";

const contactMethods = [
  {
    icon: <MessageCircle className="w-8 h-8" />,
    title: "דיסקורד",
    description: "הצטרפו לשרת הדיסקורד שלי",
    link: "https://dsc.gg/crazyplay",
    color: "from-indigo-500 to-purple-600",
  },
  {
    icon: <Youtube className="w-8 h-8" />,
    title: "יוטיוב",
    description: "צפו בערוץ היוטיוב שלי",
    link: "https://youtube.com/@crazyplayyt1234",
    color: "from-red-500 to-rose-600",
  },
];

const ContactSection = () => {
  const { content } = useSiteContent();
  const [selectedMethod, setSelectedMethod] = useState<typeof contactMethods[0] | null>(null);
  const [copied, setCopied] = useState(false);
  const [messagesDialogOpen, setMessagesDialogOpen] = useState(false);

  const handleCopy = () => {
    if (selectedMethod) {
      navigator.clipboard.writeText(selectedMethod.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpen = () => {
    if (selectedMethod) {
      window.open(selectedMethod.link, "_blank");
    }
  };

  return (
    <section id="contact" className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 
          className="section-title mb-10"
          style={{ fontFamily: `'${content.fontFamily}', sans-serif` }}
        >
          {content.contactTitle}
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {contactMethods.map((method, index) => (
            <button
              key={index}
              onClick={() => setSelectedMethod(method)}
              className="minecraft-card group hover:scale-105 transition-all duration-300 cursor-pointer text-center"
            >
              <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${method.color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                {method.icon}
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">{method.title}</h3>
              <p className="text-muted-foreground">{method.description}</p>
            </button>
          ))}
        </div>

        <div className="minecraft-card mt-10 text-center max-w-2xl mx-auto">
          <h3 className="text-xl font-bold text-primary mb-4">💬 יש לכם שאלה?</h3>
          <p className="text-muted-foreground mb-6">
            אל תהססו לפנות! אשמח לשמוע מכם ולעזור בכל שאלה לגבי שירותי העריכה שלי.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-primary/20 rounded-full text-primary font-medium">
              <MessageCircle size={20} />
              <span>זמני תגובה: עד 24 שעות</span>
            </div>
            <Button
              onClick={() => setMessagesDialogOpen(true)}
              variant="outline"
              className="gap-2"
            >
              <Bell size={18} />
              בדוק הודעות על ההזמנה שלי
            </Button>
          </div>
        </div>
      </div>

      {/* Link Dialog */}
      <Dialog open={!!selectedMethod} onOpenChange={() => setSelectedMethod(null)}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
              {selectedMethod?.title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground mb-2 text-center">הקישור:</p>
              <p className="text-primary font-medium text-center break-all" dir="ltr">
                {selectedMethod?.link}
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={handleCopy} 
                variant="outline" 
                className="flex-1"
              >
                {copied ? <Check size={18} className="ml-2" /> : <Copy size={18} className="ml-2" />}
                {copied ? "הועתק!" : "העתק קישור"}
              </Button>
              <Button 
                onClick={handleOpen}
                className="flex-1"
              >
                <ExternalLink size={18} className="ml-2" />
                פתח קישור
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CustomerMessagesDialog
        open={messagesDialogOpen}
        onOpenChange={setMessagesDialogOpen}
      />
    </section>
  );
};

export default ContactSection;
