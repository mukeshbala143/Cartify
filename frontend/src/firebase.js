import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCx7M0611yefTQNM6eEOzY7aVzgzJ0uPTY",
  authDomain: "cartify-fb4f1.firebaseapp.com",
  projectId: "cartify-fb4f1",
  storageBucket: "cartify-fb4f1.firebasestorage.app",
  messagingSenderId: "96774422334",
  appId: "1:96774422334:web:ccc960bde05d360776366f"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
