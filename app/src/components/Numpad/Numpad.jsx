import React, { useState } from 'react';
import './Numpad.css';

export default function Numpad({
    onChange = () => { },
    handleCall = () => { },
    maxLength = 15,
    initialValue = '',
    isInCall = false,
    value = ''
}) {
    const [inputValue, setInputValue] = useState(initialValue);
    const [isCallActive, setIsCallActive] = useState(false);

    const handleButtonPress = (value) => {
        if (inputValue.length < maxLength) {
            const newValue = inputValue + value;
            setInputValue(newValue);
            onChange(newValue);
        }
    };

    const handleDelete = () => {
        const newValue = inputValue.slice(0, -1);
        setInputValue(newValue);
        onChange(newValue);
    };

    const buttons = [
        { value: '1', label: '1' },
        { value: '2', label: '2', subLabel: 'ABC' },
        { value: '3', label: '3', subLabel: 'DEF' },
        { value: '4', label: '4', subLabel: 'GHI' },
        { value: '5', label: '5', subLabel: 'JKL' },
        { value: '6', label: '6', subLabel: 'MNO' },
        { value: '7', label: '7', subLabel: 'PQRS' },
        { value: '8', label: '8', subLabel: 'TUV' },
        { value: '9', label: '9', subLabel: 'WXYZ' },
        { value: '*', label: '*' },
        { value: '0', label: '0', subLabel: '+' },
        { value: '#', label: '#' },
    ];

    return (
        <div className="numpad">
            <div className="numpad-display">
                {value || ''}
            </div>

            <div className="numpad-grid">
                {buttons.map((button) => (
                    <button
                        key={button.value}
                        className="numpad-button"
                        onClick={() => handleButtonPress(button.value)}
                    >
                        <span className="numpad-button-main">{button.label}</span>
                        {button.subLabel && <span className="numpad-button-sub">{button.subLabel}</span>}
                    </button>
                ))}
            </div>

            <div className="numpad-controls">
                <button
                    className="numpad-delete"
                    onClick={handleDelete}
                >
                    <svg viewBox="0 0 24 24" width="24" height="24">
                        <path d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3 12.59L17.59 17 14 13.41 10.41 17 9 15.59 12.59 12 9 8.41 10.41 7 14 10.59 17.59 7 19 8.41 15.41 12 19 15.59z" fill="currentColor" />
                    </svg>
                </button>

                <button
                    className={`numpad-call ${isInCall ? 'numpad-call-active' : ''}`}
                    onClick={handleCall}
                >
                    <svg viewBox="0 0 24 24" width="24" height="24">
                        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="currentColor" />
                    </svg>
                </button>
            </div>
        </div>
    );
}