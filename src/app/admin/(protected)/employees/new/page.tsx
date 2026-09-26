import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, Notice } from "@/components/admin/ui";
import { FormGuard } from "@/components/admin/form-guard";
import { SubmitButton } from "@/components/admin/form";
import { createEmployeeAction } from "../actions";
import { nextEmployeeCode } from "@/lib/employees";

export const metadata: Metadata = { title: "New employee" };
export const dynamic = "force-dynamic";

/** Create an employee — the next STPL0300IN-style ID is reserved and the
 *  welcome email (ID, joining details, leave policy) sends automatically. */
export default async function NewEmployeePage() {
  const code = prisma ? await nextEmployeeCode() : "STPL00001";
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="New employee"
        description="Create a new record, or enter an existing employee with their original ID. The welcome email sends automatically either way."
      />
      <Notice>
        On creation: record saved with status <strong>Pre-joining</strong>, welcome email sent from
        hr@savotechnologies.com with the employee ID, joining date and leave policy. For existing
        employees, set the joining date to their original date — leave credit accrues from it.
      </Notice>

      <FormGuard action={createEmployeeAction} className="adm-card mt-6 space-y-5 p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="emp-code" className="adm-label mb-1.5 block">Employee ID *</label>
            <input
              id="emp-code"
              name="employeeCode"
              defaultValue={code}
              required
              pattern="STPL\d{4}[A-Z]{2}"
              maxLength={10}
              className="adm-input font-mono"
              aria-describedby="emp-code-hint"
            />
            <p id="emp-code-hint" className="t-caption mt-1.5 text-muted">
              Suggested next ID: <span className="font-mono">{code}</span>. Change it only to enter an
              existing employee with their original ID — format STPL + digits + country code (e.g. STPL0217IN).
            </p>
          </div>
          <div>
            <label htmlFor="emp-name" className="adm-label mb-1.5 block">Full name *</label>
            <input id="emp-name" name="name" required maxLength={80} className="adm-input" placeholder="Aarav Mehta" />
          </div>
          <div>
            <label htmlFor="emp-email" className="adm-label mb-1.5 block">Email *</label>
            <input id="emp-email" name="email" type="email" required maxLength={120} className="adm-input" placeholder="aarav@savotechnologies.com" />
          </div>
          <div>
            <label htmlFor="emp-phone" className="adm-label mb-1.5 block">Phone</label>
            <input id="emp-phone" name="phone" maxLength={24} className="adm-input" placeholder="+91 …" />
          </div>
          <div>
            <label htmlFor="emp-position" className="adm-label mb-1.5 block">Position *</label>
            <input id="emp-position" name="position" required maxLength={80} className="adm-input" placeholder="Flutter Developer" />
          </div>
          <div>
            <label htmlFor="emp-dept" className="adm-label mb-1.5 block">Department *</label>
            <input id="emp-dept" name="department" required maxLength={80} className="adm-input" placeholder="Engineering" list="departments" />
            <datalist id="departments">
              {["Engineering", "Design", "Human Resources", "Sales", "Accounts", "Operations"].map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>
          <div>
            <label htmlFor="emp-joining" className="adm-label mb-1.5 block">Joining date *</label>
            <input id="emp-joining" name="joiningDate" type="date" required defaultValue={today} className="adm-input" />
          </div>
          <div>
            <label htmlFor="emp-probation" className="adm-label mb-1.5 block">Probation (months)</label>
            <input id="emp-probation" name="probationMonths" type="number" min={0} max={24} defaultValue={6} className="adm-input" />
          </div>
          <div>
            <label htmlFor="emp-ctc" className="adm-label mb-1.5 block">CTC</label>
            <input id="emp-ctc" name="ctc" maxLength={60} className="adm-input" placeholder="₹9,00,000 per annum" />
          </div>
          <div>
            <label htmlFor="emp-manager" className="adm-label mb-1.5 block">Reporting to</label>
            <input id="emp-manager" name="manager" maxLength={80} className="adm-input" placeholder="Rohan Desai, Engineering Lead" />
          </div>
          <div>
            <label htmlFor="emp-location" className="adm-label mb-1.5 block">Location</label>
            <input id="emp-location" name="location" maxLength={80} className="adm-input" placeholder="Indore / Remote" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
          <SubmitButton label="Create employee" />
          <Link href="/admin/employees" className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-[0.875rem] font-semibold text-muted transition-colors hover:border-foreground/40 hover:text-foreground">
            Cancel
          </Link>
          
        </div>
      </FormGuard>
    </div>
  );
}
