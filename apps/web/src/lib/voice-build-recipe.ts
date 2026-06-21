// Voice for the GENERATED app — shared by the fresh-build route
// (/api/builder/generate) and the edit/agent route (/api/builder/agent), so
// "build me a run buddy that talks" AND "add a voice to my app" both work.
//
// Uses the browser-native Web Speech API on purpose: no API keys, no backend
// call, so it works in the sandboxed preview AND on the published/exported site
// (which has no logged-in user and can't reach our auth-gated /api/ai/voice).

// The user asked the BUILD itself to talk/listen. Detect it so the recipe is
// only appended when relevant — it must NOT bloat every prompt.
export function wantsVoiceInBuild(prompt: string): boolean {
  return /\b(voice|speak|speaks|spoken|talk|talking|talks to me|say it|aloud|read out|narrat\w*|text[- ]?to[- ]?speech|tts|speech[- ]?to[- ]?text|voice (assistant|control|command|input)|talk to (it|me)|coach me|announce\w*|audio cue)\b/i.test(prompt || '')
}

export const VOICE_CAPABILITY_PROMPT = `VOICE CAPABILITY — the user asked the app to talk/listen, so build it in with the browser-native Web Speech API. Do NOT call any external TTS/STT API or our backend; Web Speech needs no keys and works on the published site.

TEXT-TO-SPEECH (the app speaks):
- function speak(text){ if(!('speechSynthesis' in window))return; const u=new SpeechSynthesisUtterance(text); u.rate=1; u.pitch=1; u.lang='en-US'; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); }
- Voices load async: read window.speechSynthesis.getVoices() and also handle window.speechSynthesis.onvoiceschanged; prefer an en-US voice. Offer a voice <select> only if the user wants to pick.
- Browsers BLOCK audio until a user gesture: never auto-speak on load. Trigger from a click/tap (a "Start"/"Speak"/"Read aloud" button) or from an in-app event that happens AFTER the user has tapped Start.
- Always include a visible mute/stop control (window.speechSynthesis.cancel()).

VOICE INPUT (speech-to-text) — only if the user asked to talk TO the app:
- const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
- if(SR){ const r=new SR(); r.lang='en-US'; r.interimResults=false; r.onresult=e=>{ const said=e.results[0][0].transcript; /* use it */ }; /* call r.start() from a mic-button click */ }
- If SR is undefined, hide the mic and show a short "voice input isn't supported in this browser" note.

RULES:
- Feature-detect and degrade gracefully — the app must fully work without voice (never voice-ONLY).
- Example pattern (a run/workout coach): the user taps Start, then speak() announces milestones like "Eight minute mile — take a breather" when the app's own timer/logic fires. Keep all the visual UI working too.`
