import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { careerSkillGroups, GENERAL_CAREER_SKILL_GROUPS, MAX_CAREER_SKILLS, MAX_CAREER_SKILL_LENGTH } from "../src/constants/career-skills";
import { careerApplicationSchema, careerApplicationErrors } from "../src/schemas/career-application";
import { CareerSkillPicker } from "../src/sections/careers/skill-picker";
import { CONTENT_COLLECTIONS } from "../src/lib/content-registry";
const valid = { form: "careers", role: "HR Intern", city: "Test City", skills: ["CV screening"], experience: "Fresher", notice: "To be discussed", consent: true };

describe("Required role-aware career qualification", () => {
  it("lets admins manage every public role field and requires its public summary", () => { const fields = CONTENT_COLLECTIONS.careers.fields; const names = fields.map(field => field.name); for (const name of ["title", "slug", "track", "cat", "exp", "blurb", "duties", "brings"]) expect(names).toContain(name); expect(fields.find(field => field.name === "blurb")?.required).toBe(true); expect(names).toContain("ctcMin"); expect(names).toContain("ctcMax"); });
  it("offers only relevant HR presets", () => { const skills = careerSkillGroups("HR Intern").flatMap(group => group.skills); expect(skills).toContain("CV screening"); expect(skills).toContain("Interview scheduling"); expect(skills).toContain("HR documentation"); expect(skills).not.toContain("Python"); expect(skills).not.toContain("React"); });
  it("distinguishes model work from full-stack integration", () => { expect(careerSkillGroups("AI / ML Engineer").flatMap(group => group.skills)).toContain("PyTorch"); const skills = careerSkillGroups("Full Stack AI Engineer").flatMap(group => group.skills); for (const skill of ["React", "TypeScript", "Node.js", "LLM APIs"]) expect(skills).toContain(skill); });
  it.each([
    { role: "Backend Engineer", includes: ["API design", "SQL", "PostgreSQL", "Authentication"], excludes: ["User research", "CV screening"] },
    { role: "DevOps Engineer", includes: ["Linux", "Terraform", "Docker", "CI / CD"], excludes: ["Prototyping", "CV screening"] },
    { role: "UI/UX Designer", includes: ["Figma", "User research", "Prototyping", "Design systems"], excludes: ["Kubernetes", "Node.js"] },
  ])("offers relevant presets for $role without unrelated disciplines", ({ role, includes, excludes }) => {
    const skills = careerSkillGroups(role).flatMap(group => group.skills);
    for (const skill of includes) expect(skills).toContain(skill);
    for (const skill of excludes) expect(skills).not.toContain(skill);
    expect(new Set(skills).size).toBe(skills.length);
    expect(careerApplicationSchema.safeParse({ ...valid, role, skills: [skills[0]] }).success).toBe(true);
  });
  it("recognises the UI/ UX title spacing supplied by the owner", () => {
    expect(careerSkillGroups("UI/ UX Designer")).toBe(careerSkillGroups("UI/UX Designer"));
  });
  it("makes technology, people, operations and growth discoverable for general applications", () => { expect(careerSkillGroups("General application")).toBe(GENERAL_CAREER_SKILL_GROUPS); const skills = GENERAL_CAREER_SKILL_GROUPS.flatMap(group => group.skills); for (const skill of ["AWS", "React", "Flutter", "LLM APIs", "Figma", "Project coordination", "Customer support", "HR documentation", "SEO"]) expect(skills).toContain(skill); expect(new Set(skills).size).toBe(skills.length); });
  it("does not mistake a future managed title for an unavailable role", () => { expect(careerSkillGroups("New managed role")).toBe(GENERAL_CAREER_SKILL_GROUPS); });
  it("keeps every preset within request limits", () => { for (const role of ["HR Intern", "AI / ML Engineer", "Full Stack AI Engineer", "Backend Engineer", "DevOps Engineer", "UI/UX Designer", "General application"]) for (const group of careerSkillGroups(role)) { expect(group.skills.length).toBeGreaterThan(0); expect(group.skills.every(skill => skill.length <= MAX_CAREER_SKILL_LENGTH)).toBe(true); } });
  it("requires skills, experience and availability without excluding freshers", () => { expect(careerApplicationSchema.safeParse(valid).success).toBe(true); const result = careerApplicationSchema.safeParse({ ...valid, skills: [], experience: "", notice: "" }); expect(result.success).toBe(false); if (!result.success) expect(Object.keys(careerApplicationErrors(result.error))).toEqual(["skills", "experience", "notice"]); });
  it("requires the same fields for general applications", () => { expect(careerApplicationSchema.safeParse({ ...valid, role: "General application", skills: [] }).success).toBe(false); });
  it("requires and validates consent on the server", () => { expect(careerApplicationSchema.safeParse({ ...valid, consent: false }).success).toBe(false); const result = careerApplicationSchema.safeParse({ ...valid, consent: undefined }); expect(result.success).toBe(false); if (!result.success) expect(careerApplicationErrors(result.error)).toHaveProperty("consent"); });
  it("accepts a custom skill without inventing employer or salary requirements", () => { expect(careerApplicationSchema.safeParse({ ...valid, skills: ["A candidate-defined skill"] }).success).toBe(true); });
  it("rejects blank, duplicated, oversized and excessive skills", () => { for (const skills of [[" "], ["React", "react"], ["x".repeat(MAX_CAREER_SKILL_LENGTH + 1)], Array.from({ length: MAX_CAREER_SKILLS + 1 }, (_, i) => `Skill ${i}`)]) expect(careerApplicationSchema.safeParse({ ...valid, skills }).success).toBe(false); });
  it("renders role-specific selectable skill buttons and optional custom-skill controls", () => { const html = renderToStaticMarkup(React.createElement(CareerSkillPicker, { role: "HR Intern", skills: [], onChange: () => {}, onStarted: () => {} })); expect(html).toContain('<span>CV screening</span></button>'); expect(html).not.toContain('type="checkbox" name="skills"'); expect(html).not.toContain('id="cr-skill-search"'); expect(html).not.toContain("Search skills"); expect(html).toContain('id="cr-other-skill"'); expect(html).toContain("Another skill (optional)"); expect(html).toContain("Choose at least one skill"); expect(html).not.toContain("No skills selected"); const invalid = renderToStaticMarkup(React.createElement(CareerSkillPicker, { role: "HR Intern", skills: [], error: "Choose at least one skill or add your own.", onChange: () => {}, onStarted: () => {} })); expect(invalid).toContain('role="alert"'); expect(invalid).toContain("Select at least one skill."); expect(invalid).not.toContain("You can choose up to 12"); });
  it("shows every role skill in one flat list without category disclosures", () => {
    for (const role of ["HR Intern", "AI / ML Engineer", "Full Stack AI Engineer", "Backend Engineer", "DevOps Engineer", "UI/UX Designer", "General application"]) {
      const html = renderToStaticMarkup(React.createElement(CareerSkillPicker, { role, skills: [], onChange: () => {}, onStarted: () => {} }));
      const roleSkills = [...new Set(careerSkillGroups(role).flatMap(group => group.skills))];
      expect(html).toContain(`Available skills for ${role}`);
      expect(html).toContain("Choose your key skills");
      expect(html).not.toContain("<details");
      expect(html.match(/aria-pressed="(?:true|false)"/g)).toHaveLength(roleSkills.length);
      expect(html).toContain("Show more skills");
      expect(html).not.toContain('type="checkbox" name="skills"');
      for (const skill of roleSkills) expect(html).toContain(`<span>${skill.replaceAll("&", "&amp;")}</span>`);
    }
  });
});
