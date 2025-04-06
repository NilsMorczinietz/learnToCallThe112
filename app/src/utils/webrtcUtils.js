import {
  initCallInFirestore,
  addOfferCandidate,
  createCallOffer,
  saveCallOffer,
  listenForAnswer,
  listenForAnswerCandidates,
  getCallDocWithCandidates,
  addAnswerCandidate,
  listenForOfferCandidates,
  respondToCall,
  saveCallAnswer,
  updateCallStatus
} from '../firebase/cloudFunktions';

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

let peerConnection = null;

export const createPeerConnection = (localStream, onRemoteTrack) => {
  const pc = new RTCPeerConnection(servers);

  if (localStream) {
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });
  }

  const remoteStream = new MediaStream();
  pc.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
    onRemoteTrack(remoteStream);
  };

  peerConnection = pc;
  return pc;
};

export const getPeerConnection = () => peerConnection;

export const closeConnection = async (callId) => {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
    await updateCallStatus(callId, 'ended')
  }
};

export const startCall = async (localStream, onRemoteTrack, setCallIdCallback) => {
  const pc = createPeerConnection(localStream, onRemoteTrack);

  const { callId, callDoc, offerCandidates, answerCandidates } = await initCallInFirestore();
  
  setCallIdCallback(callId);

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      addOfferCandidate(offerCandidates, event.candidate);
    }
  };

  const offerDescription = await pc.createOffer();
  await pc.setLocalDescription(offerDescription);

  const offer = await createCallOffer(callDoc, offerDescription);
  await saveCallOffer(callDoc, offer);

  listenForAnswer(callDoc, pc);
  listenForAnswerCandidates(answerCandidates, pc);
};

export const answerCall = async (callId, localStream, onRemoteTrack) => {
  const pc = createPeerConnection(localStream, onRemoteTrack);

  const { callDoc, answerCandidates, offerCandidates, callData } =
    await getCallDocWithCandidates(callId);

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      addAnswerCandidate(answerCandidates, event.candidate);
    }
  };

  const offerDescription = callData.offer;
  await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

  const answerDescription = await pc.createAnswer();
  await pc.setLocalDescription(answerDescription);

  const answer = await respondToCall(callDoc, answerDescription);
  await saveCallAnswer(callDoc, answer);

  listenForOfferCandidates(offerCandidates, pc);
};

export const stopMediaTracks = (stream) => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
};
