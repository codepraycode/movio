package com.example.mobile

import android.content.Intent
import android.content.pm.PackageManager
import android.provider.Settings
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    // flutter_nfc_kit reports whether NFC hardware exists and is switched on,
    // but NOT whether the phone can *emulate* a card (HCE) — that's a separate
    // Android system feature (android.hardware.nfc.hce), and no method in the
    // plugin exposes it. This small channel surfaces the two Android-only bits
    // the Dart side needs for PSD-104:
    //   hasHce          -> PackageManager.FEATURE_NFC_HOST_CARD_EMULATION
    //   openNfcSettings -> jump straight to the system NFC toggle
    private val nfcChannel = "movio/nfc"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, nfcChannel)
            .setMethodCallHandler { call, result ->
                when (call.method) {
                    "hasHce" -> result.success(
                        packageManager.hasSystemFeature(
                            PackageManager.FEATURE_NFC_HOST_CARD_EMULATION
                        )
                    )
                    "openNfcSettings" -> {
                        // Some no-NFC devices don't ship this settings screen at
                        // all — report failure instead of crashing the app.
                        try {
                            startActivity(Intent(Settings.ACTION_NFC_SETTINGS))
                            result.success(true)
                        } catch (e: Exception) {
                            result.success(false)
                        }
                    }
                    else -> result.notImplemented()
                }
            }
    }
}
