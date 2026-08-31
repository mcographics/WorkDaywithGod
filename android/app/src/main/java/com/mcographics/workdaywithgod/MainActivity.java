package com.mcographics.workdaywithgod;

import android.app.AlertDialog;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.webkit.WebView;
import android.widget.Toast;

import androidx.core.content.FileProvider;

import com.getcapacitor.BridgeActivity;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends BridgeActivity {
    private static final String RELEASES_API = "https://api.github.com/repos/mcographics/WorkDaywithGod/releases?per_page=30";
    private static final String PREFS_NAME = "workdaywithgod-native-updates";
    private static final String LAST_UPDATE_CHECK_KEY = "last-update-check";
    private static final long UPDATE_CHECK_INTERVAL_MS = 12L * 60L * 60L * 1000L;
    private static final ExecutorService UPDATE_EXECUTOR = Executors.newSingleThreadExecutor();

    private AlertDialog downloadDialog;
    private File pendingUpdateApk;
    private boolean waitingForInstallPermission;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        stabilizeWebViewTextScale();
        new Handler(Looper.getMainLooper()).postDelayed(() -> checkForAndroidUpdate(false), 1600L);
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (!waitingForInstallPermission) return;
        waitingForInstallPermission = false;
        if (pendingUpdateApk != null && canInstallPackages()) {
            launchPackageInstaller(pendingUpdateApk);
        } else if (pendingUpdateApk != null) {
            Toast.makeText(this, "Install permission was not enabled. You can try the update again later.", Toast.LENGTH_LONG).show();
        }
    }

    @Override
    protected void onDestroy() {
        if (downloadDialog != null) downloadDialog.dismiss();
        super.onDestroy();
    }

    private void stabilizeWebViewTextScale() {
        try {
            WebView webView = getBridge() == null ? null : getBridge().getWebView();
            if (webView != null) {
                // Keep the application chrome/layout independent from Android's global
                // font-size multiplier. Work Day with God already provides its own
                // Verse Card, devotional, and Scripture text-size controls.
                webView.getSettings().setTextZoom(100);
            }
        } catch (Exception ignored) {
            // A text-zoom failure must never prevent the devotional from opening.
        }
    }

    private void checkForAndroidUpdate(boolean force) {
        SharedPreferences preferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        long now = System.currentTimeMillis();
        long lastCheck = preferences.getLong(LAST_UPDATE_CHECK_KEY, 0L);
        if (!force && now - lastCheck < UPDATE_CHECK_INTERVAL_MS) return;
        preferences.edit().putLong(LAST_UPDATE_CHECK_KEY, now).apply();

        UPDATE_EXECUTOR.execute(() -> {
            try {
                UpdateInfo update = fetchLatestAndroidRelease();
                if (update != null && compareVersions(update.version, BuildConfig.VERSION_NAME) > 0) {
                    runOnUiThread(() -> showUpdateAvailable(update));
                }
            } catch (Exception ignored) {
                // Update checks are deliberately non-blocking. The app remains fully
                // offline-capable when GitHub or the network is unavailable.
            }
        });
    }

    private UpdateInfo fetchLatestAndroidRelease() throws Exception {
        HttpURLConnection connection = openConnection(RELEASES_API, "application/vnd.github+json");
        try {
            int responseCode = connection.getResponseCode();
            if (responseCode < 200 || responseCode >= 300) return null;
            String payload = readText(connection);
            JSONArray releases = new JSONArray(payload);
            for (int index = 0; index < releases.length(); index++) {
                JSONObject release = releases.optJSONObject(index);
                if (release == null || release.optBoolean("draft") || release.optBoolean("prerelease")) continue;
                String tag = release.optString("tag_name", "");
                if (!tag.startsWith("android-v")) continue;

                String version = tag.substring("android-v".length());
                JSONArray assets = release.optJSONArray("assets");
                if (assets == null) continue;
                for (int assetIndex = 0; assetIndex < assets.length(); assetIndex++) {
                    JSONObject asset = assets.optJSONObject(assetIndex);
                    if (asset == null) continue;
                    String name = asset.optString("name", "");
                    String downloadUrl = asset.optString("browser_download_url", "");
                    if (name.toLowerCase().endsWith(".apk") && !downloadUrl.isEmpty()) {
                        return new UpdateInfo(version, name, downloadUrl, release.optString("html_url", ""));
                    }
                }
            }
            return null;
        } finally {
            connection.disconnect();
        }
    }

    private void showUpdateAvailable(UpdateInfo update) {
        if (isFinishing() || isDestroyed()) return;
        new AlertDialog.Builder(this)
            .setTitle("Work Day with God update available")
            .setMessage("Android " + update.version + " is available.\n\nInstalled: " + BuildConfig.VERSION_NAME + "\n\nDownload the signed APK now? Android will ask you to approve the installation.")
            .setNegativeButton("Later", null)
            .setNeutralButton("View release", (dialog, which) -> {
                if (!update.releaseUrl.isEmpty()) {
                    startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(update.releaseUrl)));
                }
            })
            .setPositiveButton("Download & install", (dialog, which) -> downloadAndInstall(update))
            .show();
    }

    private void downloadAndInstall(UpdateInfo update) {
        if (isFinishing() || isDestroyed()) return;
        downloadDialog = new AlertDialog.Builder(this)
            .setTitle("Downloading update")
            .setMessage("Work Day with God " + update.version + " is downloading securely from the official GitHub release…")
            .setCancelable(false)
            .create();
        downloadDialog.show();

        UPDATE_EXECUTOR.execute(() -> {
            try {
                File updatesDirectory = new File(getCacheDir(), "updates");
                if (!updatesDirectory.exists() && !updatesDirectory.mkdirs()) {
                    throw new IllegalStateException("Unable to create the update cache.");
                }
                File[] oldFiles = updatesDirectory.listFiles((dir, name) -> name.toLowerCase().endsWith(".apk"));
                if (oldFiles != null) {
                    for (File oldFile : oldFiles) oldFile.delete();
                }

                File target = new File(updatesDirectory, update.fileName);
                downloadFile(update.downloadUrl, target);
                pendingUpdateApk = target;
                runOnUiThread(() -> {
                    dismissDownloadDialog();
                    requestInstall(target);
                });
            } catch (Exception error) {
                runOnUiThread(() -> {
                    dismissDownloadDialog();
                    new AlertDialog.Builder(this)
                        .setTitle("Update download failed")
                        .setMessage("The update could not be downloaded. Your current installation was not changed.\n\n" + safeMessage(error))
                        .setPositiveButton("OK", null)
                        .show();
                });
            }
        });
    }

    private void downloadFile(String sourceUrl, File target) throws Exception {
        HttpURLConnection connection = openConnection(sourceUrl, "application/vnd.android.package-archive");
        connection.setInstanceFollowRedirects(true);
        try {
            int responseCode = connection.getResponseCode();
            if (responseCode < 200 || responseCode >= 300) {
                throw new IllegalStateException("GitHub returned HTTP " + responseCode + ".");
            }
            try (BufferedInputStream input = new BufferedInputStream(connection.getInputStream());
                 FileOutputStream output = new FileOutputStream(target)) {
                byte[] buffer = new byte[64 * 1024];
                int read;
                while ((read = input.read(buffer)) != -1) {
                    output.write(buffer, 0, read);
                }
                output.flush();
            }
            if (!target.exists() || target.length() < 1024L * 1024L) {
                target.delete();
                throw new IllegalStateException("The downloaded APK was incomplete.");
            }
        } finally {
            connection.disconnect();
        }
    }

    private void requestInstall(File apk) {
        pendingUpdateApk = apk;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !canInstallPackages()) {
            new AlertDialog.Builder(this)
                .setTitle("Allow Work Day with God updates")
                .setMessage("Android requires permission before a sideloaded app can install its own signed updates. Enable “Allow from this source”, then return to Work Day with God.")
                .setNegativeButton("Not now", (dialog, which) -> pendingUpdateApk = null)
                .setPositiveButton("Open settings", (dialog, which) -> {
                    waitingForInstallPermission = true;
                    Intent settingsIntent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getPackageName()));
                    startActivity(settingsIntent);
                })
                .show();
            return;
        }
        launchPackageInstaller(apk);
    }

    private boolean canInstallPackages() {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.O || getPackageManager().canRequestPackageInstalls();
    }

    private void launchPackageInstaller(File apk) {
        try {
            Uri apkUri = FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", apk);
            Intent installIntent = new Intent(Intent.ACTION_VIEW);
            installIntent.setDataAndType(apkUri, "application/vnd.android.package-archive");
            installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(installIntent);
            pendingUpdateApk = null;
        } catch (Exception error) {
            new AlertDialog.Builder(this)
                .setTitle("Unable to start installer")
                .setMessage("The APK was downloaded, but Android could not open the package installer.\n\n" + safeMessage(error))
                .setPositiveButton("OK", null)
                .show();
        }
    }

    private HttpURLConnection openConnection(String url, String accept) throws Exception {
        HttpURLConnection connection = (HttpURLConnection) new URL(url).openConnection();
        connection.setConnectTimeout(12_000);
        connection.setReadTimeout(30_000);
        connection.setRequestProperty("User-Agent", "Work-Day-with-God-Android/" + BuildConfig.VERSION_NAME);
        connection.setRequestProperty("Accept", accept);
        return connection;
    }

    private String readText(HttpURLConnection connection) throws Exception {
        StringBuilder result = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) result.append(line);
        }
        return result.toString();
    }

    private int compareVersions(String left, String right) {
        String[] leftParts = left.replaceAll("[^0-9.]", "").split("\\.");
        String[] rightParts = right.replaceAll("[^0-9.]", "").split("\\.");
        int length = Math.max(leftParts.length, rightParts.length);
        for (int index = 0; index < length; index++) {
            int leftValue = index < leftParts.length && !leftParts[index].isEmpty() ? Integer.parseInt(leftParts[index]) : 0;
            int rightValue = index < rightParts.length && !rightParts[index].isEmpty() ? Integer.parseInt(rightParts[index]) : 0;
            if (leftValue != rightValue) return Integer.compare(leftValue, rightValue);
        }
        return 0;
    }

    private String safeMessage(Exception error) {
        String message = error.getMessage();
        return message == null || message.trim().isEmpty() ? "Unknown error." : message;
    }

    private void dismissDownloadDialog() {
        if (downloadDialog != null) {
            downloadDialog.dismiss();
            downloadDialog = null;
        }
    }

    private static final class UpdateInfo {
        final String version;
        final String fileName;
        final String downloadUrl;
        final String releaseUrl;

        UpdateInfo(String version, String fileName, String downloadUrl, String releaseUrl) {
            this.version = version;
            this.fileName = fileName;
            this.downloadUrl = downloadUrl;
            this.releaseUrl = releaseUrl;
        }
    }
}
