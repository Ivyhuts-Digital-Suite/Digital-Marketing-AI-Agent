import { ContentPlan } from "@/lib/api/types";
import { durationLabel, formatDateShort } from "@/lib/utils/labels";
import { Select } from "../ui/Field";

export function ContentPlanSelector({
  plans,
  selectedPlanId,
  onSelect,
}: {
  plans: ContentPlan[];
  selectedPlanId: string;
  onSelect: (planId: string) => void;
}) {
  if (plans.length <= 1) return null;

  return (
    <Select value={selectedPlanId} onChange={(event) => onSelect(event.target.value)} className="w-auto min-w-[16rem]">
      {plans.map((plan) => (
        <option key={plan._id} value={plan._id}>
          {durationLabel(plan.duration)} · {formatDateShort(plan.startDate)} · {plan.status}
        </option>
      ))}
    </Select>
  );
}
