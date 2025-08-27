import React, { useEffect } from 'react';

const KeyboardShortcuts = ({ 
  onPrevious, 
  onNext, 
  onMarkForReview, 
  onClearResponse, 
  onSubmit,
  onTogglePalette,
  currentQuestionIndex,
  totalQuestions,
  disabled = false
}) => {
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if user is typing in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // Prevent default for our shortcuts
      const shortcuts = {
        'ArrowLeft': () => {
          e.preventDefault();
          if (currentQuestionIndex > 0) {
            onPrevious();
          }
        },
        'ArrowRight': () => {
          e.preventDefault();
          if (currentQuestionIndex < totalQuestions - 1) {
            onNext();
          }
        },
        'KeyM': () => {
          e.preventDefault();
          onMarkForReview();
        },
        'KeyC': () => {
          e.preventDefault();
          onClearResponse();
        },
        'KeyS': () => {
          e.preventDefault();
          onSubmit();
        },
        'KeyP': () => {
          e.preventDefault();
          onTogglePalette();
        },
        'Digit1': () => {
          e.preventDefault();
          // Select first option
          const firstOption = document.querySelector('input[type="radio"], input[type="checkbox"]');
          if (firstOption) firstOption.click();
        },
        'Digit2': () => {
          e.preventDefault();
          // Select second option
          const options = document.querySelectorAll('input[type="radio"], input[type="checkbox"]');
          if (options[1]) options[1].click();
        },
        'Digit3': () => {
          e.preventDefault();
          // Select third option
          const options = document.querySelectorAll('input[type="radio"], input[type="checkbox"]');
          if (options[2]) options[2].click();
        },
        'Digit4': () => {
          e.preventDefault();
          // Select fourth option
          const options = document.querySelectorAll('input[type="radio"], input[type="checkbox"]');
          if (options[3]) options[3].click();
        }
      };

      const shortcut = shortcuts[e.code];
      if (shortcut) {
        shortcut();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onPrevious, onNext, onMarkForReview, onClearResponse, onSubmit, onTogglePalette, currentQuestionIndex, totalQuestions, disabled]);

  return null; // This component doesn't render anything
};

export default KeyboardShortcuts;
