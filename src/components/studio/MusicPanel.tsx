"use client";

import { Piano, Wind, Drum, Radio, Guitar, Wand2, SlidersHorizontal } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { ActionButton } from "@/components/studio/ActionButton";
import { useStudioStore } from "@/lib/stores/useStudioStore";
import type { MusicLayer } from "@/types";

const LAYERS: { key: MusicLayer; label: string; icon: typeof Piano }[] = [
  { key: "piano", label: "Piano", icon: Piano },
  { key: "pads", label: "Pads", icon: Wind },
  { key: "drums", label: "Drums", icon: Drum },
  { key: "bass", label: "Bass", icon: Radio },
  { key: "strings", label: "Strings", icon: Guitar },
];

export function MusicPanel() {
  const musicSettings = useStudioStore((s) => s.musicSettings);
  const project = useStudioStore((s) => s.project);

  function toggleLayer(layer: MusicLayer) {
    const active = musicSettings.activeLayers.includes(layer);
    const activeLayers = active
      ? musicSettings.activeLayers.filter((l) => l !== layer)
      : [...musicSettings.activeLayers, layer];
    useStudioStore.setState({ musicSettings: { ...musicSettings, activeLayers } });
    if (project) {
      fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ musicSettings: { ...musicSettings, activeLayers } }),
      }).catch(() => {});
    }
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <SlidersHorizontal className="h-5 w-5 text-stoun-violet" />
        <h2 className="font-semibold">Music</h2>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {LAYERS.map(({ key, label, icon: Icon }) => (
          <Tag key={key} active={musicSettings.activeLayers.includes(key)} onClick={() => toggleLayer(key)}>
            <Icon className="mr-1.5 inline h-3.5 w-3.5" />
            {label}
          </Tag>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <ActionButton
          action="generateArrangement"
          label="Generate arrangement"
          icon={Wand2}
          done={musicSettings.arrangementGenerated}
        />
        <ActionButton action="generateMusic" label="Generate full mix" icon={Wand2} />
        <ActionButton action="masterTrack" label="Master track" icon={Wand2} done={musicSettings.mastered} />
      </div>
    </Card>
  );
}
