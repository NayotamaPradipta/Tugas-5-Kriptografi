import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';
import config from './config';
import { computeSharedKey, generateKeyPair as generateECDHKeyPair } from '../lib/ecdh.mjs';
import { generateKeyPair } from '../lib/elgamal.mjs';
import { saveECCKeysToFiles, loadECCKeysFromFiles } from '../lib/ECCKey.mjs';
import { saveSchnorrKeysToFiles, loadSchnorrKeysFromFiles } from '../lib/SchnorrKey.mjs';
import CryptoJS from 'crypto-js';
import { encrypt, decrypt } from '../lib/elgamal.mjs';
import { convertCipherToString, convertStringToCipher } from '../lib/helper.mjs';
import { generatePrivateKey, generatePublicKey, generate_DS } from '../lib/schnorr.mjs';
import bigInt from 'big-integer';
function convertPublicKeyToBigInt(publicKeyString) {
  const [x, y] = publicKeyString.split(',');
  return [BigInt(x), BigInt(y)];
}

function App(){
  const [userConfig, setUserConfig] = useState({username: 'Loading...'});
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const socketRef = useRef(null);
  const sharedKeyRef = useRef(null);
  const e2eeKeysRef = useRef(null);
  const schnorrKeysRef = useRef(null);
  const otherUserPublicKeyRef = useRef({});
  const otherSchnorrPublicKeyRef = useRef({});
  const globalSchnorrKey = useRef({});
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
      const clientKeyPair = generateECDHKeyPair();
      console.log("This user is : ", user);
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
          console.log('Client Private Key: ', clientKeyPair.privateKey);
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

    socket.on('exchangeSchnorr', (data) => {
      const { userId, publicKey } = data; 
      console.log(`Received Schnorr key from ${userId}: ${publicKey}`);
      otherSchnorrPublicKeyRef.current[userId] = publicKey;
    });


    socket.on('invalidSharedKey', () => {
      console.log('Shared key invalid. Clearing local storage');
      removeSharedKeyFromLocalStorage(user);
      socket.emit('acknowledgeInvalidKey', 'cleared');
    })

    socket.on('chat message', (msg) => {
      console.log("Received Message: ", msg);
      // Decrypt body message with shared Key
      const sharedKey = sharedKeyRef.current;
      console.log(sharedKey);
      console.log(typeof(msg));
      const bytes = CryptoJS.AES.decrypt(msg, sharedKey.toString(16));
      console.log('Bytes: ', bytes);
      const decryptedBody = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      console.log('Decrypted Body: ', decryptedBody);
      // Decrypt inner key using user's private message
      const encryptedInnerMessage = decryptedBody.message;
      console.log(encryptedInnerMessage);
      const transformedDecryptedOuter = convertStringToCipher(encryptedInnerMessage);
      console.log(transformedDecryptedOuter);
      const decryptedInner = decrypt(BigInt(e2eeKeysRef.current.privateKey), transformedDecryptedOuter);
      

      setChat((prevChat) => [...prevChat, `${decryptedBody.sender}: ${decryptedInner}`]);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  };
  const handleSendMessage = () => {
    if (socketRef.current){
      const messageToSend = message;
      const receiverName = userConfig.username.toLowerCase() === 'alice' ? 'bob' : 'alice';
      let receiverPublicKey = Object.values(otherUserPublicKeyRef.current)[0];
      if (!receiverPublicKey) {
        console.error('Receiver public key not found');
        return;
      }
      receiverPublicKey = convertPublicKeyToBigInt(receiverPublicKey);
      console.log(receiverPublicKey);
      const encryptedInnerMessage = encrypt(receiverPublicKey, messageToSend);
      const transformedEncryptedInnerMessage = convertCipherToString(encryptedInnerMessage);

      const bodyRequest = {
        sender: userConfig.username.toLowerCase(),
        receiver: receiverName,
        message: transformedEncryptedInnerMessage,
        isSigned: false, 
        sessionId: socketRef.current.id
      }

      const sharedKey = sharedKeyRef.current;
      console.log("Shared Key: ", sharedKey);
      const encryptedBody = CryptoJS.AES.encrypt(JSON.stringify(bodyRequest), sharedKey.toString(16)).toString();
      console.log(encryptedBody);

      socketRef.current.emit('chat message', encryptedBody);
      setMessage('');
      setChat((prevChat) => [...prevChat, `${userConfig.username.toLowerCase()}: ${messageToSend}`]);
    }
  }

  const handleSendMessageWithSign = () => {
    if (socketRef.current){
      socketRef.current.emit('requestSchnorrParameters');
      socketRef.current.on('receiveSchnorrParameters', (params) => {
        const { p, q, alpha } = params;
        globalSchnorrKey.current.p = bigInt(p);
        globalSchnorrKey.current.q = bigInt(q);
        globalSchnorrKey.current.alpha = bigInt(alpha);
        const messageToSend = message;
        const receiverName = userConfig.username.toLowerCase() === 'alice' ? 'bob' : 'alice';
        let receiverPublicKey = Object.values(otherUserPublicKeyRef.current)[0];
        if (!receiverPublicKey) {
          console.error('Receiver public key not found');
          return;
        }
        receiverPublicKey = convertPublicKeyToBigInt(receiverPublicKey);
        console.log(receiverPublicKey);
        const encryptedInnerMessage = encrypt(receiverPublicKey, messageToSend);
        const transformedEncryptedInnerMessage = convertCipherToString(encryptedInnerMessage);
        const dSigned = generate_DS(messageToSend, bigInt(schnorrKeysRef.current.privateKey), globalSchnorrKey.current.p, globalSchnorrKey.current.q, globalSchnorrKey.current.alpha);
  
        const bodyRequest = {
          sender: userConfig.username.toLowerCase(),
          receiver: receiverName,
          message: transformedEncryptedInnerMessage,
          isSigned: true, 
          sessionId: socketRef.current.id,
          dSigned: dSigned
        }
  
        const sharedKey = sharedKeyRef.current;
        console.log("Shared Key: ", sharedKey);
        const encryptedBody = CryptoJS.AES.encrypt(JSON.stringify(bodyRequest), sharedKey.toString(16)).toString();
        console.log(encryptedBody);
  
        socketRef.current.emit('chat message', encryptedBody);
        setMessage('');
        setChat((prevChat) => [...prevChat, `${userConfig.username.toLowerCase()}: ${messageToSend}`]);
      })

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
    const keys = generateKeyPair();
    e2eeKeysRef.current = { publicKey: keys[1], privateKey: keys[0] };
    saveECCKeysToFiles(userConfig.username, e2eeKeysRef.current.publicKey, e2eeKeysRef.current.privateKey);
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

  const handleSchnorr = () => {
    socketRef.current.emit('requestSchnorrParameters');

    socketRef.current.once('receiveSchnorrParameters', (params) => {
      const {p, q, alpha} = params; 
      globalSchnorrKey.current.p = bigInt(p);
      globalSchnorrKey.current.q = bigInt(q);
      globalSchnorrKey.current.alpha = bigInt(alpha);
      console.log("Received Schnorr parameters: ", params);

      const privateKey = generatePrivateKey(q);
      const publicKey = generatePublicKey(privateKey, p, alpha);
      console.log('Private Key: ', privateKey);
      console.log(publicKey);
      schnorrKeysRef.current = { publicKey: publicKey, privateKey: privateKey};
      saveSchnorrKeysToFiles(userConfig.username, publicKey, privateKey);
      console.log("Schnorr keys saved: ", schnorrKeysRef.current);
    })
  };

  const handleUploadSchnorr = async (e) => {
    try {
      const keys = await loadSchnorrKeysFromFiles(e);
      if (keys) {
          schnorrKeysRef.current = keys;
          console.log('Loaded Schnorr keys:', schnorrKeysRef.current);
          // Emit the public key to the server after successful load
          socketRef.current.emit('sendSchnorrPublicKey', { publicKey: schnorrKeysRef.current.publicKey });
          console.log('Emitted Schnorr Public Key to server');
      }
    } catch (error) {
      console.error("Failed to load keys:", error);
    }
  };

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
      <button onClick={handleSendMessageWithSign}>Send (Signed)</button>
      <div>
        <h2>Save E2EE Keys</h2>
        <button onClick={handleGenerateAndSaveKeys}>
          Generate and Save Keys
        </button>
      </div>
      <div>
        <h2>Save Schnorr Keys</h2>
        <button onClick={handleGenerateAndSaveKeys}>
          Generate and Save ECC Keys
        </button>
      </div>
      <div>
        <h2>Load E2EE Keys</h2>
        <input type="file" multiple onChange={async (e) => {
          handleFileUpload(e)
        }} />
      </div>
      <div>
        <h2>Save Schnorr Keys</h2>
        <button onClick={handleSchnorr}>
          Generate and Save Schnorr Keys
        </button>
      </div>
      <div>
        <h2>Load Schnorr Keys</h2>
        <input type="file" multiple onChange={async (e) => {
          handleUploadSchnorr(e)
        }} />
      </div>
    </div>
  );
}

export default App;
