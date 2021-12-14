/// <reference types="@emotion/react/types/css-prop" />

import * as React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router } from "react-router-dom";
import IDE from "./components/IDE";
import GlobalStyles from "./styles/GlobalStyles";

ReactDOM.render(
  <React.StrictMode>
    <GlobalStyles />
    <Router>
      <IDE />
    </Router>
  </React.StrictMode>,
  document.getElementById("root")
);
