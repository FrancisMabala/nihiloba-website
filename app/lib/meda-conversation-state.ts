import type {MedaEnquiry, MedaMessage} from '../components/shida/meda-participation';

type Ticket = {reference: string; selection: number; request: number; before?: string};

function messages(first: MedaMessage[] = [], second: MedaMessage[] = []) {
  const unique = new Map(first.map(message => [message.reference, message]));
  for (const message of second) unique.set(message.reference, message);
  return [...unique.values()].sort((a, b) => a.created_at.localeCompare(b.created_at));
}

/** A workspace-local response guard; never shared between signed-in identities. */
export class MedaConversationState {
  private reference: string | null = null;
  private selection = 0;
  private request = 0;
  private applied = 0;
  private value: MedaEnquiry | null = null;

  select(reference: string | null) {
    if (reference !== this.reference) {
      this.reference = reference;
      this.selection++;
      this.value = null;
      this.applied = 0;
    }
  }

  begin(before?: string): Ticket | null {
    return this.reference ? {reference: this.reference, selection: this.selection,
      request: ++this.request, before} : null;
  }

  accept(ticket: Ticket | null, incoming: MedaEnquiry): MedaEnquiry | null {
    if (!ticket || ticket.selection !== this.selection || ticket.reference !== this.reference ||
        incoming.reference !== this.reference) return null;
    const current = this.value;
    if (ticket.before) {
      // A historical page may arrive after a new message or agreement. Merge its
      // messages only; it must never restore old permissions, terms or status.
      if (!current || current.older !== ticket.before) return null;
      this.value = {...current, messages: messages(incoming.messages, current.messages), older: incoming.older};
    } else {
      if (current && (incoming.revision < current.revision ||
          (incoming.revision === current.revision && ticket.request < this.applied))) return null;
      this.applied = Math.max(this.applied, ticket.request);
      this.value = {...incoming, messages: messages(current?.messages, incoming.messages),
        older: current ? current.older : incoming.older};
    }
    return this.value;
  }
}
