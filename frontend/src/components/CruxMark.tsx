// the crux mark from public/logo.svg, inline so it can take a theme tint
const PATHS = [
  "M237.868 874.624 167.157 803.553 379.289 591.421 308.579 520.711 96.4466 732.843 25.7359 662.132 237.868 450 25.739 237.868 237.868 25.7359 379.289 167.157 308.579 237.868 237.868 167.157 167.157 237.868 662.132 732.843 732.843 662.132 662.132 591.421 732.843 520.711 874.264 662.132 662.132 874.264 450 662.132Z",
  "M591.421 520.711 520.711 450 803.553 167.157 874.264 237.868Z",
  "M732.843 96.4466 662.132 25.7359 379.289 308.579 450 379.289Z",
];

/**
 * Fills the background of pages that are otherwise mostly empty: login,
 * register, about, not found and the timetable load error. Busier pages, and
 * Home, which has its own empty state, leave it out.
 */
export function CruxMark() {
  return (
    <div className="crux-mark">
      <svg aria-hidden="true" viewBox="0 0 900 900" fill="currentColor">
        {PATHS.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    </div>
  );
}
