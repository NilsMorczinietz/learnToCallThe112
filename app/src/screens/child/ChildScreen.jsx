import React, { useEffect, useState, useRef, use } from 'react'
import { useNavigate } from 'react-router-dom';

import {
    startCall,
    answerCall,
    closeConnection,
    stopMediaTracks,
    getPeerConnection,
} from '../../utils/webrtcUtils';
import {
    deleteOldCalls,
    listenForCallStatusChanges,
    updateCallStatus,
} from '../../firebase/cloudFunktions';

import Numpad from '../../components/Numpad/Numpad';
import callSound from '../../assets/call_sign.mp3';

export default function ChildScreen() {
    const navigate = useNavigate();

    // State
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isCallButtonDisabled, setIsCallButtonDisabled] = useState(true);
    const [isAnswerButtonDisabled, setIsAnswerButtonDisabled] = useState(true);
    const [isMicEnabled, setIsMicEnabled] = useState(false);
    const [isHangupButtonDisabled, setIsHangupButtonDisabled] = useState(true);
    const [isCallActive, setIsCallActive] = useState(false);

    const [callIsWaiting, setCallIsWaiting] = useState(false);

    const [number, setNumber] = useState('');

    const callId = useRef('');
    function setCallId(id) {
        callId.current = id;
    }

    // Refs
    const localAudioRef = useRef(null);
    const remoteAudioRef = useRef(null);
    const callSoundRef = useRef(null);

    useEffect(() => {
        setupMicrophone();
    }, []);

    // 1. Mikrofon einrichten
    const setupMicrophone = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            setLocalStream(stream);
            if (localAudioRef.current) {
                localAudioRef.current.srcObject = stream;
            }

            setIsCallButtonDisabled(false);
            setIsAnswerButtonDisabled(false);
            setIsMicEnabled(true);
        } catch (error) {
            console.error('Fehler beim Zugriff auf das Mikrofon:', error);
        }
    };

    // 2. Anruf starten
    const handleStartCall = async () => {
        await startCall(localStream, handleRemoteStream, setCallId);
        setIsHangupButtonDisabled(false);
        setIsCallActive(true);
        setCallIsWaiting(true)
    };

    // 3. Anruf annehmen //Hier nicht nötig, da der Anruf immer gestartet wird
    const handleAnswerCall = async () => {
        await answerCall(callId, localStream, handleRemoteStream);
        setIsHangupButtonDisabled(false);
        setIsCallActive(true);
    };

    // 4. Remote-Audio-Stream setzen
    const handleRemoteStream = (stream) => {
        setRemoteStream(stream);
        if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = stream;
        }
    };

    // 5. Quit Call
    const hangUp = async () => {
        setCallIsWaiting(false);
        await closeConnection(callId.current);
        await updateCallStatus(callId.current, 'ended');
        stopMediaTracks(remoteStream);
        setRemoteStream(null);
        setCallId('');
        setIsHangupButtonDisabled(true);
        setIsCallActive(false);
    };

    // 6. reset Audio-Streams
    const resetAudioStreams = async () => {
        setCallIsWaiting(false);
        await closeConnection(callId.current);
        stopMediaTracks(localStream);
        stopMediaTracks(remoteStream);

        setLocalStream(null);
        setRemoteStream(null);
        setCallId('');
        setIsCallButtonDisabled(true);
        setIsAnswerButtonDisabled(true);
        setIsMicEnabled(false);
        setIsHangupButtonDisabled(true);
        setIsCallActive(false);
    }

    // Aufräumen bei Unmount
    useEffect(() => {
        return () => {
            setCallIsWaiting(false);
            stopMediaTracks(localStream);
            closeConnection(callId.current);
        };
    }, [localStream]);

    function handleBackClick() {
        resetAudioStreams();
        navigate('/');
    }

    const handleWaitingCall = async (updatedCallId, newStatus, callData) => {
        if (callId.current == '') return;
        if (callId.current != updatedCallId) return;
        if (newStatus == 'active') {
            console.log('Anruf angenommen');
            setCallIsWaiting(false);
        }
        if (newStatus == 'ended') {
            hangUp();
            console.log('Anruf beendet');
            setCallIsWaiting(false);
            return;
        }
    };

    useEffect(() => {
        listenForCallStatusChanges(handleWaitingCall);
    }, []);

    function handleCall() {
        if (isCallActive) {
            hangUp();
            return;
        }
        if (!number) {
            alert('Bitte eine Nummer eingeben!');
            return
        }
        if (number != '112') {
            alert('Nummer nicht richtig!');
            return
        }

        // Klingelton sicher starten im User-Kontext:
        if (callSoundRef.current) {
            callSoundRef.current.loop = true;
            callSoundRef.current.volume = 1.0;
            callSoundRef.current.play()
        }

        handleStartCall();
    }

    // Effekt für callIsWaiting NICHT mehr für play nutzen!
    useEffect(() => {
        if (!callIsWaiting && callSoundRef.current) {
            callSoundRef.current.pause();
            callSoundRef.current.currentTime = 0;
        }
    }, [callIsWaiting]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-end',
            height: '100dvh',
            backgroundColor: 'black',
        }}>
            <Numpad
                onChange={setNumber}
                handleCall={() => handleCall()}
                maxLength={10}
                // initialValue={number}
                isInCall={isCallActive}
                value={number}
            />

            <div className='back-button' style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: '16px',
                color: 'grey',
                fontWeight: 'bold',
            }} onClick={() => {
                handleBackClick()
            }}>
                Zurück

            </div>

            <div className="audio-elements">
                <audio ref={localAudioRef} autoPlay muted />
                <audio ref={remoteAudioRef} autoPlay />
                <audio ref={callSoundRef} src={callSound} loop/>
            </div>
        </div>
    )
}
