import {createRoot} from 'react-dom/client'
import App from './App.tsx';
import 'reflect-metadata';
import './index.css'

createRoot(document.getElementById('root')!).render(
	<App/>
)
