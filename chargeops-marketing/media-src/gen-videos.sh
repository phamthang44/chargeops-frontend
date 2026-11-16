#!/usr/bin/env bash
# Slider clips (Kling 3.0 Turbo, image-to-video, 5s 720p 1:1) + one wordmark fix on the booking still.
# Retries when the account hits its concurrent-job limit.
set -u
cd "$(dirname "$0")"
mkdir -p raw

retry() { # name -- command...
  local name="$1"; shift
  for i in 1 2 3 4 5 6; do
    "$@" > "raw/$name.json" 2> "raw/$name.err" && grep -q result_url "raw/$name.json" && return 0
    grep -q rate_limit "raw/$name.err" || return 1
    sleep 30
  done
}

vid() { # name still prompt
  retry "$1" higgsfield generate create kling3_0_turbo --start-image "png/$2.png" --prompt "$3" \
    --duration 5 --resolution 720p --aspect_ratio 1:1 --wait --wait-timeout 20m --json &
}

if [ -z "${ONLY:-}" ] || [[ " $ONLY " == *" booking2 "* ]]; then
  retry booking2 higgsfield generate create gpt_image_2_6 --image png/booking.png --aspect_ratio 4:3 --resolution 2k \
    --prompt "Edit this photo: correct the vertical wordmark on the green side panel of the charger so it reads exactly the lowercase word \"chargeops\" (c-h-a-r-g-e-o-p-s), same font, size, colour and orientation. Keep every other pixel of the photo identical: hand, phone, sky, lake, canopy, lighting and framing." \
    --wait --wait-timeout 15m --json &
fi

[ -z "${ONLY:-}" ] || [[ " $ONLY " == *" clip1 "* ]] && vid clip1 slide1 "She drives smoothly with a relaxed smile, glancing ahead at the road; warm sunlight flickers across her face as trees pass outside the window. Subtle natural motion, camera locked inside the car, no cuts."
[ -z "${ONLY:-}" ] || [[ " $ONLY " == *" clip2 "* ]] && vid clip2 slide2 "The hand slowly pushes the charging connector fully into the car's port and lets go; the mint-green status light on the charger starts to pulse gently; leaves sway softly in the breeze. Static camera, no cuts."
[ -z "${ONLY:-}" ] || [[ " $ONLY " == *" clip3 "* ]] && vid clip3 slide3 "He scrolls on his phone and smiles, then lifts the iced coffee to take a sip; outside the window leaves sway and a motorbike passes slowly. Static camera, natural subtle motion, no cuts."

wait
echo "video jobs finished"
