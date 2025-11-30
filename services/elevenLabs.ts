
// Simple client-side service for ElevenLabs TTS
// In a production app, this should be proxied through a backend to hide the API key.

const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY || "sk_dcc131a18ba9fa2ab4d98608efd58f834e433b1d74f7b995";

export const playTextToSpeech = async (text: string, voiceId: string): Promise<void> => {
  if (!ELEVEN_LABS_API_KEY) {
    console.warn("ElevenLabs API Key is missing. Skipping TTS.");
    return;
  }

  // Remove speaker prefixes like [creative]: from text before speaking
  const cleanText = text.replace(/\[.*?\]:/g, '').trim();

  if (!cleanText) return;

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': ELEVEN_LABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: cleanText,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      // ElevenLabs standard error format is often { detail: { status: "...", message: "..." } } 
      // or just { detail: "message" }
      const errorMessage = err?.detail?.message || err?.detail || err?.message || JSON.stringify(err);
      console.error(`ElevenLabs API Error (${response.status}):`, errorMessage);
      return;
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    return new Promise((resolve, reject) => {
        audio.onended = () => {
            resolve();
            URL.revokeObjectURL(audioUrl);
        };
        audio.onerror = (e) => {
             console.error("Audio Playback Error:", e);
             reject(e);
        };
        // Handle autoplay restrictions
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(e => {
                console.error("Audio Play Error (Autoplay Blocked?):", e);
                reject(e);
            });
        }
    });

  } catch (error) {
    console.error("TTS Fetch Error:", error);
  }
};
