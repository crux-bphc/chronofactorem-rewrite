const ReportIssue = ({ error }: { error: string }) => (
  <span>
    Unexpected error: {error} Please report this{" "}
    <a href="https://github.com/crux-bphc/chronofactorem-rewrite/issues">
      here
    </a>
  </span>
);

export default ReportIssue;
