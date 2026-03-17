import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CourseSyllabus {
  title: string;
  items: string[];
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  full_description: string | null;
  price: number;
  currency: string;
  button_text: string;
  is_active: boolean;
  display_order: number;
  video_url: string | null;
  instructor_name: string | null;
  instructor_image: string | null;
  syllabus: CourseSyllabus[] | null;
  created_at: string;
}

// Helper to cast DB rows
const toCourse = (row: any): Course => ({
  ...row,
  syllabus: Array.isArray(row.syllabus) ? row.syllabus : [],
});

export const useCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("display_order", { ascending: true });

      if (data && !error) {
        setCourses(data.map(toCourse));
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const addCourse = async (course: Omit<Course, "id" | "created_at">) => {
    try {
      const { data, error } = await supabase
        .from("courses")
        .insert([course])
        .select()
        .single();

      if (data && !error) {
        setCourses((prev) => [...prev, data as Course]);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error adding course:", error);
      return false;
    }
  };

  const updateCourse = async (id: string, updates: Partial<Course>) => {
    try {
      const { error } = await supabase
        .from("courses")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (!error) {
        setCourses((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating course:", error);
      return false;
    }
  };

  const deleteCourse = async (id: string) => {
    try {
      const { error } = await supabase.from("courses").delete().eq("id", id);

      if (!error) {
        setCourses((prev) => prev.filter((c) => c.id !== id));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting course:", error);
      return false;
    }
  };

  return { courses, loading, addCourse, updateCourse, deleteCourse, refetch: fetchCourses };
};
