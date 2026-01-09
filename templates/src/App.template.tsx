/// addImport("import {createStore} from 'tinybase';");
/// addImport("import {Provider, useValue} from 'tinybase/ui-react';");

const store = createStore().setValue('count', 0);

export const App = () => (
  <Provider store={store}>
    <h1>TinyBase + React</h1>
    <Counter />
  </Provider>
);

const Counter = () => {
  const count = useValue('count', store);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => store.setValue('count', (c: number) => c + 1)}>
        Increment
      </button>
    </div>
  );
};
