package com.scaleup

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.view.WindowManager
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class ScreenshotBlockerModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "ScreenshotBlocker"

  @ReactMethod
  fun enable() {
    val activity: Activity? = currentActivity
    activity ?: return
    activity.runOnUiThread {
      activity.window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
    }
  }

  @ReactMethod
  fun disable() {
    val activity: Activity? = currentActivity
    activity ?: return
    activity.runOnUiThread {
      activity.window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
    }
  }

  /**
   * Returns boolean via Promise - true if overlay permission is granted (i.e., apps can draw over).
   */
  @ReactMethod
  fun isOverlayAllowed(promise: Promise) {
    try {
      val allowed = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        Settings.canDrawOverlays(reactApplicationContext)
      } else {
        // pre-Marshmallow overlays are allowed by default
        true
      }
      promise.resolve(allowed)
    } catch (e: Exception) {
      promise.reject("overlay_check_error", e)
    }
  }

  /**
   * Open the system overlay permission screen for this app.
   * It launches Settings.ACTION_MANAGE_OVERLAY_PERMISSION with package:...
   */
  @ReactMethod
  fun openOverlaySettings() {
    val activity: Activity? = currentActivity
    val ctx = activity ?: reactApplicationContext
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      val intent = Intent(
        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
        Uri.parse("package:${reactApplicationContext.packageName}")
      )
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      ctx.startActivity(intent)
    }
  }
}
