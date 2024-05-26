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
import { generatePrivateKey, generatePublicKey, generate_DS, verify_DS } from '../lib/schnorr.mjs';
import bigInt from 'big-integer';
function convertPublicKeyToBigInt(publicKeyString) {
  const [x, y] = publicKeyString.split(',');
  return [BigInt(x), BigInt(y)];
}

function App(){
  const [userConfig, setUserConfig] = useState({username: 'Loading...'});
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [digitalSignature, setDigitalSignature] = useState('');
  const [verificationResult, setVerificationResult] = useState('');
  const socketRef = useRef(null);
  const sharedKeyRef = useRef(null);
  const e2eeKeysRef = useRef(null);
  const schnorrKeysRef = useRef(null);
  const otherUserPublicKeyRef = useRef({});
  const otherSchnorrPublicKeyRef = useRef({});
  const globalSchnorrKey = useRef({});
  const lastMessage = useRef('');
  const lastSignature = useRef('');
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
      console.log(userId);
      otherSchnorrPublicKeyRef.current[userId] = publicKey;
    });


    socket.on('invalidSharedKey', () => {
      console.log('Shared key invalid. Clearing local storage');
      removeSharedKeyFromLocalStorage(user);
      socket.emit('acknowledgeInvalidKey', 'cleared');
    })

    socket.on('chat message', (msg) => {
        // Decrypt body message with shared Key
        const sharedKey = sharedKeyRef.current;
        console.log(sharedKey);
        console.log(typeof(msg));
        const bytes = CryptoJS.AES.decrypt(msg, sharedKey.toString(16));
        console.log('Bytes: ', bytes);
        const decryptedBody = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        console.log('Decrypted Body: ', decryptedBody);
  
        if (decryptedBody.isSigned) {
          const signatureDisplay = `e: ${decryptedBody.dSigned.e}, y: ${decryptedBody.dSigned.y}`;
          setDigitalSignature(signatureDisplay);
          lastSignature.current = { e: decryptedBody.dSigned.e, y: decryptedBody.dSigned.y}
        } else {
          setDigitalSignature('');
        }
  
        // Decrypt inner key using user's private message
        const encryptedInnerMessage = decryptedBody.message;
        console.log(encryptedInnerMessage);
        const transformedDecryptedOuter = convertStringToCipher(encryptedInnerMessage);
        console.log(transformedDecryptedOuter);
        const decryptedInner = decrypt(BigInt(e2eeKeysRef.current.privateKey), transformedDecryptedOuter);
        lastMessage.current = decryptedInner;
  
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

  const verifySchnorr = () => {
    let userId = userConfig.username.toLowerCase() === 'alice' ? 'bob' : 'alice';
    const eBigInt = bigInt(lastSignature.current.e);
    const yBigInt = bigInt(lastSignature.current.y);
    const result = verify_DS(lastMessage.current, { e: eBigInt, y: yBigInt }, bigInt(otherSchnorrPublicKeyRef.current[userId]), bigInt(globalSchnorrKey.current.p), bigInt(globalSchnorrKey.current.alpha))
    setVerificationResult(result ? "true" : "false");
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-6">Welcome, {userConfig.username}</h1>
      
      <div className="bg-white p-6 rounded shadow-md w-full max-w-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Chat</h2>
        <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
          {chat.map((msg, index) => (
            <p key={index} className="p-2 bg-gray-200 rounded">{msg}</p>  
          ))}
        </div>
        <div className="flex space-x-2 mb-4">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-grow p-2 border border-gray-300 rounded"
          />
          <button
            onClick={handleSendMessage}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Send
          </button>
          <button
            onClick={handleSendMessageWithSign}
            className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600"
          >
            Send (Signed)
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded shadow-md w-full max-w-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Save E2EE Keys</h2>
        <button
          onClick={handleGenerateAndSaveKeys}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Generate and Save Keys
        </button>
      </div>
      
      <div className="bg-white p-6 rounded shadow-md w-full max-w-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Save Schnorr Keys</h2>
        <button
          onClick={handleSchnorr}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Generate and Save ECC Keys
        </button>
      </div>

      <div className="bg-white p-6 rounded shadow-md w-full max-w-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Load E2EE Keys</h2>
        <input
          type="file"
          multiple
          onChange={async (e) => handleFileUpload(e)}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      <div className="bg-white p-6 rounded shadow-md w-full max-w-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Load Schnorr Keys</h2>
        <input
          type="file"
          multiple
          onChange={async (e) => handleUploadSchnorr(e)}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      <div className="bg-white p-6 rounded shadow-md w-full max-w-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Digital Signature</h2>
        <p className="p-2 bg-gray-200 rounded max-h-96 overflow-y-auto">{digitalSignature}</p>
      </div>

      <div className="bg-white p-6 rounded shadow-md w-full max-w-lg mb-6">
        <button
          onClick={verifySchnorr}
          className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
        >
          Verify Digital Signature
        </button>
      </div>
    </div>
  );
}

export default App;
