package com.desocial.tracking

import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.SharedPreferences
import android.os.Build
import java.util.concurrent.TimeUnit

// Android Usage Time Tracking - DeSocial
// Tracks only: Instagram, WhatsApp, YouTube, Facebook, X

class AndroidUsageTracker(private val context: Context) {
    
    private val prefs: SharedPreferences = context.getSharedPreferences(
        "desocial_tracking",
        Context.MODE_PRIVATE
    )
    
    private val LAST_USAGE_KEY = "last_usage_"
    private val TOTAL_EARNED_KEY = "total_earned"
    
    private val supportedApps = mapOf(
        "instagram" to "com.instagram.android",
        "whatsapp" to "com.whatsapp",
        "youtube" to "com.google.android.youtube",
        "facebook" to "com.facebook.katana",
        "x" to "com.twitter.android"
    )
    
    // Get current usage time for all supported apps (in minutes)
    private fun getCurrentUsage(): Map<String, Int> {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
            return emptyMap()
        }
        
        val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        
        val endTime = System.currentTimeMillis()
        val startTime = endTime - TimeUnit.DAYS.toMillis(30)
        
        val stats = usageStatsManager.queryUsageStats(
            UsageStatsManager.INTERVAL_DAILY,
            startTime,
            endTime
        )
        
        val usageTime = mutableMapOf<String, Int>()
        
        stats?.forEach { stat ->
            supportedApps.forEach { (appName, packageName) ->
                if (stat.packageName == packageName) {
                    val minutes = (stat.totalTimeInForeground / 60000).toInt()
                    usageTime[appName] = (usageTime[appName] ?: 0) + minutes
                }
            }
        }
        
        supportedApps.forEach { (appName, _) ->
            if (usageTime[appName] == null) {
                usageTime[appName] = 0
            }
        }
        
        return usageTime
    }
    
    // Get new minutes earned since last check
    fun getNewMinutesEarned(): Map<String, Int> {
        val currentUsage = getCurrentUsage()
        val newMinutes = mutableMapOf<String, Int>()
        
        supportedApps.forEach { (appName, _) ->
            val currentMinutes = currentUsage[appName] ?: 0
            val lastMinutes = prefs.getInt(LAST_USAGE_KEY + appName, 0)
            val delta = currentMinutes - lastMinutes
            
            newMinutes[appName] = if (delta > 0) delta else 0
        }
        
        // Save current usage for next check
        prefs.edit().apply {
            currentUsage.forEach { (appName, minutes) ->
                putInt(LAST_USAGE_KEY + appName, minutes)
            }
            apply()
        }
        
        return newMinutes
    }
    
    // Get total new minutes (sum of all apps)
    fun getTotalNewMinutes(): Int {
        val newMinutes = getNewMinutesEarned()
        return newMinutes.values.sum()
    }
    
    // Get total minutes earned (accumulated)
    fun getTotalMinutesEarned(): Int {
        return prefs.getInt(TOTAL_EARNED_KEY, 0)
    }
    
    // Add new minutes to total earned
    fun addMinutesEarned(minutes: Int) {
        val currentTotal = getTotalMinutesEarned()
        prefs.edit().apply {
            putInt(TOTAL_EARNED_KEY, currentTotal + minutes)
            apply()
        }
    }
    
    // Reset earned minutes (after claim)
    fun resetEarnedMinutes() {
        prefs.edit().apply {
            putInt(TOTAL_EARNED_KEY, 0)
            apply()
        }
        
        val currentUsage = getCurrentUsage()
        prefs.edit().apply {
            currentUsage.forEach { (appName, minutes) ->
                putInt(LAST_USAGE_KEY + appName, minutes)
            }
            apply()
        }
    }
}