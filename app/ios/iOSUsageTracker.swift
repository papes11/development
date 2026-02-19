import Foundation
import DeviceActivity

// iOS Usage Time Tracking - DeSocial
// Tracks only: Instagram, WhatsApp, YouTube, Facebook, X

class iOSUsageTracker {
    
    static let shared = iOSUsageTracker()
    
    let supportedApps = [
        "instagram": "com.instagram.ios",
        "whatsapp": "com.whatsapp",
        "youtube": "com.google.youtube",
        "facebook": "com.facebook.Facebook",
        "x": "com.twitter.iphone"
    ]
    
    private let prefs = UserDefaults(suiteName: "group.desocial.tracking")
    private let LAST_USAGE_KEY = "last_usage_"
    private let TOTAL_EARNED_KEY = "total_earned_"
    
    // Get current usage time for all supported apps (in minutes)
    private func getCurrentUsage() -> [String: Int] {
        var usageTime = [String: Int]()
        
        let calendar = Calendar.current
        let thirtyDaysAgo = calendar.date(byAdding: .day, value: -30, to: Date())!
        
        let deviceActivity = DeviceActivityReport.filter(
            users: .all,
            devices: .all,
            activity: .all,
            for: thirtyDaysAgo...Date()
        )
        
        deviceActivity.forEach { report in
            supportedApps.forEach { appName, bundleId in
                if let usage = report.totals[bundleId] {
                    let minutes = Int(usage.totalActivityDuration.timeInterval / 60)
                    usageTime[appName] = minutes
                }
            }
        }
        
        supportedApps.forEach { appName, _ in
            if usageTime[appName] == nil {
                usageTime[appName] = 0
            }
        }
        
        return usageTime
    }
    
    // Get new minutes earned since last check
    func getNewMinutesEarned() -> [String: Int] {
        let currentUsage = getCurrentUsage()
        var newMinutes = [String: Int]()
        var totalNewMinutes = 0
        
        supportedApps.forEach { appName, _ in
            let currentMinutes = currentUsage[appName] ?? 0
            let lastMinutes = prefs?.integer(forKey: LAST_USAGE_KEY + appName) ?? 0
            let delta = currentMinutes - lastMinutes
            
            if delta > 0 {
                newMinutes[appName] = delta
                totalNewMinutes += delta
            } else {
                newMinutes[appName] = 0
            }
        }
        
        // Save current usage for next check
        currentUsage.forEach { appName, minutes in
            prefs?.set(minutes, forKey: LAST_USAGE_KEY + appName)
        }
        
        return newMinutes
    }
    
    // Get total minutes earned (accumulated)
    func getTotalMinutesEarned() -> Int {
        return prefs?.integer(forKey: TOTAL_EARNED_KEY) ?? 0
    }
    
    // Add new minutes to total earned
    func addMinutesEarned(_ minutes: Int) {
        let currentTotal = getTotalMinutesEarned()
        prefs?.set(currentTotal + minutes, forKey: TOTAL_EARNED_KEY)
    }
    
    // Reset earned minutes (after claim)
    func resetEarnedMinutes() {
        prefs?.set(0, forKey: TOTAL_EARNED_KEY)
        
        supportedApps.forEach { appName, _ in
            let currentUsage = getCurrentUsage()
            let minutes = currentUsage[appName] ?? 0
            prefs?.set(minutes, forKey: LAST_USAGE_KEY + appName)
        }
    }
}