import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useVideos, Video } from "@/hooks/useVideos";
import { usePricing, PricingPackage } from "@/hooks/usePricing";
import { useSiteSettings, BackgroundSettings } from "@/hooks/useSiteSettings";
import { useAdminPassword } from "@/hooks/useAdminPassword";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Plus, Trash2, Edit2, Save, X, Home, Upload, Image as ImageIcon, Check, Search, Loader2 } from "lucide-react";
import ContentTab from "@/components/admin/ContentTab";
import ImagesTab from "@/components/admin/ImagesTab";
import SettingsTab from "@/components/admin/SettingsTab";
import OrdersTab from "@/components/admin/OrdersTab";
import CourseOrdersTab from "@/components/admin/CourseOrdersTab";
import RulesTab from "@/components/admin/RulesTab";
import CoursesTab from "@/components/admin/CoursesTab";
import PromoCodesTab from "@/components/admin/PromoCodesTab";
import CustomCursor from "@/components/CustomCursor";

// Preset backgrounds
const presetBackgrounds = [
  { id: "stars", name: "כוכבים", type: "animated" as const, customImage: undefined },
  { id: "galaxy", name: "גלקסיה", type: "animated" as const, customImage: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1920" },
  { id: "nebula", name: "ערפילית", type: "animated" as const, customImage: "https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=1920" },
  { id: "space", name: "חלל", type: "animated" as const, customImage: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1920" },
  { id: "minecraft", name: "מיינקראפט", type: "animated" as const, customImage: "https://images.unsplash.com/photo-1587573089734-599d584d93ba?w=1920" },
];

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  // Hooks
  const { videos, addVideo, updateVideo, deleteVideo } = useVideos();
  const { packages, addPackage, updatePackage, deletePackage } = usePricing();
  const { background, updateBackground, uploadBackgroundImage } = useSiteSettings();
  const { verifyPassword } = useAdminPassword();

  // Form states
  const [newVideo, setNewVideo] = useState({
    title: "",
    video_url: "",
    video_type: "youtube" as "youtube" | "tiktok" | "youtube_shorts",
    category: "general",
    display_order: 0,
    is_active: true,
  });

  // YouTube search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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

  const [bgSettings, setBgSettings] = useState<BackgroundSettings>(background);
  const [uploadingBg, setUploadingBg] = useState(false);
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setBgSettings(background);
  }, [background]);

  const handleBgImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBg(true);
    const url = await uploadBackgroundImage(file);
    if (url) {
      setBgSettings((prev) => ({ ...prev, customImage: url }));
      toast({ title: "תמונת הרקע הועלתה בהצלחה!" });
    } else {
      toast({ title: "שגיאה בהעלאת הרקע", variant: "destructive" });
    }
    if (bgFileInputRef.current) bgFileInputRef.current.value = "";
    setUploadingBg(false);
  };

  const handleLogin = async () => {
    setLoggingIn(true);
    const isValid = await verifyPassword(password);
    if (isValid) {
      setIsLoggedIn(true);
      toast({ title: "התחברת בהצלחה!" });
    } else {
      toast({ title: "סיסמה שגויה", variant: "destructive" });
    }
    setLoggingIn(false);
  };

  const handleAddVideo = async () => {
    if (!newVideo.title || !newVideo.video_url) {
      toast({ title: "נא למלא את כל השדות", variant: "destructive" });
      return;
    }
    const success = await addVideo(newVideo);
    if (success) {
      toast({ title: "הסרטון נוסף בהצלחה!" });
      setNewVideo({
        title: "",
        video_url: "",
        video_type: "youtube",
        category: "general",
        display_order: videos.length,
        is_active: true,
      });
    }
  };

  const handleDeleteVideo = async (id: string) => {
    const success = await deleteVideo(id);
    if (success) {
      toast({ title: "הסרטון נמחק בהצלחה!" });
    }
  };

  const handleSearchYouTube = async () => {
    if (!searchQuery.trim()) {
      toast({ title: "נא להזין שם סרטון לחיפוש", variant: "destructive" });
      return;
    }
    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('youtube-search', {
        body: { query: searchQuery, maxResults: 6 }
      });
      if (error) throw error;
      setSearchResults(data.videos || []);
      if (data.videos?.length === 0) {
        toast({ title: "לא נמצאו סרטונים" });
      }
    } catch (error: any) {
      console.error('Search error:', error);
      toast({ title: "שגיאה בחיפוש", description: error.message, variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result: any, type: "youtube" | "youtube_shorts") => {
    setNewVideo({
      ...newVideo,
      title: result.title,
      video_url: type === "youtube_shorts" ? result.shortsUrl : result.url,
      video_type: type,
    });
    setSearchResults([]);
    setSearchQuery("");
    toast({ title: "סרטון נבחר! לחץ על 'הוסף סרטון' להוספה" });
  };

  const handleAddPackage = async () => {
    if (!newPackage.name || newPackage.price <= 0) {
      toast({ title: "נא למלא שם ומחיר", variant: "destructive" });
      return;
    }
    const success = await addPackage({
      ...newPackage,
      display_order: packages.length,
    });
    if (success) {
      toast({ title: "החבילה נוספה בהצלחה!" });
      setNewPackage({
        name: "",
        description: "",
        price: 0,
        currency: "ILS",
        features: [],
        is_popular: false,
        is_active: true,
        display_order: 0,
      });
    }
  };

  const handleDeletePackage = async (id: string) => {
    const success = await deletePackage(id);
    if (success) {
      toast({ title: "החבילה נמחקה בהצלחה!" });
    }
  };

  const handleUpdateBackground = async () => {
    const success = await updateBackground(bgSettings);
    if (success) {
      toast({ title: "הרקע עודכן בהצלחה!" });
    }
  };

  const addFeatureToPackage = () => {
    if (newFeature.trim()) {
      setNewPackage((prev) => ({
        ...prev,
        features: [...prev.features, newFeature.trim()],
      }));
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setNewPackage((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen cosmic-bg flex items-center justify-center p-4">
        <CustomCursor />
        <div className="minecraft-card w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6 text-primary">
            🔐 כניסת מנהל
          </h1>
          <div className="space-y-4">
            <div>
              <Label htmlFor="password">סיסמה</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="הזן סיסמה..."
                className="bg-background/50"
              />
            </div>
            <Button onClick={handleLogin} disabled={loggingIn} className="w-full">
              {loggingIn ? "מתחבר..." : "התחבר"}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="w-full"
            >
              <Home className="ml-2" size={18} />
              חזרה לאתר
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen cosmic-bg p-4 md:p-8">
      <CustomCursor />
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-primary">🎛️ פאנל ניהול</h1>
          <Button variant="outline" onClick={() => navigate("/")}>
            <Home className="ml-2" size={18} />
            חזרה לאתר
          </Button>
        </div>

        <Tabs defaultValue="preview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-12 bg-card">
            <TabsTrigger value="preview">👁️ תצוגה</TabsTrigger>
            <TabsTrigger value="content">✏️ תוכן</TabsTrigger>
            <TabsTrigger value="images">🖼️ תמונות</TabsTrigger>
            <TabsTrigger value="videos">📹 סרטונים</TabsTrigger>
            <TabsTrigger value="pricing">💰 מחירון</TabsTrigger>
            <TabsTrigger value="courses">🎓 קורסים</TabsTrigger>
            <TabsTrigger value="rules">📜 חוקים</TabsTrigger>
            <TabsTrigger value="orders">📦 הזמנות</TabsTrigger>
            <TabsTrigger value="course-orders">🎓 הזמנות קורסים</TabsTrigger>
            <TabsTrigger value="promo-codes">🏷️ קופונים</TabsTrigger>
            <TabsTrigger value="background">🎨 רקע</TabsTrigger>
            <TabsTrigger value="settings">⚙️ הגדרות</TabsTrigger>
          </TabsList>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-4">
            <div className="minecraft-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">👁️ תצוגה מקדימה של האתר</h2>
                <Button variant="outline" onClick={() => window.open("/", "_blank")}>
                  פתח בחלון חדש
                </Button>
              </div>
              <div className="border-2 border-border rounded-lg overflow-hidden relative" style={{ height: "70vh" }}>
                <iframe 
                  src="/" 
                  className="w-full h-full pointer-events-none"
                  title="Site Preview"
                />
                {/* Overlay for custom cursor to work on preview */}
                <div className="absolute inset-0 bg-transparent" />
              </div>
            </div>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content">
            <ContentTab />
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images">
            <ImagesTab />
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos" className="space-y-6">
            {/* YouTube Search */}
            <div className="minecraft-card">
              <h2 className="text-xl font-bold mb-4">🔍 חיפוש סרטון ביוטיוב</h2>
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchYouTube()}
                  placeholder="הזן שם סרטון לחיפוש..."
                  className="bg-background/50"
                />
                <Button onClick={handleSearchYouTube} disabled={isSearching}>
                  {isSearching ? (
                    <Loader2 className="ml-2 animate-spin" size={18} />
                  ) : (
                    <Search className="ml-2" size={18} />
                  )}
                  חפש
                </Button>
              </div>
              
              {searchResults.length > 0 && (
                <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {searchResults.map((result) => (
                    <div key={result.videoId} className="bg-muted/30 rounded-lg overflow-hidden">
                      <img 
                        src={result.thumbnail} 
                        alt={result.title}
                        className="w-full h-24 object-cover"
                      />
                      <div className="p-3">
                        <p className="font-medium text-sm line-clamp-2 mb-2">{result.title}</p>
                        <p className="text-xs text-muted-foreground mb-3">{result.channelTitle}</p>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleSelectSearchResult(result, "youtube")}
                            className="flex-1 text-xs"
                          >
                            📺 סרטון
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleSelectSearchResult(result, "youtube_shorts")}
                            className="flex-1 text-xs"
                          >
                            🎬 Shorts
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="minecraft-card">
              <h2 className="text-xl font-bold mb-4">הוסף סרטון חדש</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="videoTitle">כותרת</Label>
                  <Input
                    id="videoTitle"
                    value={newVideo.title}
                    onChange={(e) =>
                      setNewVideo((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="שם הסרטון..."
                    className="bg-background/50"
                  />
                </div>
                <div>
                  <Label htmlFor="videoUrl">קישור</Label>
                  <Input
                    id="videoUrl"
                    value={newVideo.video_url}
                    onChange={(e) =>
                      setNewVideo((prev) => ({ ...prev, video_url: e.target.value }))
                    }
                    placeholder="https://youtube.com/... או https://youtube.com/shorts/..."
                    className="bg-background/50"
                  />
                </div>
                <div>
                  <Label htmlFor="videoType">סוג</Label>
                  <select
                    id="videoType"
                    value={newVideo.video_type}
                    onChange={(e) =>
                      setNewVideo((prev) => ({
                        ...prev,
                        video_type: e.target.value as "youtube" | "tiktok" | "youtube_shorts",
                      }))
                    }
                    className="w-full h-10 px-3 rounded-md bg-background/50 border border-input"
                  >
                    <option value="youtube">YouTube (סרטון רגיל)</option>
                    <option value="youtube_shorts">YouTube Shorts</option>
                    <option value="tiktok">TikTok</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleAddVideo} className="w-full">
                    <Plus className="ml-2" size={18} />
                    הוסף סרטון
                  </Button>
                </div>
              </div>
            </div>

            <div className="minecraft-card">
              <h2 className="text-xl font-bold mb-4">סרטונים קיימים ({videos.length})</h2>
              <div className="space-y-3">
                {videos.map((video) => (
                  <div
                    key={video.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {video.video_type === "youtube" ? "📺" : video.video_type === "youtube_shorts" ? "🎬" : "📱"}
                      </span>
                      <div>
                        <p className="font-medium">{video.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {video.video_type === "youtube" ? "YouTube" : video.video_type === "youtube_shorts" ? "YouTube Shorts" : "TikTok"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={video.is_active}
                        onCheckedChange={(checked) =>
                          updateVideo(video.id, { is_active: checked })
                        }
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDeleteVideo(video.id)}
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </div>
                ))}
                {videos.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    אין סרטונים עדיין. הוסף את הסרטון הראשון!
                  </p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing" className="space-y-6">
            <div className="minecraft-card">
              <h2 className="text-xl font-bold mb-4">הוסף חבילה חדשה</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="pkgName">שם החבילה</Label>
                  <Input
                    id="pkgName"
                    value={newPackage.name}
                    onChange={(e) =>
                      setNewPackage((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="בסיסי / מקצועי..."
                    className="bg-background/50"
                  />
                </div>
                <div>
                  <Label htmlFor="pkgPrice">מחיר (₪)</Label>
                  <Input
                    id="pkgPrice"
                    type="number"
                    value={newPackage.price}
                    onChange={(e) =>
                      setNewPackage((prev) => ({
                        ...prev,
                        price: Number(e.target.value),
                      }))
                    }
                    className="bg-background/50"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="pkgDesc">תיאור</Label>
                  <Textarea
                    id="pkgDesc"
                    value={newPackage.description || ""}
                    onChange={(e) =>
                      setNewPackage((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="תיאור קצר של החבילה..."
                    className="bg-background/50"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>תכונות</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      placeholder="הוסף תכונה..."
                      className="bg-background/50"
                      onKeyDown={(e) => e.key === "Enter" && addFeatureToPackage()}
                    />
                    <Button onClick={addFeatureToPackage} variant="secondary">
                      <Plus size={18} />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {newPackage.features.map((feature, index) => (
                      <span
                        key={index}
                        className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-2"
                      >
                        {feature}
                        <button onClick={() => removeFeature(index)}>
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Label htmlFor="pkgPopular" className="flex items-center gap-2">
                    <Switch
                      id="pkgPopular"
                      checked={newPackage.is_popular}
                      onCheckedChange={(checked) =>
                        setNewPackage((prev) => ({ ...prev, is_popular: checked }))
                      }
                    />
                    הכי פופולרי
                  </Label>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleAddPackage} className="w-full">
                    <Plus className="ml-2" size={18} />
                    הוסף חבילה
                  </Button>
                </div>
              </div>
            </div>

            <div className="minecraft-card">
              <h2 className="text-xl font-bold mb-4">חבילות קיימות ({packages.length})</h2>
              <div className="space-y-3">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold">{pkg.name}</p>
                        {pkg.is_popular && (
                          <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs">
                            פופולרי
                          </span>
                        )}
                      </div>
                      <p className="text-primary font-bold">₪{pkg.price}</p>
                      <p className="text-sm text-muted-foreground">
                        {pkg.features.length} תכונות
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={pkg.is_active}
                        onCheckedChange={(checked) =>
                          updatePackage(pkg.id, { is_active: checked })
                        }
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDeletePackage(pkg.id)}
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </div>
                ))}
                {packages.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    אין חבילות עדיין. הוסף את החבילה הראשונה!
                  </p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses">
            <CoursesTab />
          </TabsContent>

          {/* Rules Tab */}
          <TabsContent value="rules">
            <RulesTab />
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <OrdersTab />
          </TabsContent>

          {/* Course Orders Tab */}
          <TabsContent value="course-orders">
            <CourseOrdersTab />
          </TabsContent>

          {/* Promo Codes Tab */}
          <TabsContent value="promo-codes">
            <PromoCodesTab />
          </TabsContent>

          {/* Background Tab */}
          <TabsContent value="background" className="space-y-6">
            <div className="minecraft-card">
              <h2 className="text-xl font-bold mb-4">הגדרות רקע</h2>
              <div className="space-y-6">
                <div>
                  <Label>סוג רקע</Label>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    {(["solid", "gradient", "animated"] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() =>
                          setBgSettings((prev) => ({ ...prev, type }))
                        }
                        className={`p-4 rounded-lg border-2 transition-all ${
                          bgSettings.type === type
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <span className="text-2xl block mb-1">
                          {type === "solid" ? "⬛" : type === "gradient" ? "🌈" : "✨"}
                        </span>
                        <span className="text-sm">
                          {type === "solid"
                            ? "צבע אחיד"
                            : type === "gradient"
                            ? "גרדיאנט"
                            : "מונפש"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {bgSettings.type === "solid" && (
                  <div>
                    <Label htmlFor="bgColor">צבע רקע</Label>
                    <div className="flex gap-3 items-center mt-2">
                      <input
                        type="color"
                        id="bgColor"
                        value={bgSettings.color || "#0a0a0a"}
                        onChange={(e) =>
                          setBgSettings((prev) => ({ ...prev, color: e.target.value }))
                        }
                        className="w-16 h-10 rounded border-none cursor-pointer"
                      />
                      <Input
                        value={bgSettings.color || "#0a0a0a"}
                        onChange={(e) =>
                          setBgSettings((prev) => ({ ...prev, color: e.target.value }))
                        }
                        className="bg-background/50 flex-1"
                      />
                    </div>
                  </div>
                )}

                {bgSettings.type === "gradient" && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="gradFrom">צבע התחלתי</Label>
                      <div className="flex gap-2 items-center mt-2">
                        <input
                          type="color"
                          id="gradFrom"
                          value={bgSettings.gradientFrom || "#1a0a2e"}
                          onChange={(e) =>
                            setBgSettings((prev) => ({
                              ...prev,
                              gradientFrom: e.target.value,
                            }))
                          }
                          className="w-12 h-10 rounded"
                        />
                        <Input
                          value={bgSettings.gradientFrom || "#1a0a2e"}
                          onChange={(e) =>
                            setBgSettings((prev) => ({
                              ...prev,
                              gradientFrom: e.target.value,
                            }))
                          }
                          className="bg-background/50"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="gradTo">צבע סופי</Label>
                      <div className="flex gap-2 items-center mt-2">
                        <input
                          type="color"
                          id="gradTo"
                          value={bgSettings.gradientTo || "#0a0a0a"}
                          onChange={(e) =>
                            setBgSettings((prev) => ({
                              ...prev,
                              gradientTo: e.target.value,
                            }))
                          }
                          className="w-12 h-10 rounded"
                        />
                        <Input
                          value={bgSettings.gradientTo || "#0a0a0a"}
                          onChange={(e) =>
                            setBgSettings((prev) => ({
                              ...prev,
                              gradientTo: e.target.value,
                            }))
                          }
                          className="bg-background/50"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {bgSettings.type === "animated" && (
                  <div className="space-y-4">
                    {/* Preset Backgrounds */}
                    <div>
                      <Label className="mb-2 block">בחר רקע מוכן</Label>
                      <div className="grid grid-cols-5 gap-2">
                        {presetBackgrounds.map((preset) => (
                          <button
                            key={preset.id}
                            onClick={() =>
                              setBgSettings((prev) => ({ 
                                ...prev, 
                                type: "animated",
                                customImage: preset.customImage 
                              }))
                            }
                            className={`relative p-2 rounded-lg border-2 transition-all overflow-hidden h-20 ${
                              bgSettings.customImage === preset.customImage
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            {preset.customImage ? (
                              <img 
                                src={preset.customImage} 
                                alt={preset.name}
                                className="absolute inset-0 w-full h-full object-cover opacity-60"
                              />
                            ) : (
                              <div className="absolute inset-0 bg-gradient-to-b from-purple-900/50 to-black" />
                            )}
                            <span className="relative z-10 text-xs font-medium text-white drop-shadow-lg">
                              {preset.name}
                            </span>
                            {bgSettings.customImage === preset.customImage && (
                              <div className="absolute top-1 left-1 z-10">
                                <Check size={14} className="text-primary" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Upload */}
                    <div className="border-t border-border pt-4">
                      <Label className="mb-2 block">או העלה תמונה משלך</Label>
                      <div className="flex flex-col md:flex-row gap-4 items-start">
                        <div className="w-32 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/30">
                          {bgSettings.customImage && !presetBackgrounds.find(p => p.customImage === bgSettings.customImage) ? (
                            <img 
                              src={bgSettings.customImage} 
                              alt="Custom Background" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <input
                            type="file"
                            ref={bgFileInputRef}
                            onChange={handleBgImageUpload}
                            accept="image/*"
                            className="hidden"
                          />
                          <Button
                            onClick={() => bgFileInputRef.current?.click()}
                            disabled={uploadingBg}
                            variant="outline"
                            size="sm"
                          >
                            <Upload className="ml-2" size={16} />
                            {uploadingBg ? "מעלה..." : "העלה תמונת רקע"}
                          </Button>
                          {bgSettings.customImage && !presetBackgrounds.find(p => p.customImage === bgSettings.customImage) && (
                            <Button
                              onClick={() => setBgSettings((prev) => ({ ...prev, customImage: undefined }))}
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                            >
                              <X className="ml-2" size={16} />
                              הסר תמונה
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <Button onClick={handleUpdateBackground} className="w-full">
                  <Save className="ml-2" size={18} />
                  שמור שינויים
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
