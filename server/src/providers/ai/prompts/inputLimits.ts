/** Conservative character limits for the current prompts; never silently drop content. */
export const assertInputLength = (text: string, limit: number, label: string): void => {
  if (text.length > limit) {
    throw Object.assign(new Error(
      `${label} exceeds this operation's ${limit.toLocaleString('en-US')}-character limit. Shorten a copy and try again. No partial analysis was generated; your stored resume is unchanged.`
    ), { statusCode: 422, isOperational: true, retryable: false });
  }
};
