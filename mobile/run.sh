#!/usr/bin/env bash
#
# MovIO mobile dev launcher.
#
# Auto-detects the laptop's current LAN IP and the first connected Android
# device, then runs the app pointed at the backend on that IP — so you never
# retype --dart-define when your network (and thus your IP) changes.
#
# Usage:
#   ./run.sh                 # debug run on the first Android device
#   ./run.sh --release       # any extra args are passed straight to `flutter run`
#   MOVIO_LAN_IP=10.0.0.5 ./run.sh      # force the IP (skip auto-detect)
#   MOVIO_BACKEND_PORT=5000 ./run.sh    # override the backend port (default 4000)
#
set -euo pipefail
cd "$(dirname "$0")" # always run from the mobile/ dir, wherever it's invoked

PORT="${MOVIO_BACKEND_PORT:-4000}"
API_PATH="/api/v1"

# --- 1. Resolve the LAN IP -------------------------------------------------
# `ip route get` reports the source IP the kernel would use to reach the
# internet — i.e. the active wifi/ethernet interface's address. This dodges
# docker/veth bridges (172.x) that a naive `ip addr` scan would pick up.
IP="${MOVIO_LAN_IP:-$(ip route get 1.1.1.1 2>/dev/null | grep -oP 'src \K[\d.]+' | head -1)}"
if [ -z "${IP:-}" ]; then
  echo "✗ Could not auto-detect a LAN IP. Set it manually:  MOVIO_LAN_IP=192.168.x.x ./run.sh" >&2
  exit 1
fi
BASE_URL="http://${IP}:${PORT}${API_PATH}"

# --- 2. Find the first connected Android device ----------------------------
DEVICE="$(flutter devices --machine 2>/dev/null | python3 -c '
import json, sys
try:
    devices = json.load(sys.stdin)
except Exception:
    devices = []
for d in devices:
    if str(d.get("targetPlatform", "")).startswith("android"):
        print(d["id"]); break
' 2>/dev/null || true)"

# Fallback: ask adb directly if the flutter query came up empty.
if [ -z "${DEVICE:-}" ] && command -v adb >/dev/null 2>&1; then
  DEVICE="$(adb devices 2>/dev/null | awk '/\tdevice$/{print $1; exit}')"
fi

if [ -z "${DEVICE:-}" ]; then
  echo "✗ No Android device detected."
  echo "  • Plug in the phone over USB and enable Developer options → USB debugging."
  echo "  • Tap 'Allow' on the USB-debugging prompt, then check:  flutter devices"
  exit 1
fi

# --- 3. Warn (don't block) if the backend isn't up yet ---------------------
if curl -fsS -m 3 "http://${IP}:${PORT}/health" >/dev/null 2>&1; then
  BACKEND="reachable ✓"
else
  BACKEND="NOT reachable — start it with:  (cd ../backend && yarn dev)"
fi

# --- 4. Launch -------------------------------------------------------------
echo "──────────────────────────────────────────────"
echo "  Device   : ${DEVICE}"
echo "  Backend  : ${BASE_URL}"
echo "  Health   : ${BACKEND}"
echo "──────────────────────────────────────────────"

exec flutter run --dart-define="API_BASE_URL=${BASE_URL}" -d "${DEVICE}" "$@"
