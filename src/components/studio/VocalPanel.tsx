"use client";

import { Mic2, Music3, Clock3, Users, Flame, Snowflake, Heart } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ActionButton } from "@/components/studio/ActionButton";
import { useStudioStore } from "@/lib/stores/useStudioStore";

export function VocalPanel() {
  const vocalSettings = useStudioStore((s) => s.vocalSettings);

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <Mic2 className="h-5 w-5 text-stoun-violet" />
        <h2 className="font-semibold">Vocal — My Voice</h2>
      </div>
      <div className="flex flex-wrap gap-2">
        <ActionButton action="cleanVoice" label="Improve voice" icon={Mic2} done={vocalSettings.improved} />
        <ActionButton action="correctPitch" label="Correct pitch" icon={Music3} done={vocalSettings.pitchCorrected} />
        <ActionButton action="correctTiming" label="Correct timing" icon={Clock3} done={vocalSettings.timingCorrected} />
        <ActionButton action="addHarmony" label="Add harmonies" icon={Users} done={vocalSettings.harmonyAdded} />
        <ActionButton action="cleanVoice" label="Make voice warmer" icon={Flame} />
        <ActionButton action="cleanVoice" label="Make it darker" icon={Snowflake} />
        <ActionButton action="cleanVoice" label="Make it more emotional" icon={Heart} />
      </div>
    </Card>
  );
}
