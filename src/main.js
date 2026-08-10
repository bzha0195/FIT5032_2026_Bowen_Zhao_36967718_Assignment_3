import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useUiStore } from '@/stores/ui'
import { useAppDataStore } from '@/stores/appData'
import '@/utils/firebase'

import '@/assets/styles/variables.css'
import '@/assets/styles/base.css'
import '@/assets/styles/responsive.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

const ui = useUiStore(pinia)
ui.hydrate()

const appData = useAppDataStore(pinia)
appData.hydrate()

app.mount('#app')
