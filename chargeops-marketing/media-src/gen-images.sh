#!/usr/bin/env bash
# Generates every still for the ChargeOps landing page with GPT Image 2.6 (Higgsfield CLI).
# Raw outputs land in media-src/raw/<name>.json (job JSON) — download step is separate.
set -u
cd "$(dirname "$0")"
mkdir -p raw

STYLE="Editorial lifestyle photograph in Vietnam, soft natural light with a warm late-afternoon glow, palette of deep forest green, emerald, warm teak wood and cream, realistic skin and materials, 35mm lens, shallow depth of field, subtle film grain, calm and premium mood, uncluttered composition. No text overlays, no watermark."
CHARGER="slim modern DC fast-charging pillar with a matte off-white body and deep forest-green side panels, a thin glowing mint-green status light strip, and the lowercase wordmark \"chargeops\" printed vertically on the green side panel"

run() { # name aspect extra-args... -- prompt
  local name="$1" aspect="$2"; shift 2
  if [ -n "${ONLY:-}" ] && [[ " $ONLY " != *" $name "* ]]; then return; fi
  local prompt="${!#}"; local extra=("${@:1:$#-1}")
  higgsfield generate create gpt_image_2_6 --prompt "$prompt" --aspect_ratio "$aspect" --resolution 2k "${extra[@]}" --wait --wait-timeout 15m --json > "raw/$name.json" 2> "raw/$name.err" &
}

run hero 16:9 "Wide shot of a modern EV charging hub in Ho Chi Minh City under a warm teak-wood slatted canopy. Centered in the frame stands a ${CHARGER}, with two more identical pillars receding behind it. On the left a compact white electric SUV is plugged in and a young Vietnamese man in a linen shirt leans by its open door. On the right a young Vietnamese woman sits on a long wooden bench with an iced coffee, relaxed, looking at her phone. Tropical trees and a slatted wood fence behind, painted parking bays on the asphalt. Leave calm empty space in the upper middle of the frame. ${STYLE}"

run slide1 1:1 "Cinematic side profile of a young Vietnamese woman wearing sunglasses, smiling while driving an electric car at golden hour along a Saigon riverside road, seen from the passenger seat, her face centered in the frame, blurred trees and warm city lights behind her through the window, warm rim light on her face. ${STYLE}"

run slide2 1:1 "Close-up, centered: a hand plugging a black CCS2 charging connector into the charging port of a white electric car, next to a ${CHARGER}; the mint status light glows softly; shallow depth of field, late afternoon light on the car body. ${STYLE}"

run slide3 1:1 "A young Vietnamese man sitting centered in a sunlit cafe by a large open window, holding a smartphone and smiling at it, an iced coffee on the wooden table; through the window behind him his white electric car is charging at a ${CHARGER} on the street. Plants, warm wood interior. ${STYLE}"

run charger 2:3 --background transparent "Studio product photograph of a single ${CHARGER}, with a coiled black charging cable and a CCS2 connector resting in its holster, front three-quarter view, full height visible from base to top, soft even studio lighting, crisp edges, isolated on a fully transparent background, no floor, no shadow plate."

run booking 4:3 "Low-angle shot of a raised hand holding a smartphone up against a clear blue sky with a few soft clouds; the phone screen shows a clean white mobile app booking confirmation with a large QR code and a green confirmed badge; at the right edge the top of a ${CHARGER} under a green-and-wood canopy; bright tropical daylight, sleeve of an orange linen shirt. ${STYLE}"

run about1 1:1 "Low-angle architectural view of an EV charging hub canopy: a warm teak-wood slatted roof with integrated linear lights curving over a row of ${CHARGER}s, one white electric car parked, tropical plants, warm late-afternoon light, blue sky at the edge. ${STYLE}"

run about2 3:4 "Vertical close-up of the side of a ${CHARGER}: the green side panel with the vertical lowercase wordmark fills most of the frame, the black charging cable hangs in a soft curve, blurred wooden canopy and greenery in the background. ${STYLE}"

run apphand 4:5 --background transparent --image ../public/screens/app-map-new.png "A realistic hand holding a modern black smartphone upright, front view with a slight tilt, the phone screen displays exactly the mobile app screen from the reference image (a city map with green charging-station pins and a white station card with a green 'Đặt chỗ ngay' button). Natural skin, soft studio light, isolated on a fully transparent background, wrist cropped at the bottom edge."

run hanoi 4:5 "Early evening on a leafy street in Hanoi: a small charging bay with two ${CHARGER}s under a large tree, a white electric car charging, motorbikes passing softly blurred, warm shopfront lights and yellow walls. ${STYLE}"

run danang 4:5 "Morning at a coastal charging stop in Da Nang: a ${CHARGER} beside a small parking area facing the sea, palm trees, a young family stretching beside their white electric car, soft morning light and sea haze. ${STYLE}"

run illos 1:1 --background transparent "A sheet of 9 separate spot illustrations arranged in a neat 3 by 3 grid with wide even spacing; each object is centered in its own cell, nothing touches or overlaps, no frames, no labels, no text. Consistent style: playful hand-drawn editorial illustration with confident dark forest-green ink outlines of uneven weight, flat fills in emerald green, pale mint, warm orange and cream, light grainy texture, slight three-quarter perspective, a small soft shadow under each object. Row 1: (1) a smiling car battery with a lightning bolt lying in a striped hammock tied between two small palm trees; (2) a big map pin with a charging plug cable wrapped around it; (3) a tiny charging station kiosk with a wooden roof. Row 2: (4) a desk calendar page with one time slot circled and a check mark; (5) a stopwatch with a lightning bolt on its face; (6) a glass of Vietnamese iced milk coffee with a metal phin filter on top. Row 3: (7) a green leaf with an electric plug as its stem; (8) a smartphone showing a QR code; (9) a ringing notification bell with a tiny lightning bolt. Transparent background."

wait
echo "all image jobs finished"
