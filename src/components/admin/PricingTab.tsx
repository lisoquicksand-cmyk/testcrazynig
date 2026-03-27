import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { usePricing, PricingPackage } from "@/hooks/usePricing";
import { Plus, Trash2, Edit2, Save, X } from "lucide-react";

const PricingTab = () => {
  const { toast } = useToast();
  const { packages, addPackage, updatePackage, deletePackage } = usePricing();

  const [newPackage, setNewPackage] = useState({
    name: "",
    description: "",
    price: 0,
    currency: "ILS",
    features: [] as string[],
    is_popular: false,
    is_active: true,
    display_order: 0,
  });
  const [newFeature, setNewFeature] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<PricingPackage>>({});
  const [editFeature, setEditFeature] = useState("");

  const addFeatureToNew = () => {
    if (newFeature.trim()) {
      setNewPackage((prev) => ({ ...prev, features: [...prev.features, newFeature.trim()] }));
      setNewFeature("");
    }
  };

  const removeNewFeature = (index: number) => {
    setNewPackage((prev) => ({ ...prev, features: prev.features.filter((_, i) => i !== index) }));
  };

  const handleAdd = async () => {
    if (!newPackage.name || newPackage.price <= 0) {
      toast({ title: "נא למלא שם ומחיר", variant: "destructive" });
      return;
    }
    const success = await addPackage({ ...newPackage, display_order: packages.length });
    if (success) {
      toast({ title: "החבילה נוספה בהצלחה!" });
      setNewPackage({ name: "", description: "", price: 0, currency: "ILS", features: [], is_popular: false, is_active: true, display_order: 0 });
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deletePackage(id);
    if (success) toast({ title: "החבילה נמחקה בהצלחה!" });
  };

  const startEdit = (pkg: PricingPackage) => {
    setEditingId(pkg.id);
    setEditData({ name: pkg.name, description: pkg.description, price: pkg.price, features: [...pkg.features], is_popular: pkg.is_popular, is_active: pkg.is_active });
    setEditFeature("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
    setEditFeature("");
  };

  const addEditFeature = () => {
    if (editFeature.trim()) {
      setEditData((prev) => ({ ...prev, features: [...(prev.features || []), editFeature.trim()] }));
      setEditFeature("");
    }
  };

  const removeEditFeature = (index: number) => {
    setEditData((prev) => ({ ...prev, features: (prev.features || []).filter((_, i) => i !== index) }));
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const success = await updatePackage(editingId, editData);
    if (success) {
      toast({ title: "החבילה עודכנה בהצלחה!" });
      cancelEdit();
    } else {
      toast({ title: "שגיאה בעדכון", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Add New Package */}
      <div className="minecraft-card">
        <h2 className="text-xl font-bold mb-4">➕ הוסף חבילה חדשה</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>שם החבילה</Label>
            <Input value={newPackage.name} onChange={(e) => setNewPackage((p) => ({ ...p, name: e.target.value }))} placeholder="בסיסי / מקצועי..." className="bg-background/50" />
          </div>
          <div>
            <Label>מחיר (₪)</Label>
            <Input type="number" value={newPackage.price} onChange={(e) => setNewPackage((p) => ({ ...p, price: Number(e.target.value) }))} className="bg-background/50" />
          </div>
          <div className="md:col-span-2">
            <Label>תיאור</Label>
            <Textarea value={newPackage.description} onChange={(e) => setNewPackage((p) => ({ ...p, description: e.target.value }))} placeholder="תיאור קצר..." className="bg-background/50" />
          </div>
          <div className="md:col-span-2">
            <Label>תכונות</Label>
            <div className="flex gap-2 mb-2">
              <Input value={newFeature} onChange={(e) => setNewFeature(e.target.value)} placeholder="הוסף תכונה..." className="bg-background/50" onKeyDown={(e) => e.key === "Enter" && addFeatureToNew()} />
              <Button onClick={addFeatureToNew} variant="secondary"><Plus size={18} /></Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {newPackage.features.map((f, i) => (
                <span key={i} className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  {f}<button onClick={() => removeNewFeature(i)}><X size={14} /></button>
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Label className="flex items-center gap-2">
              <Switch checked={newPackage.is_popular} onCheckedChange={(c) => setNewPackage((p) => ({ ...p, is_popular: c }))} />
              הכי פופולרי
            </Label>
          </div>
          <div className="flex items-end">
            <Button onClick={handleAdd} className="w-full"><Plus className="ml-2" size={18} />הוסף חבילה</Button>
          </div>
        </div>
      </div>

      {/* Existing Packages */}
      <div className="minecraft-card">
        <h2 className="text-xl font-bold mb-4">📦 חבילות קיימות ({packages.length})</h2>
        <div className="space-y-4">
          {packages.map((pkg) => (
            <div key={pkg.id} className="p-4 bg-muted/30 rounded-lg border border-border">
              {editingId === pkg.id ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>שם החבילה</Label>
                      <Input value={editData.name || ""} onChange={(e) => setEditData((p) => ({ ...p, name: e.target.value }))} className="bg-background/50" />
                    </div>
                    <div>
                      <Label>מחיר (₪)</Label>
                      <Input type="number" value={editData.price || 0} onChange={(e) => setEditData((p) => ({ ...p, price: Number(e.target.value) }))} className="bg-background/50" />
                    </div>
                    <div className="md:col-span-2">
                      <Label>תיאור</Label>
                      <Textarea value={editData.description || ""} onChange={(e) => setEditData((p) => ({ ...p, description: e.target.value }))} className="bg-background/50" />
                    </div>
                    <div className="md:col-span-2">
                      <Label>תכונות</Label>
                      <div className="flex gap-2 mb-2">
                        <Input value={editFeature} onChange={(e) => setEditFeature(e.target.value)} placeholder="הוסף תכונה..." className="bg-background/50" onKeyDown={(e) => e.key === "Enter" && addEditFeature()} />
                        <Button onClick={addEditFeature} variant="secondary"><Plus size={18} /></Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(editData.features || []).map((f, i) => (
                          <span key={i} className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-2">
                            {f}<button onClick={() => removeEditFeature(i)}><X size={14} /></button>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Label className="flex items-center gap-2">
                        <Switch checked={editData.is_popular || false} onCheckedChange={(c) => setEditData((p) => ({ ...p, is_popular: c }))} />
                        הכי פופולרי
                      </Label>
                      <Label className="flex items-center gap-2">
                        <Switch checked={editData.is_active !== false} onCheckedChange={(c) => setEditData((p) => ({ ...p, is_active: c }))} />
                        פעיל
                      </Label>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={saveEdit} className="flex-1"><Save className="ml-2" size={18} />שמור</Button>
                    <Button onClick={cancelEdit} variant="outline"><X className="ml-2" size={18} />ביטול</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold">{pkg.name}</p>
                      {pkg.is_popular && <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs">פופולרי</span>}
                      {!pkg.is_active && <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded text-xs">לא פעיל</span>}
                    </div>
                    <p className="text-primary font-bold">₪{pkg.price}</p>
                    <p className="text-sm text-muted-foreground">{pkg.features.length} תכונות</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={pkg.is_active} onCheckedChange={(c) => updatePackage(pkg.id, { is_active: c })} />
                    <Button variant="outline" size="icon" onClick={() => startEdit(pkg)}><Edit2 size={18} /></Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(pkg.id)}><Trash2 size={18} /></Button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {packages.length === 0 && <p className="text-center text-muted-foreground py-8">אין חבילות עדיין. הוסף את החבילה הראשונה!</p>}
        </div>
      </div>
    </div>
  );
};

export default PricingTab;
