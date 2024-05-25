import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';
import config from './config';
import { computeSharedKey, generateKeyPair } from '../lib/ecdh.mjs';
import { saveECCKeysToFiles, loadECCKeysFromFiles } from '../lib/ECCKey.mjs';

function App(){
  const [userConfig, setUserConfig] = useState({username: 'Loading...'});
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const socketRef = useRef(null);
  const sharedKeyRef = useRef(null);
  const e2eeKeysRef = useRef(null);
  const otherUserPublicKeyRef = useRef({});
  useEffect(()=> {
    // Set user
    const port = window.location.port; 
    const user = port === '4020' ? 'alice' : port === '2040' ? 'bob' : null; 
    if (user) {
      setUserConfig(config[user]);
    } else {
      setUserConfig({username: 'Unknown User'});
    }

    // Check for stored shared key first
    const storedSharedKey = getSharedKeyFromLocalStorage(user);
    if (storedSharedKey && new Date() < new Date(storedSharedKey.expiresAt)) {
      sharedKeyRef.current = storedSharedKey.sharedKey;
      sharedKeyRef.expiresAt = storedSharedKey.expiresAt;
      console.log('Using stored shared key.');
      console.log(`Shared Key ${user}: `, localStorage.getItem(`${user}_sharedKey`));

      // Connect to the server without generating new keys
      connectToServer(user);
    } else {
      // Generate a new key pair + connect to server
      const clientKeyPair = generateKeyPair();
      console.log(user);
      connectToServer(user, clientKeyPair);
    }
    
    return () => {
      if (socketRef.current) {
          socketRef.current.disconnect();
          console.log('Disconnected from server');
      }
    }
  }, []);

  const connectToServer = (user, clientKeyPair = null) => {
    const socket = io('http://localhost:3001', {
      query: clientKeyPair ? { 
        userId: user,
        clientPublicKey: clientKeyPair.publicKey
      } : { userId: user }
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to server');
      if (clientKeyPair) {
        socket.on('serverPublicKey', (data) => {
          console.log('Received server public key: ', data.publicKey);
          const sharedKey = computeSharedKey(clientKeyPair.privateKey, data.publicKey);
          console.log('Shared Key: ', sharedKey.toString(16));
          sharedKeyRef.current = sharedKey;
          sharedKeyRef.expiresAt = new Date(data.expiresAt);
          saveSharedKeyToLocalStorage(user, sharedKey, data.expiresAt);
        });
      }
    });
    // Receive public key from the other client
    socket.on('exchangePublicKeys', (data) => {
      const { userId, publicKey } = data; 
      console.log(`Received public key from ${userId}: ${publicKey}`);
      otherUserPublicKeyRef.current[userId] = publicKey;
    });

    socket.on('invalidSharedKey', () => {
      console.log('Shared key invalid. Clearing local storage');
      removeSharedKeyFromLocalStorage(user);
      socket.emit('acknowledgeInvalidKey', 'cleared');
    })

    socket.on('chat message', (msg) => {
      setChat((prevChat) => [...prevChat, msg]);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  };
  const handleSendMessage = () => {
    if (socketRef.current){
      const messageToSend = `${userConfig.username}: ${message}`;
      socketRef.current.emit('chat message', messageToSend);
      setMessage('');
      setChat((prevChat) => [...prevChat, messageToSend]);
    }
  }

  const saveSharedKeyToLocalStorage = (userId, sharedKey, expiresAt) => {
    localStorage.setItem(`${userId}_sharedKey`, sharedKey.toString());
    localStorage.setItem(`${userId}_sharedKeyExpiresAt`, expiresAt.toString());
  };
  
  const getSharedKeyFromLocalStorage = (userId) => {
    const sharedKey = localStorage.getItem(`${userId}_sharedKey`);
    const expiresAt = localStorage.getItem(`${userId}_sharedKeyExpiresAt`);
    if (sharedKey && expiresAt) {
      return { sharedKey, expiresAt: new Date(expiresAt) };
    }
    return null;
  };

  const handleGenerateAndSaveKeys = () => {
    const { publicKey, privateKey } = generateKeyPair();
    e2eeKeysRef.current = { publicKey, privateKey };
    saveECCKeysToFiles(userConfig.username, publicKey, privateKey);
    console.log('Generated and saved new E2EE keys:', e2eeKeysRef.current);
  };

  const handleFileUpload = async (e) => {
    try {
        const keys = await loadECCKeysFromFiles(e);
        if (keys) {
            e2eeKeysRef.current = keys;
            console.log('Loaded E2EE keys:', e2eeKeysRef.current);
            // Emit the public key to the server after successful load
            socketRef.current.emit('sendE2EEPublicKey', { publicKey: e2eeKeysRef.current.publicKey });
            console.log('Emitted E2EE Public Key to server');
        }
    } catch (error) {
        console.error("Failed to load keys:", error);
    }
  };

  const removeSharedKeyFromLocalStorage = (userId) => {
    localStorage.removeItem(`${userId}_sharedKey`);
    localStorage.removeItem(`${userId}_sharedKeyExpires at`);
    console.log(`Local storage cleared for user ${userId}`);
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
      <div>
        <h2>Save E2EE Keys</h2>
        <button onClick={handleGenerateAndSaveKeys}>
          Generate and Save Keys
        </button>
      </div>
      <div>
        <h2>Load E2EE Keys</h2>
        <input type="file" multiple onChange={async (e) => {
          handleFileUpload(e)
        }} />
      </div>
    </div>
  );
}

export default App;
