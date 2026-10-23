"use client";

import { useState } from "react";
import type { PublicMeetingData } from "@/lib/meeting/service";
import { MeetingSymbol } from "./meeting-art";
import { meetingDates, meetingSlots, meetingDateLabel, meetingDateParts, meetingTimeLabel, meetingTimeGroups, type MeetingClock } from "./meeting-model";
import s from "./meeting.module.css";

type Props = {
  data: PublicMeetingData; clock: MeetingClock; date: string; time: string;
  onDateChange: (date: string) => void; onTimeChange: (time: string) => void;
  dateError?: string; timeError?: string;
};

/** Native choices, explicit alternate-date mode, then start times for that exact day. */
export function MeetingAvailabilityPicker({ data, clock, date, time, onDateChange, onTimeChange, dateError, timeError }: Props) {
  const dates = meetingDates(data, clock), slots = meetingSlots(data.availableFrom, data.availableTo, date, clock);
  const [custom, setCustom] = useState(() => Boolean(data.allowSuggest && ((date && !data.availableDates.includes(date)) || !dates.length)));
  const dateDescription = `date-help${dateError ? " date-error" : ""}`;
  const timeDescription = `time-help${timeError ? " time-error" : ""}`;
  const exhausted = dates.length > 0 && dates.every(day => !meetingSlots(data.availableFrom, data.availableTo, day, clock).length);
  function chooseOther() {
    setCustom(true); onDateChange("");
  }
  return <>
    <fieldset className={s.stage} aria-describedby={dateDescription}>
      <legend><span className={s.stepNumber} aria-hidden="true">1</span>Choose a date</legend>
      <p id="date-help" className={s.stepHelp}>{dates.length ? "Select one of the dates offered by Savo." : "Choose your preferred date below."}</p>
      {dates.length ? <div className={s.dateChoices}>{dates.map(day => {
        const parts = meetingDateParts(day)!;
        const available = meetingSlots(data.availableFrom, data.availableTo, day, clock).length > 0;
        return <label key={day} className={s.dateOption}>
          <input type="radio" name="date" value={day} checked={!custom && date === day} disabled={!available} onChange={() => { setCustom(false); onDateChange(day); }} aria-label={`${meetingDateLabel(day)}${available ? "" : ". No start times remain"}`} aria-describedby={dateDescription} />
          <span className={s.dateFace} aria-hidden="true"><svg className={s.dateCheck} viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m4 10 4 4 8-8" /></svg><span className={s.dateWeekday}>{parts.weekday}</span><strong className={s.dateDay}>{parts.day}</strong><span className={s.dateMonth}>{parts.month} {parts.year}</span>{!available ? <span className={s.dateUnavailable}>No times left</span> : null}</span>
        </label>;
      })}</div> : <p className={s.emptyChoice}>No invitation dates remain. {data.allowSuggest ? "Suggest a new date below." : "Contact Savo for an updated invitation."}</p>}
      {exhausted ? <p className={s.emptyChoice}>No start times remain on these dates. {data.allowSuggest ? "Choose another date below." : "Contact Savo for an updated invitation."}</p> : null}
      {data.allowSuggest ? <div className={s.alternative}>
        <label className={s.alternativeChoice}><input type="radio" name="date" value="other" checked={custom} onChange={chooseOther} aria-controls="alternative-date-fields" /><span><MeetingSymbol /><span>Choose another date<small>None of these work? Suggest a different day.</small></span><svg className={s.alternativeArrow} viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m5 7 5 5 5-5" /></svg></span></label>
        <div id="alternative-date-fields" className={s.alternativeFields} hidden={!custom}>
          <div className={s.field}><label htmlFor="suggest-date">Your preferred date</label><input id="suggest-date" type="date" min={clock.date} value={custom ? date : ""} disabled={!custom} onChange={event => onDateChange(event.target.value)} aria-describedby={`${dateDescription} suggest-help`} aria-invalid={!!dateError} /><p id="suggest-help">Your suggestion still needs agreement from the team.</p></div>
        </div>
      </div> : null}
      {dateError ? <p id="date-error" className={s.fieldError}>{dateError}</p> : null}
    </fieldset>
    <fieldset className={s.stage} aria-describedby={timeDescription}>
      <legend><span className={s.stepNumber} aria-hidden="true">2</span>Choose a time</legend>
      <p id="time-help" className={s.stepHelp}>All times are in IST · India (UTC+5:30).</p>
      <p className={date ? s.timeDate : "sr-only"} role="status">{date ? `Start times for ${meetingDateLabel(date)}` : ""}</p>
      {slots.length ? <div className={s.timeGroups}>{meetingTimeGroups(slots).map(group => <div key={group.label} className={s.timeGroup}><p className={s.timeGroupLabel}>{group.label}</p><div className={`${s.choices} ${s.times}`}>{group.times.map(slot => <label key={slot}><input type="radio" name="time" value={slot} checked={time === slot} onChange={() => onTimeChange(slot)} aria-describedby={timeDescription} /><span>{meetingTimeLabel(slot)}</span></label>)}</div></div>)}</div> : <div className={s.timePlaceholder}><MeetingSymbol kind="clock" /><p>{date ? "No start times remain for this date. Choose another date or contact Savo." : "Time choices will appear here once you select a date."}</p></div>}
      {timeError ? <p id="time-error" className={s.fieldError}>{timeError}</p> : null}
      {slots.length ? <p className={s.timeNote}>These are suggested start times, not a live free/busy calendar.</p> : null}
    </fieldset>
  </>;
}
