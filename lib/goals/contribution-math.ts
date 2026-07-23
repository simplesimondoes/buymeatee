/**
 * Pure integer maths for goal contributions (ADR-011). A paid gift credits
 * its goal with the gift amount (what the recipient receives). Refunds
 * reduce that credit proportionally to how much of the total charge came
 * back — all integer arithmetic, floored, clamped.
 */

/**
 * How much of a gift's goal credit should be withdrawn once
 * `amountRefunded` (cumulative, of the total charge) has been refunded.
 */
export function goalReductionForRefund(
  giftAmount: number,
  totalAmount: number,
  amountRefunded: number,
): number {
  if (giftAmount <= 0 || totalAmount <= 0 || amountRefunded <= 0) {
    return 0;
  }
  if (amountRefunded >= totalAmount) {
    return giftAmount;
  }
  return Math.min(
    giftAmount,
    Math.floor((giftAmount * amountRefunded) / totalAmount),
  );
}

/**
 * The delta to apply when a refund event moves a gift's cumulative refund
 * from `previousAmountRefunded` to `newAmountRefunded`. Negative or zero.
 */
export function goalRefundDelta(
  giftAmount: number,
  totalAmount: number,
  previousAmountRefunded: number,
  newAmountRefunded: number,
): number {
  const before = goalReductionForRefund(giftAmount, totalAmount, previousAmountRefunded);
  const after = goalReductionForRefund(giftAmount, totalAmount, newAmountRefunded);
  return Math.min(0, before - after);
}
