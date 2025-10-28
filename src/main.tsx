import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {BrowserRouter, Route, Routes} from 'react-router'
import './index.css'

import Homepage from './routes/Homepage'
import Login from './routes/Login'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path='/login' element={<Login />} />
        <Route path='*' element={<Homepage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
