// Shared page containers, so pages line up instead of each picking its own
// width and gutters. Pages add only their own top spacing on top of these.

// Full-width pages (Home, About): one column on phones, 1200px on desktop.
export const widePageClass =
  "mx-auto w-full max-w-[640px] px-4 pb-16 lg:max-w-[1200px] lg:px-7";

// Single-column pages (Profile, Finalize, 404): 640px everywhere.
export const narrowPageClass =
  "mx-auto w-full max-w-[640px] px-4 pb-28 lg:pt-10 lg:pb-12";
