const TimeTable = () => {
  const now = new Date();

  return (
    <div className="pr-3 w-16">
      {Array.from(Array(25).keys()).map((hour) => {
        return (
          <div
            className="text-right relative text-xs text-muted-foreground/60 h-20 last:h-0 font-medium"
            key={hour}
          >
            {now.getHours() === hour && (
              <div
                className="absolute z-20 left-full translate-x-3 w-dvw h-[2px] bg-red-500 shadow-sm"
                style={{
                  top: `${(now.getMinutes() / 60) * 100}%`,
                }}
              >
                <div className="size-2.5 rounded-full bg-red-500 absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 shadow-md animate-pulse"></div>
              </div>
            )}
            <p className="top-0 -translate-y-1/2 bg-card px-1">
              {hour === 24 ? "00" : hour.toString().padStart(2, "0")}:00
            </p>
          </div>
        );
      })}
    </div>
  );
};

export { TimeTable };
