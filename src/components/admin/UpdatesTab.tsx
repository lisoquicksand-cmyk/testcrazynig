import { useState } from "react";
import { useUpdates, Update } from "@/hooks/useUpdates";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Edit2, Save, X } from "lucide-react";

const UpdatesTab = () => {
  const { updates, addUpdate, updateUpdate, deleteUpdate } = useUpdates();
  const { toast } = useToast();
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const handleAdd = async () => {
    if (!newTitle || !newContent) {
      toast({ title: "נא למלא את כל השדות", variant: "destructive" });
      return;
    }
    const success = await addUpdate({ title: newTitle, content: newContent });
    if (success) {
      toast({ title: "העדכון נוסף בהצלחה!" });
      setNewTitle("");
      setNewContent("");
    }
  };

  const handleSaveEdit = async (id: string) => {
    const success = await updateUpdate(id, { title: editTitle, content: editContent });
    if (success) {
      toast({ title: "העדכון עודכן בהצלחה!" });
      setEditingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deleteUpdate(id);
    if (success) {
      toast({ title: "העדכון נמחק בהצלחה!" });
    }
  };

  const startEdit = (update: Update) => {
    setEditingId(update.id);
    setEditTitle(update.title);
    setEditContent(update.content);
  };

  return (
    <div className="space-y-6">
      {/* Add new update */}
      <div className="minecraft-card">
        <h3 className="text-lg font-bold mb-4">➕ הוסף עדכון חדש</h3>
        <div className="space-y-3">
          <div>
            <Label>כותרת</Label>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="כותרת העדכון"
            />
          </div>
          <div>
            <Label>תוכן</Label>
            <Textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="תוכן העדכון"
              rows={3}
            />
          </div>
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 ml-2" />
            הוסף עדכון
          </Button>
        </div>
      </div>

      {/* Existing updates */}
      <div className="minecraft-card">
        <h3 className="text-lg font-bold mb-4">📢 עדכונים קיימים ({updates.length})</h3>
        <div className="space-y-3">
          {updates.map((update) => (
            <div key={update.id} className="border border-border rounded-lg p-4">
              {editingId === update.id ? (
                <div className="space-y-3">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleSaveEdit(update.id)}>
                      <Save className="w-4 h-4 ml-1" />
                      שמור
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                      <X className="w-4 h-4 ml-1" />
                      ביטול
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="font-bold">{update.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{update.content}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={update.is_active}
                          onCheckedChange={(checked) => updateUpdate(update.id, { is_active: checked })}
                        />
                        <span className="text-xs text-muted-foreground">
                          {update.is_active ? "פעיל" : "מוסתר"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => startEdit(update)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(update.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {updates.length === 0 && (
            <p className="text-muted-foreground text-center py-4">אין עדכונים עדיין</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdatesTab;
