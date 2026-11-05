#!/bin/bash
# Oturum açılınca node paketlerini kurar; zaten kuruluysa hiçbir şey yapmaz.
cd "$CLAUDE_PROJECT_DIR" || exit 0
if [ ! -d node_modules/remotion ]; then
  npm ci --no-audit --no-fund >/dev/null 2>&1 && echo "node paketleri kuruldu" || echo "npm ci başarısız oldu"
fi
exit 0
