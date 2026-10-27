/** A reason that only says the posting is silent ("The posting does not mention a laptop"): the verdict "not
    mentioned" says it already. One that tells something the posting does say ("It asks for comfort with user
    research but does not say whether…") is worth keeping, and starts otherwise. */
const SAYS_NOTHING =
  /^(the posting|the post|the job posting|the ad|it)?\s*(does not|doesn't|did not|never|says nothing|makes no|gives no|has no|offers no|provides no|contains no|includes no)\b|^(no|there is no|nothing)\b|^not (mentioned|stated|specified)\b/i;

export function saysNothing(reason: string): boolean {
  return SAYS_NOTHING.test(reason.trim());
}

/** The reason worth showing for a verdict: none for a "not mentioned" that only repeats it. */
export function usefulReason(mark: string | undefined, reason: string | undefined): string | undefined {
  if (!reason) return undefined;
  return mark === 'unmentioned' && saysNothing(reason) ? undefined : reason;
}
