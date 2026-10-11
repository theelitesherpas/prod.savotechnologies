/** Existing lifecycle authority: do not infer exit from lastWorkingDay alone. */
export function employeeAccessAllowed(employee: { status: string } | null | undefined): boolean {
  return !!employee && ["joining", "probation", "active", "notice"].includes(employee.status);
}
