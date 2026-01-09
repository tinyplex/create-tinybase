/// BEGIN setup
const store = createStore();
store.setValue('count', 0);
/// END setup

/// BEGIN handler
const increment = () => store.setValue('count', (c) => c + 1);
/// END handler
