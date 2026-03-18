import { useUpdates } from "@/hooks/useUpdates";
import { useSiteContent } from "@/hooks/useSiteContent";
import { Bell, Calendar } from "lucide-react";

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
        <h2
          className="section-title mb-8"
          style={{ fontFamily: `'${content.fontFamily}', sans-serif` }}
        >
          📢 עדכונים
        </h2>

        {activeUpdates.length > 0 ? (
          <div className="space-y-4">
            {activeUpdates.map((update) => (
              <div
                key={update.id}
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
              </div>
            ))}
          </div>
        ) : (
          <div className="minecraft-card text-center py-12">
            <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              אין עדכונים כרגע. הוסף עדכונים דרך פאנל הניהול!
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default UpdatesSection;
