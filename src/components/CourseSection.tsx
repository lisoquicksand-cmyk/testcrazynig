import { useState } from "react";
import { useCourses, Course } from "@/hooks/useCourses";
import { useSiteContent } from "@/hooks/useSiteContent";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import CourseCheckoutDialog from "@/components/CourseCheckoutDialog";

const CourseSection = () => {
  const { courses, loading } = useCourses();
  const { content } = useSiteContent();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const activeCourses = courses.filter((c) => c.is_active);

  const handleCourseClick = (course: Course) => {
    setSelectedCourse(course);
    setCheckoutOpen(true);
  };

  if (loading) {
    return (
      <section id="courses" className="py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-muted-foreground">טוען קורסים...</p>
        </div>
      </section>
    );
  }

  return (
    <section id="courses" className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h2
          className="section-title mb-10"
          style={{ fontFamily: `'${content.fontFamily}', sans-serif` }}
        >
          🎓 קורסים
        </h2>

        {activeCourses.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeCourses.map((course) => (
              <div
                key={course.id}
                className="minecraft-card flex flex-col transition-all duration-300 hover:scale-105"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-primary/20 text-primary">
                    <GraduationCap className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">
                    {course.title}
                  </h3>
                </div>

                {course.description && (
                  <p className="text-muted-foreground mb-6 flex-1 leading-relaxed">
                    {course.description}
                  </p>
                )}

                <div className="mt-auto">
                  <div className="text-center mb-4">
                    <span className="text-3xl font-extrabold text-primary">
                      ₪{course.price}
                    </span>
                  </div>

                  <Button 
                    className="w-full py-3 font-bold"
                    onClick={() => handleCourseClick(course)}
                  >
                    {course.button_text}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="minecraft-card text-center py-12">
            <GraduationCap className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              אין קורסים זמינים כרגע. הוסף קורסים דרך פאנל הניהול!
            </p>
          </div>
        )}
      </div>

      <CourseCheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        selectedCourse={selectedCourse}
      />
    </section>
  );
};

export default CourseSection;
