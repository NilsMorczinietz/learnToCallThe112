import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import {
  deleteOldCalls,
  listenForWaitingCalls,
} from './firebase/cloudFunktions';
import Navigation from './Navigation';

function App() {
  useEffect(() => {
    async function clear() {
      const minutes = 10;
      await deleteOldCalls(minutes);
    }
    clear();
  }, []);

  return (
    <Navigation />
  );
}

export default App;
