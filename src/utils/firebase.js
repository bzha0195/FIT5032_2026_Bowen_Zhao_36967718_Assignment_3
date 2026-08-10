import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyAV_tlmQmHMzw4UKCMydT_E-tByfRwoB6U',
  authDomain: 'fit5032a3-8ed82.firebaseapp.com',
  projectId: 'fit5032a3-8ed82',
  storageBucket: 'fit5032a3-8ed82.firebasestorage.app',
  messagingSenderId: '583339585882',
  appId: '1:583339585882:web:be5235b1d7580d3f64c363'
}

const app = initializeApp(firebaseConfig)
const firebaseAuth = getAuth(app)

export { app, firebaseAuth }
