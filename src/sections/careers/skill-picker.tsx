"use client";

import { useState } from "react";
import { careerSkillGroups, MAX_CAREER_SKILLS, MAX_CAREER_SKILL_LENGTH } from "@/constants/career-skills";
import s from "./careers.module.css";

type Props = { role: string; skills: string[]; onChange: (skills: string[]) => void; error?: string; onStarted: () => void };
export function CareerSkillPicker({ role, skills, onChange, error, onStarted }: Props) {
  const [custom, setCustom] = useState("");
  const [customError, setCustomError] = useState("");
  const [showAll, setShowAll] = useState(false);
  const presets = [...new Set(careerSkillGroups(role).flatMap(group => group.skills))];
  const roleSkills = [...presets, ...skills.filter(skill => !presets.some(preset => preset.toLowerCase() === skill.toLowerCase()))];
  const expanded = showAll;
  const full = skills.length >= MAX_CAREER_SKILLS;
  function toggle(skill: string) { onStarted(); onChange(skills.includes(skill) ? skills.filter(value => value !== skill) : [...skills, skill]); }
  function addCustom() {
    const entered = custom.trim();
    const skill = roleSkills.find(value => value.toLowerCase() === entered.toLowerCase()) ?? entered;
    if (!skill) { setCustomError("Enter a skill, then choose Add skill."); return; }
    if (skills.some(value => value.toLowerCase() === skill.toLowerCase())) { setCustomError("That skill is already selected."); return; }
    if (full) { setCustomError(`Remove a selection before adding another. The limit is ${MAX_CAREER_SKILLS}.`); return; }
    onStarted(); onChange([...skills, skill]); setCustom(""); setCustomError(""); setShowAll(true);
  }
  return <fieldset className={s.skillPicker} aria-invalid={!!error} aria-describedby={`cr-skills-help${error ? " cr-skills-error" : ""}`}>
    <legend className="sr-only">Choose your key skills</legend>
    <p id="cr-skills-help">Choose at least one skill you can discuss. Adding your own is optional.</p>
    {error ? (
      <p id="cr-skills-error" className={s.skillStatus} role="alert">
        {skills.length === 0 ? "Select at least one skill." : error}
      </p>
    ) : skills.length ? (
      <p className={s.skillStatus} role="status">
        {skills.length} selected · {full ? "selection limit reached" : `up to ${MAX_CAREER_SKILLS}`}
      </p>
    ) : null}
    <div id="cr-skill-options" className={s.skillOptions} data-expanded={expanded} role="group" aria-label={`Available skills for ${role}`}>
      {roleSkills.map(skill => <button type="button" key={skill} aria-pressed={skills.includes(skill)} disabled={full && !skills.includes(skill)} onClick={() => toggle(skill)} title={skill}><span>{skill}</span></button>)}
    </div>
    {roleSkills.length > 4 && <button type="button" className={s.showSkills} aria-expanded={expanded} aria-controls="cr-skill-options" onClick={() => setShowAll(value => !value)}>{showAll ? "Show fewer skills" : "Show more skills"}</button>}
    <div className={s.customSkill}>
      <label htmlFor="cr-other-skill">Another skill (optional)</label>
      <div><input id="cr-other-skill" className="field" value={custom} maxLength={MAX_CAREER_SKILL_LENGTH} placeholder="Add a skill not listed" onFocus={onStarted} onChange={event => { setCustom(event.target.value); setCustomError(""); }} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); addCustom(); } }} aria-invalid={!!customError} aria-describedby={customError ? "cr-other-skill-error" : undefined} /><button type="button" onClick={addCustom}>Add skill</button></div>
      {customError && <p id="cr-other-skill-error" role="alert">{customError}</p>}
    </div>
  </fieldset>;
}
