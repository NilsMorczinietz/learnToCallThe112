import React, { useEffect, useState, useRef, use } from 'react'
import { useNavigate } from 'react-router-dom';

import Button from '../../components/Button/Button';
import Logo from '../../assets/fw_lev_logo.png'
// import './ControlCenterScreen.css'; // Importiere die CSS-Datei für das Styling
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

export default function ControlCenterScreen() {
    const navigate = useNavigate();

    // State
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    // const [callId, setCallId] = useState('');
    const [isCallButtonDisabled, setIsCallButtonDisabled] = useState(true);
    const [isAnswerButtonDisabled, setIsAnswerButtonDisabled] = useState(true);
    const [isMicEnabled, setIsMicEnabled] = useState(false);
    const [isHangupButtonDisabled, setIsHangupButtonDisabled] = useState(true);
    const [isCallActive, setIsCallActive] = useState(false);

    const callId = useRef('');
    function setCallId(newCallId) {
        callId.current = newCallId;
    }

    const [waitingCallsIds, setWaitingCallsIds] = useState(new Set());
    const [waitingCallsData, setWaitingCallsData] = useState(new Map());

    // Refs
    const localAudioRef = useRef(null);
    const remoteAudioRef = useRef(null);

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

    // 2. Anruf starten  //Hier nicht nötig, da der Anru immer angenommen wird
    const handleStartCall = async () => {
        await startCall(localStream, handleRemoteStream, setCallId);
        setIsHangupButtonDisabled(false);
        setIsCallActive(true);
    };

    // 3. Anruf annehmen
    const handleAnswerCall = async (answerCallId) => {
        await answerCall(answerCallId, localStream, handleRemoteStream);
        await updateCallStatus(answerCallId, 'active');
        callId.current = answerCallId;
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
            stopMediaTracks(localStream);
            closeConnection();
        };
    }, [localStream]);

    function handleBackClick() {
        hangUp();
        navigate('/');
    }

    function addNewCallData(callId, callData) {
        const updatedCalls = new Map(waitingCallsData);
        updatedCalls.set(callId, callData);
        setWaitingCallsData(updatedCalls);
    }
    function removeCallData(callId) {
        const updatedCalls = new Map(waitingCallsData);
        updatedCalls.delete(callId);
        setWaitingCallsData(updatedCalls);
    }

    const handleWaitingCall = async (updatedCallId, newStatus, callData) => {
        setWaitingCallsIds((prev) => {
            const updatedCalls = new Set(prev);

            switch (newStatus) {
                case 'waiting':
                    updatedCalls.add(updatedCallId);
                    addNewCallData(updatedCallId, callData);
                    console.log('Call is waiting:', updatedCallId, callData);
                    break;
                case 'active':
                    updatedCalls.delete(updatedCallId);
                    removeCallData(updatedCallId);
                    console.log('Call is answered:', updatedCallId, callData);
                    break;
                case 'ended':
                    updatedCalls.delete(updatedCallId);
                    console.log('Call is ended:', updatedCallId, callData);

                    if (callId.current === updatedCallId) {
                        hangUp();
                    }
                    removeCallData(updatedCallId);
                    break;
                default:
                    updatedCalls.delete(updatedCallId);
                    removeCallData(updatedCallId);
                    console.log('Unknown status:', newStatus);
            }

            return updatedCalls;
        });
    };

    useEffect(() => {
        listenForCallStatusChanges(handleWaitingCall);
    }, []);

    function handleCancleCall(cancleCallId) {
        updateCallStatus(cancleCallId, 'ended');
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            height: '100vh',
            backgroundColor: '#f0f0f0',

        }}>
            <h1>Leitstelle Notruf 112</h1>
            {!isMicEnabled && (
                <p style={{ color: 'red' }}>Mikrofon ist deaktiviert!</p>
            )}
            Im Anruf: {isCallActive ? `Ja mit ${callId.current}` : 'Nein'}

            <Button
                onClick={hangUp}
                disabled={isHangupButtonDisabled}
                className="control-button hangup-button"
            >
                Auflegen
            </Button>

            {waitingCallsIds.size <= 0 && (
                <div style={{
                    display: 'flex',
                    width: '300px',
                    height: '100px',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'lightGrey',
                    borderRadius: '10px',
                    marginTop: '20px',
                    fontSize: '16px',
                    flexDirection: 'column',
                    gap: '10px',
                }}>
                    <div style={{ color: 'black', fontWeight: 'bold' }}>Bereit für Norufe</div>
                    <div style={{ color: 'black' }}>Warten auf eingehende Anrufe...</div>
                </div>
            )}

            {waitingCallsIds.size > 0 && (
                <>
                    {Array.from(waitingCallsIds).map((id) => {
                        const callData = waitingCallsData.get(id); // Use .get() to access Map values
                        return (
                            <div
                                key={id}
                                style={{
                                    display: 'flex',
                                    width: '300px',
                                    height: '150px',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    backgroundColor: 'lightGrey',
                                    borderRadius: '10px',
                                    marginTop: '20px',
                                    fontSize: '16px',
                                    flexDirection: 'column',
                                    gap: '14px',
                                }}
                            >
                                <div style={{ color: 'black', fontWeight: 'bold' }}>⚠️ Eingehender Notruf</div>
                                {/* <div style={{ color: 'black' }}> {id}</div> */}
                                <div style={{ color: 'black' }}>
                                    {callData ?
                                        (callData.createdAt && callData.createdAt.seconds
                                            ? new Date(callData.createdAt.seconds * 1000).toLocaleString('de-DE', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit',
                                            })
                                            : 'Unbekannt')
                                        : 'Unbekannt'}
                                </div>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        gap: '10px',
                                    }}
                                >
                                    <Button
                                        onClick={() => handleAnswerCall(id)}
                                        disabled={isCallActive || isAnswerButtonDisabled}
                                    >
                                        Antworten
                                    </Button>
                                    <Button
                                        onClick={() => handleCancleCall(id)}
                                        variant="secondary"
                                    >
                                        Ablehnen
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </>
            )}

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

            {/* <img src={Logo} alt="Logo" className="logo" /> */}

            <div className="audio-elements">
                <audio ref={localAudioRef} autoPlay muted />
                <audio ref={remoteAudioRef} autoPlay />
            </div>
        </div>
    );
}
