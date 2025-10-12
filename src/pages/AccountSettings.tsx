import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, User, Mail, Calendar, Shield, Bell, Globe, Crown, LogOut, Eye, EyeOff, Check, X as XIcon } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuthActions } from "@convex-dev/auth/react";
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
  const [preferredCurrency, setPreferredCurrency] = useState<string>("USD");
  const [isSaving, setIsSaving] = useState(false);
  const [profileImage, setProfileImage] = useState<string | undefined>(undefined);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong">("weak");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateProfile = useMutation(api.userProfile.updateProfile);
  const updateProfilePicture = useMutation(api.userProfile.updateProfilePicture);
  const generateUploadUrl = useMutation(api.userProfile.generateUploadUrl);
  const checkHasPassword = useMutation(api.userProfile.hasPassword);
  const { signOut, signIn } = useAuthActions();

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
      setPreferredCurrency(user.preferredCurrency || "USD");
    }
  }, [user]);

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Check if user has password
  useEffect(() => {
    const checkPassword = async () => {
      try {
        const result = await checkHasPassword();
        setHasPassword(result.hasPassword);
      } catch (error) {
        console.error("Error checking password:", error);
      }
    };
    if (user) {
      checkPassword();
    }
  }, [user, checkHasPassword]);

  // Calculate password strength
  useEffect(() => {
    if (newPassword.length === 0) {
      setPasswordStrength("weak");
      return;
    }
    
    let strength = 0;
    if (newPassword.length >= 8) strength++;
    if (newPassword.length >= 12) strength++;
    if (/[A-Z]/.test(newPassword)) strength++;
    if (/[a-z]/.test(newPassword)) strength++;
    if (/[0-9]/.test(newPassword)) strength++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) strength++;
    
    if (strength <= 2) setPasswordStrength("weak");
    else if (strength <= 4) setPasswordStrength("medium");
    else setPasswordStrength("strong");
  }, [newPassword]);

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
        preferredCurrency: preferredCurrency,
      });

      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (user) {
      setUsername(user.name || "");
      setProfileImage(user.image);
      setPreferredCurrency(user.preferredCurrency || "USD");
    }
    toast.info("Changes discarded");
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      setShowSignOutDialog(false);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
      setShowSignOutDialog(false);
    }
  };

  // Handle password set/change
  const handlePasswordSubmit = async () => {
    try {
      // Validate passwords match
      if (newPassword !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }

      // Validate password requirements
      if (newPassword.length < 8) {
        toast.error("Password must be at least 8 characters long");
        return;
      }
      if (!/[A-Z]/.test(newPassword)) {
        toast.error("Password must contain at least one uppercase letter");
        return;
      }
      if (!/[a-z]/.test(newPassword)) {
        toast.error("Password must contain at least one lowercase letter");
        return;
      }
      if (!/[0-9]/.test(newPassword)) {
        toast.error("Password must contain at least one number");
        return;
      }
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
        toast.error("Password must contain at least one special character");
        return;
      }

      setIsSaving(true);

      const formData = new FormData();
      formData.append("email", user?.email || "");
      formData.append("password", newPassword);
      formData.append("flow", hasPassword ? "reset-verification" : "signUp");

      if (hasPassword) {
        formData.append("currentPassword", currentPassword);
      }

      await signIn("password", formData);

      toast.success(hasPassword ? "Password changed successfully!" : "Password set successfully!");
      setShowPasswordDialog(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setHasPassword(true);
    } catch (error) {
      console.error("Error setting/changing password:", error);
      toast.error(hasPassword ? "Failed to change password. Check your current password." : "Failed to set password");
    } finally {
      setIsSaving(false);
    }
  };

  // Password requirement checks
  const passwordRequirements = [
    { label: "At least 8 characters", met: newPassword.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(newPassword) },
    { label: "One lowercase letter", met: /[a-z]/.test(newPassword) },
    { label: "One number", met: /[0-9]/.test(newPassword) },
    { label: "One special character", met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {/* Password Management Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{hasPassword ? "Change Password" : "Set Password"}</DialogTitle>
            <DialogDescription>
              {hasPassword 
                ? "Enter your current password and choose a new one" 
                : "Create a password to enable password-based login"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {hasPassword && (
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-7 w-7"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-7 w-7"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {newPassword && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Strength:</span>
                  <span className={
                    passwordStrength === "weak" ? "text-red-500" :
                    passwordStrength === "medium" ? "text-yellow-500" :
                    "text-green-500"
                  }>
                    {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
                  </span>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-7 w-7"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2 pt-2">
              <p className="text-sm font-medium">Password Requirements:</p>
              <div className="space-y-1">
                {passwordRequirements.map((req, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    {req.met ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <XIcon className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={req.met ? "text-green-500" : "text-muted-foreground"}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordDialog(false);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePasswordSubmit}
              disabled={
                isSaving ||
                !newPassword ||
                !confirmPassword ||
                newPassword !== confirmPassword ||
                (hasPassword && !currentPassword) ||
                passwordRequirements.some(req => !req.met)
              }
            >
              {isSaving ? "Saving..." : hasPassword ? "Change Password" : "Set Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sign Out Confirmation Dialog */}
      <AlertDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out of your account?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out? You'll need to sign in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSignOut}>
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                      maxLength={50}
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum 50 characters ({username.length}/50)
                    </p>
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
                    <div className="flex items-center gap-2 text-sm">
                      <Crown className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Current plan:</span>
                      <span className="font-medium">{user?.plan || "Basic"} {user?.plan === "Basic" || !user?.plan ? "(Free)" : ""}</span>
                    </div>
                    {user?.plan && user?.plan !== "Basic" && user?.planExpiresAt && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Plan expires:</span>
                        <span className="font-medium">
                          {new Date(user.planExpiresAt).toLocaleDateString()}
                          {" "}
                          ({Math.ceil((user.planExpiresAt - Date.now()) / (1000 * 60 * 60 * 24))} days remaining)
                        </span>
                      </div>
                    )}
                    {user?.plan && user?.plan !== "Basic" && !user?.planExpiresAt && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Plan expires:</span>
                        <span className="font-medium text-green-600 dark:text-green-400">Lifetime Access</span>
                      </div>
                    )}
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
                  <CardTitle>Display Currency</CardTitle>
                  <CardDescription>
                    Choose your preferred currency for displaying prices {user?.plan !== "Pro" && user?.plan !== "Enterprise" && "(Pro Feature)"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Preferred Currency</Label>
                    <div className="flex items-center gap-2">
                      <select
                        id="currency"
                        value={preferredCurrency}
                        onChange={(e) => setPreferredCurrency(e.target.value)}
                        disabled={user?.plan !== "Pro" && user?.plan !== "Enterprise"}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="USD">USD ($) - US Dollar</option>
                        <option value="GBP">GBP (£) - British Pound</option>
                        <option value="EUR">EUR (€) - Euro</option>
                        <option value="CNY">CNY (¥) - Chinese Yuan</option>
                      </select>
                    </div>
                    {user?.plan !== "Pro" && user?.plan !== "Enterprise" && (
                      <p className="text-xs text-muted-foreground">
                        Upgrade to Pro to change your display currency.{" "}
                        <button
                          onClick={() => navigate("/premium")}
                          className="text-primary hover:underline"
                        >
                          View Plans
                        </button>
                      </p>
                    )}
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
                        <p className="font-medium">{hasPassword ? "Change Password" : "Set Password"}</p>
                        <p className="text-sm text-muted-foreground">
                          {hasPassword 
                            ? "Update your account password" 
                            : "Create a password for password-based login"}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="cursor-pointer"
                      onClick={() => setShowPasswordDialog(true)}
                    >
                      {hasPassword ? "Change" : "Set Password"}
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

              <Card>
                <CardHeader>
                  <CardTitle>Account Actions</CardTitle>
                  <CardDescription>
                    Manage your account session
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-2">
                      <LogOut className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Sign Out</p>
                        <p className="text-sm text-muted-foreground">
                          Sign out of your account on this device
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="cursor-pointer"
                      onClick={() => setShowSignOutDialog(true)}
                    >
                      Sign Out
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
    </>
  );
}