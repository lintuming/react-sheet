type Wildcard = '.';
type EventName<E> = E | Wildcard;
type EventNames<E> = EventName<E> | EventName<E>[];
class EventEmmit<E, VALUE, CALLBACK extends (value: VALUE) => void> {
  eventListeners: Map<EventName<E>, CALLBACK[]>;

  constructor() {
    this.eventListeners = new Map();
  }

  on(eventNames: EventNames<E>, listener: CALLBACK) {
    if (!Array.isArray(eventNames)) {
      eventNames = [eventNames];
    } else if (eventNames.includes('.')) {
      eventNames = ['.'];
    }
    for (const eventName of eventNames) {
      if (!this.eventListeners.has(eventName)) {
        this.eventListeners.set(eventName, []);
      }
      this.eventListeners.get(eventName)!.push(listener);
    }

    return () => {
      this.off(eventNames, listener);
    };
  }

  off(eventNames: EventNames<E>, listener: CALLBACK) {
    if (!Array.isArray(eventNames)) {
      eventNames = [eventNames];
    }
    for (const eventName of eventNames) {
      const listeners = this.eventListeners.get(eventName);
      if (listeners) {
        const l = listeners?.filter(l => l !== listener);
        this.eventListeners.set(eventName, l);
      }
    }
  }

  once(eventName: EventName<E>, listener: CALLBACK) {
    const l = (((value: VALUE) => {
      listener(value);
      this.off(eventName, l);
    }) as any) as CALLBACK;

    this.on(eventName, l);

    return () => {
      this.off(eventName, l);
    };
  }

  emit(eventName: EventName<E>, value: VALUE) {
    if (this.eventListeners.has('.')) {
      const listeners = this.eventListeners.get('.')!;
      for (let i = 0; i < listeners.length; i++) {
        listeners[i](value);
      }
    }
    if (this.eventListeners.has(eventName)) {
      const listeners = this.eventListeners.get(eventName)!;
      for (let i = 0; i < listeners.length; i++) {
        listeners[i](value);
      }
    }
  }
}

export { EventEmmit };
