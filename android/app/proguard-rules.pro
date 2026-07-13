# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# WebView @JavascriptInterface 메서드는 리플렉션으로 호출되므로 난독화 제외
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Capacitor 런타임 어노테이션 보존 (Bridge.getPermissionStates 리플렉션 호출 용)
# @CapacitorPlugin, @Permission 등이 strip되면 Bridge.java:1217 에서 NPE 발생
-keepattributes *Annotation*

# Capacitor 플러그인 클래스 및 어노테이션된 멤버 보존
-keep @com.getcapacitor.annotation.CapacitorPlugin public class * {
    @com.getcapacitor.annotation.PermissionCallback <methods>;
    @com.getcapacitor.annotation.ActivityCallback <methods>;
    @com.getcapacitor.annotation.Permission <methods>;
    @com.getcapacitor.PluginMethod public <methods>;
}
-keep public class * extends com.getcapacitor.Plugin { *; }
-keep class com.getcapacitor.** { *; }
-keep class com.capacitorjs.** { *; }
