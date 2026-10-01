export const createSingleFlight = <T>() => {
  let active: Promise<T> | null = null;
  return {
    run(task: () => Promise<T>): Promise<T> {
      if (!active) {
        active = task().finally(() => {
          active = null;
        });
      }
      return active;
    },
  };
};
