import { resolve } from '$app/paths';
import type { PostingPlace } from '#lib/postings/place.js';

/** Something the user can take back for a few seconds: what happened, and the action that takes it back. */
export interface UndoOffer {
  message: string;
  /** A form action's address, called with `fields`. */
  action: string;
  fields: Record<string, string>;
}

/** One offer at a time, shown by the UndoToast in the layout; a new one replaces the last. */
export const undoState = $state<{ offer: UndoOffer | null }>({ offer: null });

export function offerUndo(offer: UndoOffer): void {
  undoState.offer = offer;
}

export function dismissUndo(): void {
  undoState.offer = null;
}

/** A move between tabs: Undo puts the posting back where it was. */
export function offerUndoMove(message: string, postingId: string, previous: PostingPlace): void {
  offerUndo({
    message,
    action: `${resolve('/postings/[id]', { id: postingId })}?/restore`,
    fields: { previous: JSON.stringify(previous) }
  });
}

/** A delete: Undo brings the posting back (its files wait a few days before they go for good). */
export function offerUndoDelete(message: string, postingId: string): void {
  offerUndo({ message, action: `${resolve('/postings')}?/undelete`, fields: { id: postingId } });
}
