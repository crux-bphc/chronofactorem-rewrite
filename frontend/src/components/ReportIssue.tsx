import { ExternalLink } from "lucide-react";

const ReportIssue = ({ error }: { error: string }) => (
  <span>
    Unexpected error: {error}
    <br />
    Please{" "}
    <span className="inline-flex items-baseline gap-1 text-blue-600 dark:text-blue-500 hover:underline">
      <a href="https://github.com/crux-bphc/chronofactorem-rewrite/issues">
        report this issue
      </a>
      <ExternalLink size={16} />
    </span>
  </span>
);

export default ReportIssue;
