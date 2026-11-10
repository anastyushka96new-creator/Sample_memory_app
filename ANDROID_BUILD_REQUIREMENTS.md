# Android build requirements

Status: requirements approved; native Android project generation and build setup are a later implementation step.

This file records the required Android toolchain for the Capacitor 6 migration. It is the source of truth before the `android/` platform is generated.

## Required versions and settings

| Component | Required value |
|---|---|
| Java distribution | Eclipse Temurin JDK 17 |
| Android Gradle Plugin | `com.android.tools.build:gradle:8.7.3` |
| Gradle wrapper | `gradle-8.11.1-bin.zip` |
| `compileSdk` | 35 |
| `targetSdk` | 35 |
| `minSdk` | 24 |
| Java `sourceCompatibility` | `JavaVersion.VERSION_17` |
| Java `targetCompatibility` | `JavaVersion.VERSION_17` |
| Capacitor major | 6.x |

## Capacitor dependency migration

The JavaScript packages `@capacitor/core`, `@capacitor/android`, `@capacitor/cli`, and `@capacitor/app` must all resolve to compatible 6.x releases. Update `package.json` and `package-lock.json` together; do not commit a package manifest that disagrees with its lock file. Capacitor plugins must also be checked for Capacitor 6 peer compatibility.

## Native project setup (later phase)

The repository currently has no generated `android/` directory. When Android is added, configure the versions above in the native Gradle files and wrapper. Keep the Cordova integration optional:

- In `android/settings.gradle`, only include/apply `capacitor-cordova-android-plugins` when the directory/file exists, using `file(...).exists()` checks.
- In `android/app/capacitor.build.gradle`, only apply `cordova.variables.gradle` when it exists, using a safe `file(...).exists()` check.
- Do not require Cordova plugins for a clean Capacitor 6 build.

## Compatibility and verification

AGP 8.7.3 with Gradle 8.11.1 is the requested toolchain, but this combination is newer than the default toolchain commonly used by Capacitor 6 templates. Treat compatibility as unverified until the generated project passes a clean Gradle build with JDK 17 and Android SDK 35 installed. Do not silently downgrade any requested version; if the build fails, report the exact incompatibility and discuss options.

The follow-up native setup should verify the wrapper distribution URL, AGP classpath, SDK levels, Java compile options, safe optional Cordova checks, `cap sync android`, and a clean APK build.
