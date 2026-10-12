#!/usr/bin/env python3
"""Generate a restrained original score for the production walkthrough."""

import math
import struct
import sys
import wave

SAMPLE_RATE = 22050
DURATION = 96.0
CHAPTER_MARKS = (0.15, 14.1, 19.0, 30.0, 40.0, 45.0, 55.0, 64.5, 69.5, 79.0, 88.0, 93.0)
CHORDS = (
    (65.41, 98.00, 130.81, 196.00),
    (73.42, 110.00, 146.83, 220.00),
    (61.74, 92.50, 123.47, 185.00),
    (69.30, 103.83, 138.59, 207.65),
)


def envelope(time):
    return max(0.0, min(1.0, time / 2.0, (DURATION - time) / 2.4))


def sample(time):
    chord = CHORDS[int(time // 8) % len(CHORDS)]
    bed = sum(math.sin(2 * math.pi * frequency * time) for frequency in chord) / 4
    bed += 0.16 * math.sin(2 * math.pi * chord[1] * 2.003 * time)
    value = bed * 0.11 * (0.88 + 0.12 * math.sin(time * math.pi / 9) ** 2)

    for index, mark in enumerate(CHAPTER_MARKS):
        local = time - mark
        if 0 <= local < 1.3:
            gain = math.exp(-local * 2.8)
            root = (440.0, 523.25, 587.33, 493.88)[index % 4]
            value += 0.055 * gain * math.sin(2 * math.pi * root * local)
            value += 0.018 * gain * math.sin(2 * math.pi * 55 * local)

    return max(-0.6, min(0.6, value * envelope(time)))


def main():
    output = sys.argv[1] if len(sys.argv) > 1 else "soundtrack-walkthrough.wav"
    total = int(SAMPLE_RATE * DURATION)
    delay = int(SAMPLE_RATE * 0.011)
    history = [0.0] * delay

    with wave.open(output, "wb") as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(SAMPLE_RATE)
        frames = bytearray()
        for index in range(total):
            left = sample(index / SAMPLE_RATE)
            right = history[index % delay] * 0.94 + left * 0.06
            history[index % delay] = left
            frames.extend(struct.pack("<hh", int(left * 32767), int(right * 32767)))
            if len(frames) >= 131072:
                wav.writeframesraw(frames)
                frames.clear()
        if frames:
            wav.writeframesraw(frames)

    print(f"Generated original stereo score: {output} ({DURATION:.1f}s)")


if __name__ == "__main__":
    main()