#!/usr/bin/env bash
# ZİFİR'i başlat: yerel sunucu + Chrome uygulama penceresi
cd "$(dirname "$0")"
PORT=8765
if ! curl -s -o /dev/null "http://localhost:$PORT/index.html"; then
  python3 -m http.server $PORT --bind 127.0.0.1 >/dev/null 2>&1 &
  sleep 0.7
fi
exec google-chrome --app="http://localhost:$PORT/" --start-fullscreen --allow-scripts-to-close-windows --user-data-dir="$HOME/.cache/zifir-chrome" >/dev/null 2>&1
