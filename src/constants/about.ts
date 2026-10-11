/** About page (savotechnologies.com/about) managed content - constants. */

/**
 * About page hero photo - the figure beside "One team, accountable since
 * {year}." Managed from the admin panel (Website content → About us);
 * these constants are the coded fallback when no override is stored in
 * SiteSetting.
 *
 * Dimensions: the public slot's canonical desktop aspect is 1.2 (6:5,
 * about.module.css .heroPhoto) rendered up to ~650 CSS px wide inside the
 * two-column opening - so admin uploads crop to exactly
 * ABOUT_HERO_WIDTH × ABOUT_HERO_HEIGHT (6:5 at 2× the render width).
 * Narrower viewports keep object-fit:cover and simply crop the same
 * master wider (1.65 / 1.3), exactly like the coded photo behaves today.
 */
export const ABOUT_HERO_IMAGE = "/images/team.webp";
export const ABOUT_HERO_ALT =
  "Editorial photograph of people collaborating in a software workspace";
export const ABOUT_HERO_WIDTH = 1320;
export const ABOUT_HERO_HEIGHT = 1100;
