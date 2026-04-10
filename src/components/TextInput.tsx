import React from 'react';

export const inputClass =
    'w-full px-3 py-2.5 bg-gray-900/60 border border-gray-700/50 rounded-xl text-gray-100 ' +
    'placeholder-gray-600 focus:outline-none focus:border-sky-500/60 focus:ring-1 ' +
    'focus:ring-sky-500/30 transition-all text-sm';

type Props = React.InputHTMLAttributes<HTMLInputElement>;

const TextInput: React.FC<Props> = (props) => (
    <input {...props} className={`${inputClass}${props.className ? ` ${props.className}` : ''}`} />
);

export default TextInput;
