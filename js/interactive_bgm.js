/**
 * Interactive BGM - "Masquerade Glitch"
 * A spacious, melancholic piano waltz with subtle digital interference.
 * 
 * Usage:
 * 1. Include Tone.js in your HTML: <script src="https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js"></script>
 * 2. Import this module or load it as a script.
 * 3. Call startMasqueradeBGM() after a user interaction (click/keydown).
 */

let synth = null;
let glitchSynth = null;
let loop = null;
let isInitialized = false;

export async function startMasqueradeBGM() {
    if (isInitialized) return;

    await Tone.start();
    isInitialized = true;

    // --- 1. Audio Chain & Effects ---

    // Faded Hall Reverb (Old Castle / Memory)
    const reverb = new Tone.Reverb({
        decay: 3.5, // Natural hall decay, not too long
        wet: 0.5
    }).toDestination();
    await reverb.generate();

    // Subtle Vibrato for "Warped Tape" / "Old Record" feel
    const vibrato = new Tone.Vibrato({
        frequency: 3, // Slow wobble
        depth: 0.1,   // Very subtle pitch shift
        wet: 0.2
    }).connect(reverb);

    // Filter - Warm & Lo-fi
    const filter = new Tone.Filter(1000, "lowpass").connect(vibrato);

    // --- 2. Instrument: The "Dusty Harp" ---

    // PolySynth with Triangle/Sine mix for a gentle, bell-like tone
    synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
            type: "triangle" // Pure, soft tone
        },
        envelope: {
            attack: 0.1, // Softer attack than piano
            decay: 2,    // Long, graceful decay
            sustain: 0.1,
            release: 3
        },
        volume: -25 // Reduced per request (Slightly quieter)
    }).connect(filter);

    // --- 3. Composition: "Fading Waltz" (A Minor) ---
    // Antique, Lonely, Solitary

    Tone.Transport.bpm.value = 75; // Andante

    // A Minor Sarabande-like progression (3/4 feel in 4/4 grid context)
    // Am - Em/G - F - C/E - Dm - Am/C - E7 - Am
    const antiqueMelody = [
        // Measure 1: Am (The Solitude) -> Em (The Distance)
        { time: "0:0:0", note: ["A2", "E3", "C4"], duration: "2n" },
        { time: "0:2:0", note: ["G2", "B3", "E4"], duration: "2n" },

        // Measure 2: Fmaj7 (The Memory) -> C (The Comfort)
        { time: "1:0:0", note: ["F2", "C3", "A3"], duration: "2n" },
        { time: "1:2:0", note: ["E2", "C3", "G3"], duration: "2n" },

        // Measure 3: Dm (The Longing) -> Am (The Return)
        { time: "2:0:0", note: ["D2", "A3", "F4"], duration: "2n" },
        { time: "2:2:0", note: ["C2", "A3", "E4"], duration: "2n" },

        // Measure 4: E7 (The Question) -> Am (The End)
        { time: "3:0:0", note: ["E2", "G#3", "D4"], duration: "2n" },
        { time: "3:2:0", note: ["A2", "C4", "A4"], duration: "2n" },

        // Measure 5: Melody Line (High, fragile)
        { time: "4:0:0", note: ["A4"], duration: "4n" },
        { time: "4:1:0", note: ["B4"], duration: "4n" },
        { time: "4:2:0", note: ["C5"], duration: "2n" },

        // Measure 6: Descent
        { time: "5:0:0", note: ["B4"], duration: "4n" },
        { time: "5:1:0", note: ["A4"], duration: "4n" },
        { time: "5:2:0", note: ["G4"], duration: "2n" },

        // Measure 7: Resolution
        { time: "6:0:0", note: ["F4"], duration: "4n" },
        { time: "6:1:0", note: ["E4"], duration: "4n" },
        { time: "6:2:0", note: ["E4", "G#4"], duration: "2n" },

        // Measure 8: Final Chord
        { time: "7:0:0", note: ["A2", "A3", "C4", "E4", "A4"], duration: "1m" },
    ];

    const part = new Tone.Part((time, value) => {
        synth.triggerAttackRelease(value.note, value.duration, time);
    }, antiqueMelody);

    part.loop = true;
    part.loopEnd = "8:0:0";
    part.start(0);

    // --- 4. Start ---
    Tone.Transport.start();

    console.log("[BGM] Antique Sarabande (Lonely) Started");
}

export function stopMasqueradeBGM() {
    Tone.Transport.stop();
    if (synth) synth.releaseAll();
    isInitialized = false;
}
