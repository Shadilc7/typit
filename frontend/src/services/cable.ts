import { createConsumer, type Consumer } from '@rails/actioncable';
import { api } from './api';

// Create a singleton to hold the consumer so we don't recreate it on every render
let consumer: Consumer | null = null;

export const getCableConsumer = async (): Promise<Consumer> => {
  if (consumer) return consumer;

  // We authenticate via query param for WebSockets since standard browser WS doesn't support custom headers easily.
  const token = await api.getGuestToken();
  const wsUrl = `ws://${window.location.host}/cable?token=${encodeURIComponent(token)}`;
  
  consumer = createConsumer(wsUrl);
  return consumer;
};
