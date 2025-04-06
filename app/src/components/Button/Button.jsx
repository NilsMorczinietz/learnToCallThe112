import React from 'react';
import './Button.css';

export default function Button({
    children,
    variant = 'primary',
    size = 'medium',
    onClick,
    disabled = false,
    className = '',
    type = 'button'
}) {
    // Combine classes
    const buttonClasses = [
        'button',
        `button--${variant}`,
        `button--${size}`,
        disabled ? 'button--disabled' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <button
            type={type}
            className={buttonClasses}
            onClick={onClick}
            disabled={disabled}
        >
            {children}
        </button>
    );
}