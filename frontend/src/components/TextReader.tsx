import React from 'react';

interface TextReaderProps {
  text: string;
}

export function TextReader({ text }: TextReaderProps) {
  const handleReadAloud = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      // Vous pouvez personnaliser la voix, la vitesse, etc.
      utterance.rate = 1;
      speechSynthesis.speak(utterance);
    } else {
      alert("La synthèse vocale n'est pas supportée par ce navigateur.");
    }
  };

  return (
    <div className="p-4 bg-white shadow rounded">
      <p className="text-lg">{text}</p>
      <button 
        onClick={handleReadAloud}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Lire
      </button>
    </div>
  );
}
