import { useEffect, useState, useRef } from 'react'
import io from 'socket.io-client'
import './App.css'
import config from './config'
import { computeSharedKey, generateKeyPair } from '../lib/ecdh.mjs';

function App(){
  const [userConfig, setUserConfig] = useState({username: 'Loading...'});
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const socketRef = useRef(null);
  const sharedKeyRef = useRef(null);

  useEffect(()=> {
    const port = window.location.port; 
    const user = port === '4020' ? 'alice' : port === '2040' ? 'bob' : null; 
    if (user) {
      setUserConfig(config[user]);
    } else {
      setUserConfig({username: 'Unknown User'});
    }
    // TODO: Save sharedKey to Local Storage --> Only generateKeyPair if active shared key doesn't exist
    const clientKeyPair = generateKeyPair();
    const socket = io('http://localhost:3001', {
      query: { 
        userId: user,
        clientPublicKey: clientKeyPair.publicKey
      }
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to server');
      
      // Handle server public key + Generate shared key
      socket.on('serverPublicKey', (data) => {
        console.log('Received server public key: ', data.publicKey);
        console.log('Key expires at: ', data.expiresAt);
        const sharedKey = computeSharedKey(clientKeyPair.privateKey, data.publicKey);
        console.log('Shared Key: ', sharedKey.toString(16));
        sharedKeyRef.current = sharedKey;
        sharedKeyRef.expiresAt = new Date(data.expiresAt);
      })

    })
    socket.on('chat message', (msg) => {
      setChat((prevChat) => [...prevChat, msg]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleSendMessage = () => {
    if (socketRef.current){
      const messageToSend = `${userConfig.username}: ${message}`;
      socketRef.current.emit('chat message', messageToSend);
      setMessage('');
      setChat((prevChat) => [...prevChat, messageToSend]);
    }

  }


  return (
    <div>
      <h1>Welcome, {userConfig.username}</h1>
      <div>
        {chat.map((msg, index) => (
          <p key={index}>{msg}</p>  
        ))}
      </div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
      />
      <button onClick={handleSendMessage}>Send</button>
    </div>
  );
}

export default App
