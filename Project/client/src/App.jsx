import { useState } from 'react';
import './App.css';
import Image from './Image';
import UserInfo from './UserInfo';
import Signup from './Signup';

function App() {
  // const [count, setCount] = useState(1)
    const [submittedUser, setSubmittedUser] = useState(null);


  return (
    <>
      {/* <Image></Image>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>

      <UserInfo name="Nasreen" course="Cs418" >Nasreen is teaching CS418</UserInfo>
      <UserInfo name="Sara" course="CS518" ></UserInfo>
      <UserInfo name="John" course="Cs471" ></UserInfo>
      <UserInfo >This is userinfo</UserInfo> */}
      <Signup onRegister={(user) => setSubmittedUser(user)} />
    </>
  )
}

export default App
