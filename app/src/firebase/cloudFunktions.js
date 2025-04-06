import { Timestamp, query, where, deleteDoc, getDocs } from 'firebase/firestore';
import { firestore, collection, doc, setDoc, getDoc, updateDoc, onSnapshot, addDoc } from './firebaseConfig';

// create a new call
export const initCallInFirestore = async () => {
    const callsCollection = collection(firestore, 'calls');
    const callDoc = doc(callsCollection);
    const callId = callDoc.id;
    const offerCandidates = collection(callDoc, 'offerCandidates');
    const answerCandidates = collection(callDoc, 'answerCandidates');
    return { callId, callDoc, offerCandidates, answerCandidates };
};

export const addOfferCandidate = async (offerCandidatesRef, candidate) => {
    await addDoc(offerCandidatesRef, candidate.toJSON());
};

export const createCallOffer = async (callDoc, offerDescription) => {
    const offer = {
        sdp: offerDescription.sdp,
        type: offerDescription.type,
    };
    return offer
};

export const saveCallOffer = async (callDoc, offer) => {
    const now = new Date();
    const localTimestamp = Timestamp.fromDate(now);

    await setDoc(callDoc, {
        offer,
        status: 'waiting',
        createdAt: localTimestamp,
    });
};

export const listenForAnswer = (callDoc, pc) => {
    return onSnapshot(callDoc, (snapshot) => {
        const data = snapshot.data();
        if (!pc.currentRemoteDescription && data?.answer) {
            const answerDescription = new RTCSessionDescription(data.answer);
            pc.setRemoteDescription(answerDescription);
        }
    });
};

export const listenForAnswerCandidates = (answerCandidatesRef, pc) => {
    return onSnapshot(answerCandidatesRef, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const candidate = new RTCIceCandidate(change.doc.data());
                pc.addIceCandidate(candidate);
            }
        });
    });
};

// Answer a call
export const getCallDocWithCandidates = async (callId) => {
    const callDoc = doc(firestore, 'calls', callId);
    const answerCandidates = collection(callDoc, 'answerCandidates');
    const offerCandidates = collection(callDoc, 'offerCandidates');
    const callSnapshot = await getDoc(callDoc);
    const callData = callSnapshot.data();

    return { callDoc, answerCandidates, offerCandidates, callData };
};

export const addAnswerCandidate = async (answerCandidatesRef, candidate) => {
    await addDoc(answerCandidatesRef, candidate.toJSON());
};

export const listenForOfferCandidates = (offerCandidatesRef, pc) => {
    return onSnapshot(offerCandidatesRef, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const data = change.doc.data();
                pc.addIceCandidate(new RTCIceCandidate(data));
            }
        });
    });
};

export const saveCallAnswer = async (callDoc, answer) => {
    await updateDoc(callDoc, { answer });
};

export const respondToCall = async (callDoc, answerDescription) => {
    const answer = {
        type: answerDescription.type,
        sdp: answerDescription.sdp,
    };
    return answer
};

export const listenForCallStatusChanges = (func) => {
    const callsRef = collection(firestore, 'calls');
    const q = query(callsRef, where('status', 'in', ['waiting', 'active', 'ended']));

    onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added' || change.type === 'modified') {
                const callData = change.doc.data();
                const callId = change.doc.id;
                const newStatus = callData.status;

                func(callId, newStatus, callData);
            }
        });
    });
};

// Update the call status to 'answered' or 'ended'
export const updateCallStatus = async (callId, status) => {
    if(!callId) return;
    const callDoc = doc(firestore, 'calls', callId);
    await updateDoc(callDoc, { status });
};

// Delete old calls from Firestore
export const deleteOldCalls = async (minutes = 30) => {
    const callsRef = collection(firestore, 'calls');
    const cutoffTime = Timestamp.now().toMillis() - minutes * 60 * 1000;
    const q = query(callsRef, where('createdAt', '<=', Timestamp.fromMillis(cutoffTime)));

    const snapshot = await getDocs(q);

    snapshot.forEach(async (docSnap) => {
        await deleteDoc(docSnap.ref);
    });
};