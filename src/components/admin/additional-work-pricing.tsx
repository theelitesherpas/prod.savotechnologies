"use client";

import { useState } from "react";
import { draftBillingTotal, milestoneTasks, type TaskDraft } from "@/lib/billing-items";
import { majorUnits } from "@/lib/project-finance";
import { PricedTasksEditor } from "./priced-tasks-editor";

export function AdditionalWorkPricing({ prefix, currency, amount, tasks: initialTasks }: {
  prefix: string; currency: string; amount?: number | null; tasks?: unknown;
}) {
  const [tasks, setTasks] = useState<TaskDraft[]>(() => milestoneTasks(initialTasks).map(task => ({ title: task.title, amountMajor: majorUnits(task.amount) })));
  const [cost, setCost] = useState(majorUnits(amount));
  return <div className="sm:col-span-2">
    <label htmlFor={`extra-cost-${prefix}`}>Additional cost · {currency}</label><input id={`extra-cost-${prefix}`} name="amountMajor" type="number" min="0.01" max="21474836.47" step="0.01" required value={cost} readOnly={tasks.length > 0} onChange={e => setCost(e.target.value)} className="adm-input w-full"/>
    <input type="hidden" name="tasks" value={JSON.stringify(tasks)}/>
    <PricedTasksEditor rows={tasks} currency={currency} onChange={next => {
      setTasks(next);
      const total = draftBillingTotal(next);
      if (next.length) setCost(total == null ? "" : majorUnits(total));
    }}/>
  </div>;
}
