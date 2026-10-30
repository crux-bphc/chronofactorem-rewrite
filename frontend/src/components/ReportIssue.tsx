import { ExternalLink } from "lucide-react";

const ReportIssue = ({ error }: { error: string }) => (
  <span className="text-ink-muted">
    Unexpected error: {error}
    <br />
    Please{" "}
    <a
      href="https://github.com/crux-bphc/chronofactorem-rewrite/issues"
      className="inline-flex items-baseline gap-1 text-brand underline underline-offset-2"
    >
      report this issue
      <ExternalLink size={14} />
    </a>
  </span>
);

export default ReportIssue;
