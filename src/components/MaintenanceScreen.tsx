import { motion } from "framer-motion";
import { Wrench, Clock, Shield, Database } from "lucide-react";

interface MaintenanceScreenProps {
  message?: string;
  startTime?: number;
}

export function MaintenanceScreen({ message, startTime }: MaintenanceScreenProps) {
  const defaultMessage = "Performing weekly maintenance. We'll be back shortly!";
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-2xl mx-auto px-6 text-center space-y-8">
        {/* Animated Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center"
        >
          <img 
            src="https://harmless-tapir-303.convex.cloud/api/storage/3618c315-1be3-4a51-8bd2-7205d0c4fb5a" 
            alt="PokéMarket Logo" 
            className="h-24 w-24 opacity-90"
          />
        </motion.div>

        {/* Animated Wrench Icon */}
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex justify-center"
        >
          <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center">
            <Wrench className="h-10 w-10 text-primary" />
          </div>
        </motion.div>

        {/* Main Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4"
        >
          <h1 className="text-4xl font-bold tracking-tight">Under Maintenance</h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            {message || defaultMessage}
          </p>
        </motion.div>

        {/* Maintenance Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8"
        >
          <div className="space-y-2">
            <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto">
              <Database className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-sm font-medium">Data Cleanup</p>
            <p className="text-xs text-muted-foreground">Optimizing database</p>
          </div>
          
          <div className="space-y-2">
            <div className="h-12 w-12 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto">
              <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm font-medium">Security Check</p>
            <p className="text-xs text-muted-foreground">Running diagnostics</p>
          </div>
          
          <div className="space-y-2">
            <div className="h-12 w-12 bg-purple-500/10 rounded-lg flex items-center justify-center mx-auto">
              <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-sm font-medium">System Update</p>
            <p className="text-xs text-muted-foreground">Applying improvements</p>
          </div>
        </motion.div>

        {/* Estimated Time */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="pt-8 text-sm text-muted-foreground"
        >
          <p>Estimated completion time: 5-10 minutes</p>
          <p className="mt-2">Thank you for your patience!</p>
        </motion.div>
      </div>
    </div>
  );
}
