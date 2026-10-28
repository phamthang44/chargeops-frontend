# ChargeOps product video

The master video is recorded from the real Driver Web footage and the live Owner Console UI. The Owner capture opens the local web app in its demo role (`?as=owner`) and follows the visible Dashboard, Chargers, Pricing & Hours, Finance Ledger, and Refunds screens. The recorder does not create or open a staged HTML page, and it does not save pricing changes or submit transactions.

From `chargeops-marketing`, run:

```bash
npm run record:walkthrough -- --lang=vi
npm run record:walkthrough -- --lang=en
npm run record:walkthrough -- --lang=both
```

The script starts a local ChargeOps Web demo server when one is not already running. It expects the Driver booking videos under `public/videos/driver-booking-flow-{vi,en}.mp4` as local recording inputs and uses Playwright plus the bundled FFmpeg encoder. The marketing site itself loads published media from R2.

Each language run writes an 80-second H.264 MP4 for the landing-page walkthrough and standalone Owner and Owner-to-Admin MP4s to `public/videos/`. These are local recording artifacts; they are ignored by Git and are not used as site fallbacks. Upload the desired versions to R2, then update the public walkthrough URL map in `lib/walkthrough-media.ts`. The recording soundtrack is generated locally by the script. The separate player soundtrack remains configurable through its own public audio URL. Use `node scripts/record-walkthrough-80s.mjs --audio-only` to refresh the embedded recording soundtrack without recording the Owner screens again.

## Landing page media URLs

`WalkthroughTheater` keeps the video stream muted and accepts a separate audio URL, so the audio track can be changed without re-encoding the video. Video URLs are configured in `lib/walkthrough-media.ts` and do not need per-video environment variable updates. The optional player soundtrack can still be configured with this public variable in `.env.local` and the marketing deployment environment:

```dotenv
NEXT_PUBLIC_CHARGEOPS_WALKTHROUGH_AUDIO_URL=https://media.example.com/chargeops-music.mp3
```

The site has no local `public/` media fallback. Image and media keys resolve through `NEXT_PUBLIC_MEDIA_URL`; a walkthrough can use its own explicit public URL in `lib/walkthrough-media.ts`. Publish every referenced object to R2 before deployment. The soundtrack is off until the viewer enables it. Keep the audio timeline aligned to the video (ideally the same duration); the player follows play, pause, and seeking. Only use public, HTTPS delivery URLs here; do not put storage API tokens in `NEXT_PUBLIC_` variables. Direct H.264 MP4 works with the current player; HLS manifests need an HLS playback library before they can be used as `videoSrc`.
