import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, User, Mail, Calendar, Shield, Bell, Globe } from "lucide-react";
import { useNavigate } from "react-router";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

export default function AccountSettings() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isSaving, setIsSaving] = useState(false);
  const [profileImage, setProfileImage] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateProfile = useMutation(api.userProfile.updateProfile);
  const updateProfilePicture = useMutation(api.userProfile.updateProfilePicture);
  const generateUploadUrl = useMutation(api.userProfile.generateUploadUrl);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Initialize username and profile image from user data
  useEffect(() => {
    if (user) {
      setUsername(user.name || "");
      setProfileImage(user.image);
    }
  }, [user]);

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Toggle theme function
  const toggleTheme = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  // Handle profile picture change
  const handleProfilePictureChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    try {
      setIsSaving(true);
      
      // Get upload URL
      const uploadUrl = await generateUploadUrl();
      
      // Upload the file
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error("Upload failed");
      }

      const { storageId } = await result.json();

      // Update profile with new image
      const updateResult = await updateProfilePicture({ storageId });
      
      if (updateResult.imageUrl) {
        setProfileImage(updateResult.imageUrl);
        toast.success("Profile picture updated successfully!");
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      toast.error("Failed to update profile picture");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);
      
      await updateProfile({
        name: username || undefined,
      });

      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (user) {
      setUsername(user.name || "");
      setProfileImage(user.image);
    }
    toast.info("Changes discarded");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="cursor-pointer"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
              <p className="text-sm text-muted-foreground">
                Manage your account preferences and profile
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="profile" className="cursor-pointer">Profile</TabsTrigger>
              <TabsTrigger value="preferences" className="cursor-pointer">Preferences</TabsTrigger>
              <TabsTrigger value="security" className="cursor-pointer">Security</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your profile picture and personal details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile Picture */}
                  <div className="flex items-center gap-6">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={profileImage} alt="Profile" />
                      <AvatarFallback>
                        <User className="h-12 w-12" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                        className="hidden"
                      />
                      <Button 
                        variant="outline" 
                        className="cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSaving}
                      >
                        Change Picture
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG or GIF. Max size 2MB.
                      </p>
                    </div>
                  </div>

                  {/* Username */}
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>

                  {/* Email (Read-only) */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        value={user?.email || "Not available"}
                        disabled
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed directly. Contact support if needed.
                    </p>
                  </div>

                  {/* Account Info */}
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Account created:</span>
                      <span className="font-medium">
                        {user?._creationTime 
                          ? new Date(user._creationTime).toLocaleDateString()
                          : "Unknown"}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button 
                      className="cursor-pointer" 
                      onClick={handleSaveChanges}
                      disabled={isSaving}
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="cursor-pointer"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>
                    Customize how PokéMarket looks for you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Theme</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={theme === "light" ? "default" : "outline"}
                        onClick={() => toggleTheme("light")}
                        className="cursor-pointer"
                      >
                        Light
                      </Button>
                      <Button
                        variant={theme === "dark" ? "default" : "outline"}
                        onClick={() => toggleTheme("dark")}
                        className="cursor-pointer"
                      >
                        Dark
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>
                    Manage your notification preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-muted-foreground">
                          Receive updates about price changes
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={emailNotifications ? "default" : "outline"}
                      size="sm"
                      onClick={() => setEmailNotifications(!emailNotifications)}
                      className="cursor-pointer"
                    >
                      {emailNotifications ? "On" : "Off"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Language & Region</CardTitle>
                  <CardDescription>
                    Set your language and regional preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="language"
                        value="English (US)"
                        disabled
                        className="flex-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Manage your account security and authentication
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Change Password</p>
                        <p className="text-sm text-muted-foreground">
                          Update your account password
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" className="cursor-pointer">
                      Change
                    </Button>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-muted-foreground">
                          Add an extra layer of security
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" className="cursor-pointer">
                      Enable
                    </Button>
                  </div>

                  <div className="pt-4">
                    <p className="text-sm text-muted-foreground">
                      These features are coming soon. Contact support for immediate security concerns.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}