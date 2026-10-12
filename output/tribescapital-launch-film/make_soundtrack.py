#!/usr/bin/env python3
"""Generate the original, sample-free Tribes Capital film soundtrack."""

import math
import struct
import sys
import wave

SAMPLE_RATE = 44100
DURATION = 20.0
BEATS = (0.15, 3.45, 6.95, 12.95, 16.9)


def envelope(time, start, attack, release, end):
    if time < start or time >= end:
        return 0.0
    attack_gain = min(1.0, (time - start) / attack)
    release_gain = min(1.0, (end - time) / release)
    return max(0.0, min(attack_gain, release_gain))


def make_sample(time):
    fade_in = min(1.0, time / 1.25)
    fade_out = min(1.0, (DURATION - time) / 1.1)
    master = max(0.0, min(fade_in, fade_out))

    chords = (
        (0.0, 5.0, (73.42, 110.00, 146.83, 220.00)),
        (5.0, 10.0, (65.41, 98.00, 130.81, 196.00)),
        (10.0, 15.0, (61.74, 92.50, 123.47, 185.00)),
        (15.0, 20.0, (73.42, 110.00, 146.83, 220.00)),
    )
    chord = next(notes for start, end, notes in chords if start <= time < end)
    swell = 0.8 + 0.2 * math.sin(time * math.pi / 4.6) ** 2
    pad = sum(math.sin(2 * math.pi * frequency * time) for frequency in chord) / len(chord)
    pad += 0.22 * math.sin(2 * math.pi * (chord[1] * 2.003) * time)
    value = pad * 0.105 * swell * master

    for beat_index, beat in enumerate(BEATS):
        local = time - beat
        if 0 <= local < 1.55:
            bell_gain = math.exp(-local * 2.45)
            root = (440.00, 554.37, 659.25, 493.88, 587.33)[beat_index]
            bell = math.sin(2 * math.pi * root * local)
            bell += 0.32 * math.sin(2 * math.pi * root * 2.01 * local)
            value += bell * 0.11 * bell_gain
        if 0 <= local < 0.55:
            low_gain = math.exp(-local * 8.5)
            value += math.sin(2 * math.pi * 55.0 * local) * 0.10 * low_gain

    return max(-0.75, min(0.75, value))


def main():
    output = sys.argv[1] if len(sys.argv) > 1 else "soundtrack.wav"
    total = int(SAMPLE_RATE * DURATION)
    mono = [make_sample(index / SAMPLE_RATE) for index in range(total)]
    delay = int(SAMPLE_RATE * 0.013)
    peak = max(abs(sample) for sample in mono) or 1.0
    scale = 0.68 / peak

    with wave.open(output, "wb") as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(SAMPLE_RATE)
        frames = bytearray()
        for index, left in enumerate(mono):
            right = mono[max(0, index - delay)] * 0.96 + left * 0.04
            frames.extend(struct.pack("<hh", int(left * scale * 32767), int(right * scale * 32767)))
        wav.writeframes(frames)

    print(f"Generated original stereo soundtrack: {output} ({DURATION:.1f}s)")


if __name__ == "__main__":
    main()
