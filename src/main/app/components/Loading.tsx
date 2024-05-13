import React from 'react';
import css from './Loading.module.css';

export const Loading = () => (
  <svg
    className={css.Loading}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="18"
    viewBox="0 0 24 18"
  >
    <circle
      fill="currentColor"
      stroke="none"
      cx="4"
      cy="9"
      r="2.5"
    >
      <animate
        attributeName="opacity"
        dur="1s"
        values="0;1;0"
        repeatCount="indefinite"
        begin="0.1"
      />
    </circle>
    <circle
      fill="currentColor"
      stroke="none"
      cx="12"
      cy="9"
      r="2.5"
    >
      <animate
        attributeName="opacity"
        dur="1s"
        values="0;1;0"
        repeatCount="indefinite"
        begin="0.2"
      />
    </circle>
    <circle
      fill="currentColor"
      stroke="none"
      cx="20"
      cy="9"
      r="2.5"
    >
      <animate
        attributeName="opacity"
        dur="1s"
        values="0;1;0"
        repeatCount="indefinite"
        begin="0.3"
      />
    </circle>
  </svg>
);
