import { FormEvent, useState } from "react";
import { ContentGoal, ContentPlanDuration } from "@/lib/api/types";
import { durationLabel, goalLabel } from "@/lib/utils/labels";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { Field, Input, Select } from "../ui/Field";

const GOALS: ContentGoal[] = [
  "generate_leads",
  "increase_awareness",
  "launch_product",
  "increase_engagement",
  "build_authority",
  "drive_website_traffic",
];

const DURATIONS: ContentPlanDuration[] = ["1_week", "2_weeks", "1_month", "3_months", "6_months"];

export interface GenerateContentPlanFormValues {
  goal: ContentGoal;
  duration: ContentPlanDuration;
  itemsPerWeek?: number;
}

interface GenerateContentPlanDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: GenerateContentPlanFormValues) => void;
  isSubmitting: boolean;
  error?: string | null;
}

export function GenerateContentPlanDialog({ open, onClose, onSubmit, isSubmitting, error }: GenerateContentPlanDialogProps) {
  const [goal, setGoal] = useState<ContentGoal>(GOALS[0]);
  const [duration, setDuration] = useState<ContentPlanDuration>("1_month");
  const [itemsPerWeek, setItemsPerWeek] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit({
      goal,
      duration,
      itemsPerWeek: itemsPerWeek ? Number(itemsPerWeek) : undefined,
    });
  }

  return (
    <Dialog open={open} onClose={onClose} title="Generate Content Plan" description="AI will build a calendar of Instagram content grounded in your company and strategy knowledge.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Marketing goal" htmlFor="goal">
          <Select id="goal" value={goal} onChange={(event) => setGoal(event.target.value as ContentGoal)}>
            {GOALS.map((g) => (
              <option key={g} value={g}>
                {goalLabel(g)}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Duration" htmlFor="duration">
          <Select id="duration" value={duration} onChange={(event) => setDuration(event.target.value as ContentPlanDuration)}>
            {DURATIONS.map((d) => (
              <option key={d} value={d}>
                {durationLabel(d)}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Content pieces per week (optional)" htmlFor="itemsPerWeek">
          <Input
            id="itemsPerWeek"
            type="number"
            min={1}
            max={14}
            placeholder="3"
            value={itemsPerWeek}
            onChange={(event) => setItemsPerWeek(event.target.value)}
          />
        </Field>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Generate Plan
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
