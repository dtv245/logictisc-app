/** Shared TMS operations constants. */

/** Loads due within this many hours are shown as "at risk" across every screen. */
export const TMS_RISK_WINDOW_HOURS = 4;

/** Safety cap for the client-side aggregation fallback (100 rows per page). */
export const TMS_MAX_LOAD_PAGES = 10;

/** Safety cap for the fleet map; trucks are paginated at 100 per page. */
export const TMS_MAX_TRUCK_PAGES = 5;
