import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';

import { deleteOldCalls } from '../../firebase/cloudFunktions';
import Button from '../../components/Button/Button'
import Logo from '../../assets/fw_lev_logo.png'

import './HomeScreen.css';

export default function HomeScreen({ setRole }) {
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    function handleKindClick() {
        navigate('/kind');
    }
    function handleLeitstelleClick() {
        navigate('/leitstelle');
    }

    useEffect(() => {
        async function clear() {
            const minutes = 10;
            await deleteOldCalls(minutes);
            setLoading(false);
        }
        clear();
    }, []);

    return (
        <div className="home-screen">
            <h1>Notruf 112 Lern-App</h1>
            <p>Mit dieser App können Kinder lernen, wie man einen Notruf richtig absetzt. Bitte wähle aus, ob du das Kind oder die Leitstelle sein möchtest.</p>

            <Button variant="primary" size="large" onClick={() => handleKindClick()}>Ich bin das Kind</Button>
            <Button variant="secondary" size="large" onClick={() => handleLeitstelleClick()}>Ich bin die Leitstelle</Button>

            <img src={Logo} alt="Logo" className="logo" />
        </div>
    )
}