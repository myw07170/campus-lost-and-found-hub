import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import '@fontsource-variable/inter'
import '@fontsource/barlow-condensed/600.css'
import '@fontsource/barlow-condensed/700.css'
import { App } from './App.jsx'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode><HashRouter><App /></HashRouter></React.StrictMode>,
)
