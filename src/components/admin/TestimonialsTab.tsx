import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useTestimonials, Testimonial } from "@/hooks/useTestimonials";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit2, Save, X, Upload } from "lucide-react";

const TestimonialsTab = () => {
  const { testimonials, addTestimonial, updateTestimonial, deleteTestimonial, uploadLogo } = useTestimonials();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const [newTestimonial, setNewTestimonial] = useState({
    author_name: "",
    content: "",
    logo_url: "" as string | null,
    display_order: 0,
    is_active: true,
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Testimonial>>({});

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadLogo(file);
    if (url) {
      if (isEdit) {
        setEditData((prev) => ({ ...prev, logo_url: url }));
      } else {
        setNewTestimonial((prev) => ({ ...prev, logo_url: url }));
      }
      toast({ title: "הלוגו הועלה בהצלחה!" });
    } else {
      toast({ title: "שגיאה בהעלאת הלוגו", variant: "destructive" });
    }
  };

  const handleAdd = async () => {
    if (!newTestimonial.author_name || !newTestimonial.content) {
      toast({ title: "נא למלא שם וטקסט המלצה", variant: "destructive" });
      return;
    }
    const success = await addTestimonial({
      ...newTestimonial,
      display_order: testimonials.length,
    });
    if (success) {
      toast({ title: "ההמלצה נוספה בהצלחה!" });
      setNewTestimonial({ author_name: "", content: "", logo_url: "", display_order: 0, is_active: true });
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deleteTestimonial(id);
    if (success) toast({ title: "ההמלצה נמחקה!" });
  };

  const startEdit = (t: Testimonial) => {
    setEditingId(t.id);
    setEditData({ author_name: t.author_name, content: t.content, logo_url: t.logo_url, is_active: t.is_active });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const success = await updateTestimonial(editingId, editData);
    if (success) {
      toast({ title: "ההמלצה עודכנה!" });
      setEditingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add new */}
      <div className="minecraft-card">
        <h2 className="text-xl font-bold mb-4">הוסף המלצה חדשה</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>שם הממליץ</Label>
            <Input
              value={newTestimonial.author_name}
              onChange={(e) => setNewTestimonial((p) => ({ ...p, author_name: e.target.value }))}
              placeholder="שם..."
              className="bg-background/50"
            />
          </div>
          <div>
            <Label>לוגו / תמונה</Label>
            <div className="flex gap-2">
              <Input
                value={newTestimonial.logo_url || ""}
                onChange={(e) => setNewTestimonial((p) => ({ ...p, logo_url: e.target.value }))}
                placeholder="URL או העלה קובץ..."
                className="bg-background/50"
              />
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(e)} />
              <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()}>
                <Upload size={16} />
              </Button>
            </div>
          </div>
          <div className="md:col-span-2">
            <Label>טקסט ההמלצה</Label>
            <Textarea
              value={newTestimonial.content}
              onChange={(e) => setNewTestimonial((p) => ({ ...p, content: e.target.value }))}
              placeholder="כתוב את ההמלצה..."
              className="bg-background/50"
            />
          </div>
          <div className="md:col-span-2">
            <Button onClick={handleAdd} className="w-full">
              <Plus className="ml-2" size={18} />
              הוסף המלצה
            </Button>
          </div>
        </div>
      </div>

      {/* Existing */}
      <div className="minecraft-card">
        <h2 className="text-xl font-bold mb-4">המלצות קיימות ({testimonials.length})</h2>
        <div className="space-y-3">
          {testimonials.map((t) => (
            <div key={t.id} className="p-4 bg-muted/30 rounded-lg">
              {editingId === t.id ? (
                <div className="space-y-3">
                  <Input
                    value={editData.author_name || ""}
                    onChange={(e) => setEditData((p) => ({ ...p, author_name: e.target.value }))}
                    className="bg-background/50"
                  />
                  <Textarea
                    value={editData.content || ""}
                    onChange={(e) => setEditData((p) => ({ ...p, content: e.target.value }))}
                    className="bg-background/50"
                  />
                  <div className="flex gap-2">
                    <Input
                      value={editData.logo_url || ""}
                      onChange={(e) => setEditData((p) => ({ ...p, logo_url: e.target.value }))}
                      placeholder="URL לוגו..."
                      className="bg-background/50"
                    />
                    <input type="file" ref={editFileInputRef} className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(e, true)} />
                    <Button variant="outline" size="icon" onClick={() => editFileInputRef.current?.click()}>
                      <Upload size={16} />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={editData.is_active} onCheckedChange={(v) => setEditData((p) => ({ ...p, is_active: v }))} />
                    <Label>פעיל</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveEdit} size="sm">
                      <Save className="ml-1" size={14} /> שמור
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>
                      <X className="ml-1" size={14} /> ביטול
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  {t.logo_url && (
                    <img src={t.logo_url} alt={t.author_name} className="w-10 h-10 rounded-full object-cover" />
                  )}
                  <div className="flex-1">
                    <p className="font-bold text-primary">{t.author_name}</p>
                    <p className="text-sm text-muted-foreground">{t.content}</p>
                    {!t.is_active && <span className="text-xs text-destructive">לא פעיל</span>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(t)}>
                      <Edit2 size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)} className="text-destructive">
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {testimonials.length === 0 && (
            <p className="text-center text-muted-foreground">אין המלצות עדיין</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestimonialsTab;
