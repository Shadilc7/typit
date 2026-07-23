import { createConsumer, type Consumer } from '@rails/actioncable';
import { api } from './api';

let consumer: Consumer | null = null;
let currentToken: string | null = null;

export const getCableConsumer = async (forceRefresh = false): Promise<Consumer> => {
  const token = await api.getGuestToken();

  if (consumer && currentToken === token && !forceRefresh) {
    return consumer;
  }

  if (consumer) {
    (consumer as any).disconnect?.();
    consumer = null;
  }

  currentToken = token;
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  
  // Target backend port 3000 dynamically or proxied cable path
  const host = (window.location.port === '5173' || window.location.port === '5174')
    ? `${window.location.hostname}:3000`
    : window.location.host;

  const wsUrl = `${wsProtocol}//${host}/cable?token=${encodeURIComponent(token)}`;
  consumer = createConsumer(wsUrl);
  return consumer;
};

