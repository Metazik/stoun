import { NextResponse } from "next/server";
import { requireCurrentProfile } from "@/lib/auth";
import { getProject, getAudioFile, saveGeneratedAudioFile, setCurrentAudioFile, updateProjectSettings } from "@/lib/data/projects";
import { AudioEngine } from "@/lib/audio-engine";
import type { MusicLayer, VocalSettings, MusicSettings } from "@/types";

type GenerateAction =
  | "analyzeVoice"
  | "separateVocals"
  | "cleanVoice"
  | "correctPitch"
  | "correctTiming"
  | "addHarmony"
  | "generateArrangement"
  | "generateMusic"
  | "masterTrack";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const me = await requireCurrentProfile();
    const project = await getProject(id);
    if (!project || project.ownerId !== me.id) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    const { action } = (await req.json()) as { action: GenerateAction };

    const currentAudio = await getAudioFile(project.currentAudioFileId ?? project.originalAudioFileId ?? "");
    if (!currentAudio) return NextResponse.json({ error: "No audio to process." }, { status: 400 });

    const vocal: VocalSettings = { ...project.vocalSettings };
    const music: MusicSettings = { ...project.musicSettings };
    let resultUrl = currentAudio.url;
    let label = currentAudio.label ?? "Processed";

    switch (action) {
      case "analyzeVoice": {
        const analysis = await AudioEngine.analyzeVoice({ audioUrl: currentAudio.url });
        return NextResponse.json({ analysis });
      }
      case "separateVocals": {
        const r = await AudioEngine.separateVocals({ audioUrl: currentAudio.url });
        resultUrl = r.vocalUrl;
        label = "Vocals isolated";
        break;
      }
      case "cleanVoice": {
        const r = await AudioEngine.cleanVoice({ audioUrl: currentAudio.url });
        resultUrl = r.audioUrl;
        vocal.improved = true;
        label = "Voice improved";
        break;
      }
      case "correctPitch": {
        const r = await AudioEngine.correctPitch({ audioUrl: currentAudio.url });
        resultUrl = r.audioUrl;
        vocal.pitchCorrected = true;
        label = "Pitch corrected";
        break;
      }
      case "correctTiming": {
        const r = await AudioEngine.correctTiming({ audioUrl: currentAudio.url });
        resultUrl = r.audioUrl;
        vocal.timingCorrected = true;
        label = "Timing corrected";
        break;
      }
      case "addHarmony": {
        const r = await AudioEngine.addHarmony({ audioUrl: currentAudio.url });
        resultUrl = r.audioUrl;
        vocal.harmonyAdded = true;
        label = "Harmonies added";
        break;
      }
      case "generateArrangement": {
        const r = await AudioEngine.generateArrangement({
          vocalUrl: currentAudio.url,
          tags: project.tags,
          instruction: project.instruction,
        });
        resultUrl = r.audioUrl;
        music.activeLayers = r.layers as MusicLayer[];
        music.arrangementGenerated = true;
        label = "Arrangement generated";
        break;
      }
      case "generateMusic": {
        const r = await AudioEngine.generateMusic({
          vocalUrl: currentAudio.url,
          tags: project.tags,
          layers: music.activeLayers,
        });
        resultUrl = r.audioUrl;
        label = "Full musical bed generated";
        break;
      }
      case "masterTrack": {
        const r = await AudioEngine.masterTrack({ audioUrl: currentAudio.url });
        resultUrl = r.audioUrl;
        music.mastered = true;
        label = "Mastered";
        break;
      }
      default:
        return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }

    const newAudioFile = await saveGeneratedAudioFile(project.id, resultUrl, label);
    await setCurrentAudioFile(project.id, newAudioFile.id);
    await updateProjectSettings(project.id, {
      vocalSettings: vocal,
      musicSettings: music,
      status: "ready",
    });

    return NextResponse.json({ audioFile: newAudioFile, vocalSettings: vocal, musicSettings: music });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
