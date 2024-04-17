import React, { useState, useEffect, useRef, useCallback } from "react";
import Peer from "simple-peer";
import styled from "styled-components";
import socket from "../../socket";
import VideoCard from "../Video/VideoCard";
import BottomBar from "../BottomBar/BottomBar";
import Chat from "../Chat/Chat";
import Whiteboard from "../whiteboard/Whiteboard";

const Room = (props) => {
  const currentUser = sessionStorage.getItem("user");
  const [peers, setPeers] = useState([]);
  const [userVideoAudio, setUserVideoAudio] = useState({
    localUser: { video: true, audio: true },
  });
  const [videoDevices, setVideoDevices] = useState([]);
  const [displayChat, setDisplayChat] = useState(false);
  const [screenShare, setScreenShare] = useState(false);
  const [showVideoDevices, setShowVideoDevices] = useState(false);
  const [whiteboardVisible, setWhiteboardVisible] = useState(false); // State variable to manage whiteboard visibility
  // const [whiteboardStream, setWhiteboardStream] = useState(null); // State variable to manage whiteboard stream

  const whiteboardRef = useRef(); // Define whiteboardRef useRef hook

  const peersRef = useRef([]);
  const userVideoRef = useRef();
  const screenTrackRef = useRef();
  const userStream = useRef();
  const roomId = props.match.params.roomId;
  const canvasRef = useRef(); // Add canvasRef for whiteboard

  // =============================================

  const receiveWhiteboardData = useCallback(
    (data) => {
      if (whiteboardRef.current) {
        whiteboardRef.current.receiveData(data);
      } else {
        console.error("Whiteboard reference is not yet initialized.");
      }
    },
    [whiteboardRef]
  );

  // ============= LEAVE ROOM ==========================

  const goToBack = useCallback(
    (e) => {
      e.preventDefault();
      socket.emit("BE-leave-room", { roomId, leaver: currentUser });
      sessionStorage.removeItem("user");
      window.location.href = "/";
    },
    [roomId, currentUser]
  );

  // ============== USE EFFECT ==============================

  useEffect(() => {
    // Get Video Devices
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const filtered = devices.filter((device) => device.kind === "videoinput");
      setVideoDevices(filtered);
    });

    // Set Back Button Event
    window.addEventListener("popstate", goToBack);

    // Connect Camera & Mic
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        userVideoRef.current.srcObject = stream;
        userStream.current = stream;
        userStream.current.typeOfStream = "CAMERA";

        // ============= JOIN CALL ================================
        socket.emit("BE-join-room", { roomId, userName: currentUser });
        socket.on("FE-user-join", (users) => {
          // all users
          const peers = [];
          users.forEach(({ userId, info }) => {
            let { userName, video, audio } = info;
            console.log(userStream.current.typeOfStream);
            if (userName !== currentUser) {
              const peer = createPeer(userId, socket.id, stream);

              peer.userName = userName;
              peer.peerID = userId;

              peersRef.current.push({
                peerID: userId,
                peer,
                userName,
              });
              peers.push(peer);

              setUserVideoAudio((preList) => {
                return {
                  ...preList,
                  [peer.userName]: { video, audio },
                };
              });
            }
          });

          setPeers(peers);
        });

        // ============= RECEIVE CALL ==========================
        socket.on("FE-receive-call", ({ signal, from, info }) => {
          let { userName, video, audio } = info;
          const peerIdx = findPeer(from);

          if (!peerIdx) {
            const peer = addPeer(signal, from, stream);

            peer.userName = userName;

            peersRef.current.push({
              peerID: from,
              peer,
              userName: userName,
            });
            setPeers((users) => {
              return [...users, peer];
            });
            setUserVideoAudio((preList) => {
              return {
                ...preList,
                [peer.userName]: { video, audio },
              };
            });
          }
        });

        // ============= ACCEPT CALL ==========================
        socket.on("FE-call-accepted", ({ signal, answerId }) => {
          const peerIdx = findPeer(answerId);
          peerIdx.peer.signal(signal);
        });

        socket.on("FE-user-leave", ({ userId, userName }) => {
          const peerIdx = findPeer(userId);
          peerIdx.peer.destroy();
          setPeers((users) => {
            users = users.filter((user) => user.peerID !== peerIdx.peer.peerID);
            return [...users];
          });
          peersRef.current = peersRef.current.filter(
            ({ peerID }) => peerID !== userId
          );
        });
      });

    // ============= TOGGLE CAMERA ==========================
    socket.on("FE-toggle-camera", ({ userId, switchTarget }) => {
      const peerIdx = findPeer(userId);

      setUserVideoAudio((preList) => {
        let video = preList[peerIdx.userName].video;
        let audio = preList[peerIdx.userName].audio;

        if (switchTarget === "video") {
          video = !video;
        } else audio = !audio;

        return {
          ...preList,
          [peerIdx.userName]: { video, audio },
        };
      });
    });

    socket.on("FE-toggle-whiteboard", ({ whiteboardVisible }) => {
      setWhiteboardVisible(whiteboardVisible);
    });

    socket.on("FE-whiteboard-data", ({ data }) => {
      receiveWhiteboardData(data);
    });

    if (socket) {
      socket.on("canvasImage", (dataURL) => {
        const image = new Image();
        image.onload = () => {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(image, 0, 0);
        };
        image.src = dataURL;
      });
    }

    // Clean up whiteboard data event listener and disconnect socket
    return () => {
      socket.off("whiteboard-data", receiveWhiteboardData);
      socket.disconnect();
    };
  }, [currentUser, goToBack, roomId, receiveWhiteboardData]);

  // ============= CREATE PEER ==========================
  function createPeer(userId, caller, stream) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socket.emit("BE-call-user", {
        userToCall: userId,
        from: caller,
        signal,
      });
    });
    peer.on("disconnect", () => {
      peer.destroy();
    });

    return peer;
  }

  // ============= ADD PEER ==========================
  function addPeer(incomingSignal, callerId, stream) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socket.emit("BE-accept-call", { signal, to: callerId });
    });

    peer.on("disconnect", () => {
      peer.destroy();
    });

    peer.signal(incomingSignal);

    return peer;
  }

  // ============= FIND PEER ==========================
  function findPeer(id) {
    return peersRef.current.find((p) => p.peerID === id);
  }

  function createUserVideo(peer, index, arr) {
    return (
      <VideoBox
        className={`width-peer${peers.length > 8 ? "" : peers.length}`}
        onClick={expandScreen}
        key={index}
      >
        {writeUserName(peer.userName)}
        <FaIcon className="fas fa-expand" />
        <VideoCard key={index} peer={peer} number={arr.length} />
      </VideoBox>
    );
  }

  // ============= WRITE USER NAME ========================
  function writeUserName(userName, index) {
    if (userVideoAudio.hasOwnProperty(userName)) {
      if (!userVideoAudio[userName].video) {
        return <UserName key={userName}>{userName}</UserName>;
      }
    }
  }

  // ============= OPEN CHAT ==========================
  const clickChat = (e) => {
    e.stopPropagation();
    setDisplayChat(!displayChat);
  };

  // ============= TOGGLE AUDIO ==========================
  const toggleCameraAudio = (e) => {
    const target = e.target.getAttribute("data-switch");

    setUserVideoAudio((preList) => {
      let videoSwitch = preList["localUser"].video;
      let audioSwitch = preList["localUser"].audio;

      if (target === "video") {
        const userVideoTrack =
          userVideoRef.current.srcObject.getVideoTracks()[0];
        videoSwitch = !videoSwitch;
        userVideoTrack.enabled = videoSwitch;
      } else {
        const userAudioTrack =
          userVideoRef.current.srcObject.getAudioTracks()[0];
        audioSwitch = !audioSwitch;

        if (userAudioTrack) {
          userAudioTrack.enabled = audioSwitch;
        } else {
          userStream.current.getAudioTracks()[0].enabled = audioSwitch;
        }
      }

      return {
        ...preList,
        localUser: { video: videoSwitch, audio: audioSwitch },
      };
    });

    socket.emit("BE-toggle-camera-audio", { roomId, switchTarget: target });
  };

  // ============= SCREEN SHARING ==========================
  const clickScreenSharing = () => {
    if (!screenShare) {
      navigator.mediaDevices
        .getDisplayMedia({ cursor: true })
        .then((stream) => {
          const screenTrack = stream.getTracks()[0];

          peersRef.current.forEach(({ peer }) => {
            peer.replaceTrack(
              peer.streams[0]
                .getTracks()
                .find((track) => track.kind === "video"),
              screenTrack,
              userStream.current
            );
            userStream.current.typeOfStream = "SCREEN";
          });

          // Listen click end
          screenTrack.onended = () => {
            peersRef.current.forEach(({ peer }) => {
              if (isCameraOn) {
                peer.replaceTrack(
                  screenTrack,
                  peer.streams[0]
                    .getTracks()
                    .find((track) => track.kind === "video"),
                  userStream.current
                );
                userStream.current.typeOfStream = "CAMERA";
              } else {
                userStream.current.removeTrack(screenTrack);
                stream.getTracks().forEach((track) => track.stop());
                userStream.current.typeOfStream = "";
                // writeUserName(peer.userName);
              }
            });

            // Stop the screen share stream
            stream.getTracks().forEach((track) => track.stop());
            userVideoRef.current.srcObject = userStream.current;
            setScreenShare(false);
          };

          userVideoRef.current.srcObject = stream;
          screenTrackRef.current = screenTrack;
          setScreenShare(true);
        });
    } else {
      screenTrackRef.current.onended();
    }
  };

  // ============= EXPAND SHARING ==========================
  const expandScreen = (e) => {
    const elem = e.target;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitFullscreenElement) {
      elem.webkitExitFullscreen();
    } else if (elem.mozFullScreenElement) {
      elem.mozCancelFullScreen();
    } else if (elem.msFullscreenElement) {
      elem.msExitFullscreen();
    }
  };

  const clickBackground = () => {
    if (!showVideoDevices) return;
    setShowVideoDevices(false);
  };

  // ============= CAMERA TOGGLE ==========================
  let isCameraOn = true;
  const clickCameraDevice = (event) => {
    if (
      event &&
      event.target &&
      event.target.dataset &&
      event.target.dataset.value
    ) {
      const deviceId = event.target.dataset.value;
      const enabledAudio =
        userVideoRef.current.srcObject.getAudioTracks()[0].enabled;
      if (isCameraOn) {
        navigator.mediaDevices
          .getUserMedia({ video: { deviceId }, audio: enabledAudio })
          .then((stream) => {
            const newStreamTrack = stream
              .getTracks()
              .find((track) => track.kind === "video");
            const oldStreamTrack = userStream.current
              .getTracks()
              .find((track) => track.kind === "video");

            console.log(userStream.current.typeOfStream);
            if (userStream.current.typeOfStream === "CAMERA") {
              userStream.current.removeTrack(oldStreamTrack);
            }

            userStream.current.addTrack(newStreamTrack);
            userStream.current.typeOfStream = "CAMERA";
            isCameraOn = !isCameraOn;
            peersRef.current.forEach(({ peer }) => {
              peer.replaceTrack(
                oldStreamTrack,
                newStreamTrack,
                userStream.current
              );
              debugger;
              // stream.stop();
              // Stop the screen share stream
              stream.getTracks().forEach((track) => track.stop());
              userStream.current.typeOfStream = "";
              console.log(stream);
            });
          });
      }
    }
  };

  // ============= WHITEBOARD ==========================

  // Add event listener for receiving whiteboard data from server and broadcasting to peers
  socket.on("FE-whiteboard-data", ({ data }) => {
    console.log("Data received ");
    // Broadcast the received whiteboard data to all other peers
    receiveWhiteboardData(data);
  });

  // Modify toggleWhiteboard function to open whiteboard for all peers
  const toggleWhiteboard = () => {
    const newWhiteboardVisibleState = !whiteboardVisible;
    setWhiteboardVisible(newWhiteboardVisibleState);

    // Emit the new state to all peers
    socket.emit("BE-toggle-whiteboard", {
      roomId,
      whiteboardVisible: newWhiteboardVisibleState,
    });
  };

  // Add event listener for receiving whiteboard visibility toggle from server and open whiteboard for all peers
  socket.on("FE-toggle-whiteboard", ({ whiteboardVisible }) => {
    // Update whiteboard visibility for all peers
    setWhiteboardVisible(whiteboardVisible);
  });

  // ============= RETURN (ui) ==========================

  return (
    <RoomContainer onClick={clickBackground}>
      <VideoAndBarContainer>
        <VideoContainer>
          {/* Current User Video */}
          <VideoBox
            className={`width-peer${peers.length > 8 ? "" : peers.length}`}
          >
            {userVideoAudio["localUser"].video ? null : (
              <UserName>{currentUser}</UserName>
            )}
            <FaIcon className="fas fa-expand" />
            <MyVideo
              onClick={expandScreen}
              ref={userVideoRef}
              muted
              autoPlay
              playInline
            ></MyVideo>
          </VideoBox>
          {/* Joined User Vidoe */}
          {peers &&
            peers.map((peer, index, arr) => createUserVideo(peer, index, arr))}
        </VideoContainer>
        <BottomBar
          clickScreenSharing={clickScreenSharing}
          clickChat={clickChat}
          clickCameraDevice={clickCameraDevice}
          goToBack={goToBack}
          toggleCameraAudio={toggleCameraAudio}
          userVideoAudio={userVideoAudio["localUser"]}
          screenShare={screenShare}
          videoDevices={videoDevices}
          showVideoDevices={showVideoDevices}
          setShowVideoDevices={setShowVideoDevices}
          toggleWhiteboard={toggleWhiteboard} // Pass the toggleWhiteboard function to the BottomBar component
        />
      </VideoAndBarContainer>
      {displayChat && <Chat roomId={roomId} />}
      {whiteboardVisible && (
        <Whiteboard
          socket={socket}
          canvasRef={canvasRef}
          roomId={roomId}
          whiteboardRef={whiteboardRef}
          onWhiteboardDataReceived={receiveWhiteboardData}
        />
      )}
    </RoomContainer>
  );
};

const RoomContainer = styled.div`
  display: flex;
  width: 100%;
  max-height: 100%;
  flex-direction: row;
`;

const VideoContainer = styled.div`
  max-width: 100%;
  height: 92%;
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  flex-wrap: wrap;
  align-items: center;
  padding: 15px;
  box-sizing: border-box;
  gap: 10px;
  border-radius: 10px;
`;

const VideoAndBarContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100vh;
`;

const MyVideo = styled.video`
  border-radius: 10px;
`;

const VideoBox = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  > video {
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
  border-radius: 20px;
  :hover {
    > i {
      display: block;
    }
  }
`;

const UserName = styled.div`
  position: absolute;
  font-size: calc(20px + 5vmin);
  z-index: 1;
`;

const FaIcon = styled.i`
  display: none;
  position: absolute;
  right: 15px;
  top: 15px;
`;

export default Room;
