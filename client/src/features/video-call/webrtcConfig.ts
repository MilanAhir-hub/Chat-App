const fallbackIceServers: RTCIceServer[] = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:global.stun.twilio.com:3478'] },
];

const parseIceServers = () => {
  const urls = import.meta.env.VITE_WEBRTC_ICE_URLS as string | undefined;

  if (!urls) {
    return fallbackIceServers;
  }

  const username = import.meta.env.VITE_WEBRTC_ICE_USERNAME as string | undefined;
  const credential = import.meta.env.VITE_WEBRTC_ICE_CREDENTIAL as
    | string
    | undefined;

  return [
    {
      urls: urls
        .split(',')
        .map((url) => url.trim())
        .filter(Boolean),
      username,
      credential,
    },
  ].filter((server) => server.urls.length > 0);
};

export const createPeerConnectionConfig = (): RTCConfiguration => ({
  iceServers: parseIceServers(),
  iceCandidatePoolSize: 4,
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require',
});

export const cameraMediaConstraints: MediaStreamConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
  video: {
    width: { ideal: 960, max: 1280 },
    height: { ideal: 540, max: 720 },
    frameRate: { ideal: 24, max: 30 },
    facingMode: 'user',
  },
};

export const screenMediaConstraints: DisplayMediaStreamOptions = {
  video: {
    width: { max: 1280 },
    height: { max: 720 },
    frameRate: { ideal: 15, max: 24 },
  },
  audio: false,
};

export const tuneVideoSender = async (sender: RTCRtpSender) => {
  const parameters = sender.getParameters();

  if (!parameters.encodings || parameters.encodings.length === 0) {
    parameters.encodings = [{}];
  }

  parameters.encodings = parameters.encodings.map((encoding) => ({
    ...encoding,
    maxBitrate: 900_000,
    maxFramerate: 24,
    scaleResolutionDownBy: encoding.scaleResolutionDownBy || 1,
  }));

  await sender.setParameters(parameters);
};
