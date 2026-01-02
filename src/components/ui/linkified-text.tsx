import React from 'react';

interface LinkifiedTextProps {
  text: string;
  className?: string;
}

/**
 * Composant qui détecte automatiquement les URLs dans un texte et les rend cliquables
 * Gère également le word-wrap pour éviter les débordements
 */
export function LinkifiedText({ text, className = '' }: LinkifiedTextProps) {
  // Expression régulière pour détecter les URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  // Diviser le texte en parties : texte normal et URLs
  const parts = text.split(urlRegex);

  return (
    <span className={`break-words ${className}`}>
      {parts.map((part, index) => {
        // Si la partie correspond à une URL
        if (part.match(urlRegex)) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline break-all"
              onClick={(e) => e.stopPropagation()} // Empêcher la propagation du clic vers la carte parente
            >
              {part}
            </a>
          );
        }
        // Sinon, retourner le texte normal
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}
