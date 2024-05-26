export const saveSchnorrKeysToFiles = (user, publicKey, privateKey) => {
    const publicKeyBlob = new Blob([publicKey.toString()], { type: 'text/plain' });
    const privateKeyBlob = new Blob([privateKey.toString()], { type: 'text/plain' });
  
    const publicKeyLink = document.createElement('a');
    publicKeyLink.href = URL.createObjectURL(publicKeyBlob);
    publicKeyLink.download = `${user}.scpub`;
    publicKeyLink.click();
  
    const privateKeyLink = document.createElement('a');
    privateKeyLink.href = URL.createObjectURL(privateKeyBlob);
    privateKeyLink.download = `${user}.scprv`;
    privateKeyLink.click();
  };

export const loadSchnorrKeysFromFiles = async (event) => {
    const files = event.target.files;
    const keys = {};
  
    for (const file of files) {
      const keyContent = await readFileAsync(file);
      if (file.name.endsWith('.scpub')) {
        keys.publicKey = keyContent;
      } else if (file.name.endsWith('.scprv')) {
        keys.privateKey = keyContent;
      }
    }
  
    if (keys.publicKey && keys.privateKey) {
      return keys;
    }
    return null;
};
  
const readFileAsync = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
};