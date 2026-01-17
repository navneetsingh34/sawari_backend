/**
 * Bid Status Enum
 *
 * Lifecycle states of a bid.
 */

export enum BidStatus {
  ACTIVE = 'ACTIVE', // Bid placed, waiting for decision
  ACCEPTED = 'ACCEPTED', // Winning bid
  REJECTED = 'REJECTED', // Lost to another driver or explicit reject
  EXPIRED = 'EXPIRED', // Timeout (Future feature)
}
