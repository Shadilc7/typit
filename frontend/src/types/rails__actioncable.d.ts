declare module '@rails/actioncable' {
  export interface Consumer {
    subscriptions: {
      create(channel: string | object, mixin: object): Subscription;
    };
  }

  export interface Subscription {
    perform(action: string, data?: object): void;
    unsubscribe(): void;
  }

  export function createConsumer(url?: string): Consumer;
}
