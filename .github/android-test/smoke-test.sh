#!/usr/bin/env bash
set -u
APK="$1"; PKG="$2"; STEPS="${3:-.github/android-test/steps.txt}"
OUT="test-output"; mkdir -p "$OUT"
n=0
log() { echo "[smoke] $*" | tee -a "$OUT/steps.log"; }
shot() {
  n=$((n+1)); name="$(printf '%02d' "$n")-${1:-screen}"
  adb exec-out screencap -p > "$OUT/$name.png"
  adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1 && adb pull /sdcard/ui.xml "$OUT/$name.xml" >/dev/null 2>&1
  log "screenshot $name"
}
find_xy() {
  adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1
  adb exec-out cat /sdcard/ui.xml | tr '>' '\n' \
    | grep -iE "(text|content-desc)=\"[^\"]*$1[^\"]*\"" | head -1 \
    | sed -nE 's/.*bounds="\[([0-9]+),([0-9]+)\]\[([0-9]+),([0-9]+)\]".*/\1 \2 \3 \4/p' \
    | awk '{printf "%d %d", ($1+$3)/2, ($2+$4)/2}'
}
crashed() {
  adb logcat -d -b crash | grep -q "$PKG" && return 0
  adb shell pidof "$PKG" >/dev/null 2>&1 || return 0
  return 1
}
log "installing $APK"
adb install -r -g "$APK" 2>&1 | tee -a "$OUT/steps.log"
adb logcat -c
log "launching $PKG"
adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1
sleep 30
shot launch
if [ -f "$STEPS" ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    line="${line%%#*}"; line="$(echo "$line" | sed 's/[[:space:]]*$//')"
    [ -z "$line" ] && continue
    cmd="${line%% *}"; arg=""; [ "$cmd" != "$line" ] && arg="${line#* }"
    case "$cmd" in
      tap) xy="$(find_xy "$arg")"; if [ -n "$xy" ]; then adb shell input tap $xy; log "tap '$arg' at $xy"; sleep 3; else log "FAIL: element '$arg' not found"; shot "missing"; fi ;;
      hold) xy="$(find_xy "$arg")"; if [ -n "$xy" ]; then set -- $xy; adb shell input swipe $1 $2 $1 $2 3500; log "hold '$arg'"; sleep 3; else log "FAIL: element '$arg' not found"; shot "missing"; fi ;;
      tapxy) adb shell input tap $arg; log "tap $arg"; sleep 2 ;;
      back) adb shell input keyevent KEYCODE_BACK; log "back"; sleep 2 ;;
      scroll) adb shell input swipe 540 1600 540 600 300; log "scroll"; sleep 2 ;;
      wait) sleep "${arg:-2}" ;;
      shot) shot "${arg:-screen}" ;;
      expect) if [ -n "$(find_xy "$arg")" ]; then log "OK: found '$arg'"; else log "FAIL: expected '$arg'"; shot "expect-fail"; fi ;;
    esac
    if crashed; then log "CRASH after step: $line"; break; fi
  done < "$STEPS"
fi
shot final
adb logcat -d -b crash > "$OUT/crash.txt"
adb logcat -d -v time > "$OUT/logcat-full.txt"
grep -E "AndroidRuntime|FATAL|chromium|Console|$PKG" "$OUT/logcat-full.txt" | tail -300 > "$OUT/logcat-app.txt"
if [ -s "$OUT/crash.txt" ] || grep -q "FAIL\|CRASH" "$OUT/steps.log"; then echo fail > "$OUT/result.txt"; else echo ok > "$OUT/result.txt"; fi
exit 0
