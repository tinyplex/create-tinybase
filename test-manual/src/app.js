import {createStore} from 'tinybase';
import {createButton} from './components/button';
const updateJson = (id, content) =>
  (document.getElementById(id).innerText = JSON.stringify(content, null, 2));
const getRandom = (max = 100) => Math.floor(Math.random() * max);
const app = () => {
  const store = createStore();
  const buttonsContainer = document.getElementById('buttons');
  buttonsContainer.appendChild(
    createButton('Increment number', () =>
      store.setValue('counter', (value) => value + 1),
    ),
  );
  buttonsContainer.appendChild(
    createButton('Random number', () => store.setValue('random', getRandom())),
  );
  buttonsContainer.appendChild(
    createButton('Add a pet', () =>
      store.addRow('pets', {
        name: ['fido', 'felix', 'bubbles', 'lowly', 'polly'][getRandom(5)],
        species: store.getRowIds('species')[getRandom(5)],
      }),
    ),
  );
  store.addValuesListener(() => updateJson('valuesJson', store.getValues()));
  store.addTablesListener(() => updateJson('tablesJson', store.getTables()));
  store
    .setValue('counter', 0)
    .setRow('pets', '0', {name: 'fido', species: 'dog'})
    .setTable('species', {
      dog: {price: 5},
      cat: {price: 4},
      fish: {price: 2},
      worm: {price: 1},
      parrot: {price: 3},
    });
};
export {app};
