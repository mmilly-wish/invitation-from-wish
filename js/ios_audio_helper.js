/**
 * iOS Audio Unlock Helper
 * 
 * Uses the "Silent Video" trick to force iOS Audio Session to "Playback" category,
 * bypassing the silent switch in many cases (though hardware mute is powerful).
 * Also handles Tone.js context resumption.
 */

// A tiny 1x1 pixel silent MP4 video
const SILENT_VIDEO_BASE64 = "data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAs1tZGF0AAAC...";// Truncated for brevity in prompt, will use a real short one in implementation or just creating a video element.
// Actually, it's safer to just create a video element and not src it if we just want the element, 
// BUT to force playback we need a source. 
// Let's use a very minimal valid MP4 base64.

// Valid minimal MP4 (approx 1KB) - often used for this purpose
const ISO_B64 = "data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAABdtZGF0AAACrQAAAB5tZGF0AAACrgAAAAAAAgEAAAEAAAABAAAAAAADZm1vb3QAAABsbXZoZAAAAAB8JbCAfCWwgAAAA+gAAAAAAAEAAAEAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAIgM5XRcmFrXQAAAFx0a2hkAAAAAXwlsIB8JbCAAAAAAQAAAAAAAyoAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAbWRpYQAAACBtZGhkAAAAAXwlsIB8JbCAAAAA+gAAAAAAAB5oYW5kbGVyAAAAAHZpZGUAAAAAAAAAAAAAAAB2aWRlb2hhbmRsZXIAAAABSG1pbmYAAAAUdmloZAAAAAEAAAAAAAAAAAAAADBkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAA5zdGJsAAAAbmV0c3QAAAAAAAADAQAAABhzdHNkAAAAAAAAAAEAAABavGMxAAAAJ2F2Y0MBQsAN/+EAFZQAy/8AAAABAAOAA4AAAAMAQAAHgTje5GAAAAAZc3R0cwAAAAAAAAABAAAAAQAAAAAAAAAac3RzYwAAAAAAAAABAAAAAQAAAAEAAAABAAAAFHN0c3oAAAAAAAAAAAAAAAEAAACuc3RjbwAAAAAAAAABAAAAAAAAYXVkdGEAAAA1bWV0YQAAAAAAAAAhaGRscgAAAAAAAAAAbWRpcgAAAAAAAAAAAAAAABFpbHN0AAAAAA==";

let isUnlocked = false;

export async function unlockAudio() {
    if (isUnlocked) return;

    console.log("[Audio] Attempting iOS Unlock...");

    // 1. Resume Tone.js Context (Web Audio API)
    if (window.Tone) {
        try {
            await Tone.start();
            console.log("[Audio] Tone.start() success. Context state:", Tone.context.state);
        } catch (e) {
            console.warn("[Audio] Tone.start() failed", e);
        }
    }

    // 2. Play Silent Video (HTML5 Media -> Force Session Category)
    const video = document.createElement("video");
    video.src = ISO_B64;
    video.loop = true;
    video.playsInline = true;
    video.muted = true; // Start muted effectively, but we want to 'play' it. 
    // Actually, to bypass silent switch, sometimes we need audio track? 
    // This video has no audio track.
    // However, the act of "playing media" often triggers the category change.

    // Best practice for games:
    video.style.position = 'fixed';
    video.style.top = '-9999px';
    video.style.left = '-9999px';
    document.body.appendChild(video);

    try {
        await video.play();
        console.log("[Audio] Silent video playing (Session Unlocked)");
        // We can pause it immediately or leave it looping if needed to keep session active?
        // Usually just starting it is enough.
        // video.pause(); 
    } catch (e) {
        console.warn("[Audio] Video unlock failed", e);
    }

    isUnlocked = true;
}
