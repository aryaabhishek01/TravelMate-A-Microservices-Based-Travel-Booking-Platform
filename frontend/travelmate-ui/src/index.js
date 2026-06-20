import React from "react";
import ReactDOM from "react-dom/client";
import 'bootstrap/dist/css/bootstrap.min.css';
import App from "./App";
import { Provider } from 'react-redux';
import { store } from './store/store';

// Globally override window.alert to prevent native browser alerts ("localhost says")
window.alert = (msg) => {
  console.warn("Global alert intercepted: ", msg);
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);