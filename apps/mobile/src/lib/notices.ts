// Lets code outside React (the API client, signOut) ask the UI to show a toast.
type Listener = (message: string) => void;

const listeners = new Set<Listener>();

export function publishNotice(message: string): void {
  listeners.forEach((listener) => listener(message));
}

export function subscribeToNotices(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
