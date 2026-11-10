import { mount } from 'svelte';
import App from './App.svelte';
import './app.css';

const appElement = document.getElementById('app');
if (appElement === null) {
  throw new Error('The page has no #app element to start the browser app in');
}
mount(App, { target: appElement });
