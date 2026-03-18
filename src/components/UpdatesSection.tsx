import { useUpdates } from "@/hooks/useUpdates";
import { useSiteContent } from "@/hooks/useSiteContent";
import { Bell, Calendar } from "lucide-react";
import { motion } from "framer-motion";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const item = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 120, damping: 14 } },
};

const UpdatesSection = () => {
  const { updates, loading } = useUpdates();
  const { content } = useSiteContent();

  const activeUpdates = updates.filter((u) => u.is_active);

  if (loading) {
    return (
      <section id="updates" className="py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-muted-foreground">טוען עדכונים...</p>
        </div>
      </section>
    );
  }

  return (
    <section id="updates" className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          className="section-title mb-8"
          style={{ fontFamily: `'${content.fontFamily}', sans-serif` }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
        >
          📢 עדכונים
        </motion.h2>

        {activeUpdates.length > 0 ? (
          <motion.div
            className="space-y-4"
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
          >
            {activeUpdates.map((update) => (
              <motion.div
                key={update.id}
                variants={item}
                className="minecraft-card flex items-start gap-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10"
              >
                <div className="p-3 rounded-xl bg-primary/20 text-primary shrink-0 mt-1">
                  <Bell className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-foreground mb-1">
                    {update.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {update.content}
                  </p>
                  <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground/60">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {new Date(update.created_at).toLocaleDateString("he-IL", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            className="minecraft-card text-center py-12"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              אין עדכונים כרגע. הוסף עדכונים דרך פאנל הניהול!
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default UpdatesSection;
