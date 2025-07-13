const Spinner = () => {
  return (
    <div
      className={
        "flex h-12 w-12 animate-spin items-center justify-center rounded-[50%] border-8 border-t-8 border-muted-foreground border-t-muted"
      }
    >
      <div className={"h-8 w-8 rounded-[50%] bg-transparent"} />
    </div>
  );
};
export default Spinner;
