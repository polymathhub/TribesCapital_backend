# Tribes Capital Brand Film

## Verified Brand Inputs

- Official logo mark: `frontend/src/assets/image.png` (500 x 500 PNG with alpha).
- Brand palette: deep purple `#2E1065`, purple `#5B21B6`, violet `#7C3AED`, lavender `#C4B5FD`, charcoal `#1F2937`, and white.
- Approved positioning: “Move capital with conviction.”
- Approved supporting copy: “Bring capital, operators, and innovators together to scale resilient infrastructure and practical impact.”
- Verified production URL: `https://community.tribes.capital` from backend frontend-origin configuration.
- No custom font files are present. Use the macOS system UI sans-serif, matching the portal's `-apple-system` stack.

## Format

- 20 seconds, 16:9 landscape, 1920 x 1080, 24 fps.
- H.264 MP4 with original synthesized stereo music and restrained sound accents.
- No stock imagery, unverified claims, financial charts, or third-party music.

## Storyboard

| Time | Picture | Copy / Sound |
| --- | --- | --- |
| 00:00-00:03.5 | Deep-purple field, restrained moving light, official mark and wordmark reveal with a precise scale/fade. | A low, warm original tonal bed fades in. |
| 00:03.5-00:07.0 | Fine geometric paths connect three violet nodes; the line reveal travels across the frame. | “CAPITAL / OPERATORS / INNOVATORS” arrives in sequence; soft tonal accents mark each connection. |
| 00:07.0-00:13.2 | Lines resolve into a quiet framing device; left-aligned headline enters with a slow camera-like drift. | “Move capital with conviction.” Supporting copy is the approved positioning statement. |
| 00:13.2-00:17.0 | Headline gives way to the second approved statement; network lines settle into a single forward path. | “Resilient infrastructure. Practical impact.” This is excerpted from the approved supporting copy. |
| 00:17.0-00:20.0 | Return to centered official logo and wordmark; URL appears beneath with a subtle underline reveal. | `community.tribes.capital`; music resolves cleanly. |

## Motion and Sound

- Ease-in-out reveals, slow controlled drift, clean dissolves, and no strobing or rapid cuts.
- Geometric connectors are deterministic vector paths, not particles or faux financial charts.
- Soundtrack is generated specifically for this film from soft synthesized tones; it uses no external samples or licensed music.
- `prefers-reduced-motion` is not applicable to the rendered film; all motion stays slow and readable.

## Validation

1. Render and inspect the 9-second poster frame before encoding.
2. Render the full 20-second composition using native AVFoundation H.264 output.
3. Confirm video dimensions, duration, audio track, and final MP4 container with `avconvert`/AVFoundation metadata.
