import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useCourses, Course } from "@/hooks/useCourses";
import { Plus, Trash2, Edit2, Save, X, GraduationCap } from "lucide-react";

const CoursesTab = () => {
  const { toast } = useToast();
  const { courses, addCourse, updateCourse, deleteCourse } = useCourses();

  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    price: 0,
    currency: "ILS",
    button_text: "הרשמה לקורס",
    is_active: true,
    display_order: 0,
    video_url: "",
    instructor_name: "",
    instructor_image: "",
    full_description: "",
    syllabus: [] as any[],
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Course>>({});

  const handleAddCourse = async () => {
    if (!newCourse.title || newCourse.price <= 0) {
      toast({ title: "נא למלא שם ומחיר", variant: "destructive" });
      return;
    }

    const success = await addCourse({
      ...newCourse,
      display_order: courses.length,
    });

    if (success) {
      toast({ title: "הקורס נוסף בהצלחה!" });
      setNewCourse({
        title: "",
        description: "",
        price: 0,
        currency: "ILS",
        button_text: "הרשמה לקורס",
        is_active: true,
        display_order: 0,
        video_url: "",
        instructor_name: "",
        instructor_image: "",
        full_description: "",
        syllabus: [],
      });
    }
  };

  const handleDeleteCourse = async (id: string) => {
    const success = await deleteCourse(id);
    if (success) {
      toast({ title: "הקורס נמחק בהצלחה!" });
    }
  };

  const startEdit = (course: Course) => {
    setEditingId(course.id);
    setEditData({
      title: course.title,
      description: course.description || "",
      price: course.price,
      button_text: course.button_text,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async () => {
    if (!editingId) return;

    const success = await updateCourse(editingId, editData);
    if (success) {
      toast({ title: "הקורס עודכן בהצלחה!" });
      setEditingId(null);
      setEditData({});
    }
  };

  return (
    <div className="space-y-6">
      {/* Add New Course */}
      <div className="minecraft-card">
        <h2 className="text-xl font-bold mb-4">הוסף קורס חדש</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="courseTitle">שם הקורס</Label>
            <Input
              id="courseTitle"
              value={newCourse.title}
              onChange={(e) =>
                setNewCourse((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="קורס עריכת וידאו..."
              className="bg-background/50"
            />
          </div>
          <div>
            <Label htmlFor="coursePrice">מחיר (₪)</Label>
            <Input
              id="coursePrice"
              type="number"
              value={newCourse.price}
              onChange={(e) =>
                setNewCourse((prev) => ({
                  ...prev,
                  price: Number(e.target.value),
                }))
              }
              className="bg-background/50"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="courseDesc">תיאור הקורס</Label>
            <Textarea
              id="courseDesc"
              value={newCourse.description}
              onChange={(e) =>
                setNewCourse((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="תיאור מפורט של הקורס..."
              className="bg-background/50"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="courseButton">טקסט כפתור</Label>
            <Input
              id="courseButton"
              value={newCourse.button_text}
              onChange={(e) =>
                setNewCourse((prev) => ({
                  ...prev,
                  button_text: e.target.value,
                }))
              }
              placeholder="הרשמה לקורס"
              className="bg-background/50"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleAddCourse} className="w-full">
              <Plus className="ml-2" size={18} />
              הוסף קורס
            </Button>
          </div>
        </div>
      </div>

      {/* Existing Courses */}
      <div className="minecraft-card">
        <h2 className="text-xl font-bold mb-4">קורסים קיימים ({courses.length})</h2>
        <div className="space-y-3">
          {courses.map((course) => (
            <div
              key={course.id}
              className="p-4 bg-muted/30 rounded-lg border border-border/50"
            >
              {editingId === course.id ? (
                <div className="space-y-3">
                  <Input
                    value={editData.title || ""}
                    onChange={(e) =>
                      setEditData((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="שם הקורס"
                    className="bg-background/50"
                  />
                  <Textarea
                    value={editData.description || ""}
                    onChange={(e) =>
                      setEditData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="תיאור הקורס"
                    className="bg-background/50"
                    rows={2}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="number"
                      value={editData.price || 0}
                      onChange={(e) =>
                        setEditData((prev) => ({ ...prev, price: Number(e.target.value) }))
                      }
                      placeholder="מחיר"
                      className="bg-background/50"
                    />
                    <Input
                      value={editData.button_text || ""}
                      onChange={(e) =>
                        setEditData((prev) => ({ ...prev, button_text: e.target.value }))
                      }
                      placeholder="טקסט כפתור"
                      className="bg-background/50"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={saveEdit} size="sm">
                      <Save size={16} className="ml-1" />
                      שמור
                    </Button>
                    <Button onClick={cancelEdit} variant="outline" size="sm">
                      <X size={16} className="ml-1" />
                      ביטול
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 rounded-lg bg-primary/20 text-primary shrink-0">
                      <GraduationCap size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground">{course.title}</h3>
                      {course.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {course.description}
                        </p>
                      )}
                      <p className="text-primary font-bold mt-2">₪{course.price}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={course.is_active}
                      onCheckedChange={(checked) =>
                        updateCourse(course.id, { is_active: checked })
                      }
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => startEdit(course)}
                    >
                      <Edit2 size={16} />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteCourse(course.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {courses.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              אין קורסים עדיין. הוסף את הקורס הראשון!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoursesTab;
