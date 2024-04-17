import React, { useEffect, useRef, useState, useCallback } from "react";
import styled from "styled-components";

const Whiteboard = ({
  socket,
  roomId,
  whiteboardRef,
  onWhiteboardDataReceived,
}) => {
  const canvasRef = useRef(null);
  const [context, setContext] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState("black");
  const [penSize, setPenSize] = useState(2);
  const [isEraser, setIsEraser] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth / 2;
    canvas.height = window.innerHeight;

    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setContext(ctx);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startDrawing = ({ x, y }) => {
    if (!context) return;
    context.beginPath();
    context.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = useCallback(
    ({ x, y }) => {
      if (!isDrawing || !context) return;
      context.lineTo(x, y);
      context.strokeStyle = isEraser ? "white" : penColor;
      context.lineWidth = isEraser ? 10 : penSize;
      context.stroke();
    },
    [context, isDrawing, isEraser, penColor, penSize]
  );

  const endDrawing = () => {
    if (!context) return;
    context.closePath();
    setIsDrawing(false);

    // Get the canvas image data
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL();

    // Send the canvas image data to the socket
    if (socket) {
      socket.emit("whiteboard-data", { roomId, data: { url: dataURL } });
    }

    // Call receiveWhiteboardData when drawing is complete.
    if (onWhiteboardDataReceived) {
      onWhiteboardDataReceived({ url: dataURL });
    }
  };

  const handleMouseDown = (event) => {
    const { offsetX, offsetY } = event.nativeEvent;
    startDrawing({ x: offsetX, y: offsetY });
  };

  const handleMouseMove = (event) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = event.nativeEvent;
    draw({ x: offsetX, y: offsetY });
  };

  const handleMouseUp = () => {
    endDrawing();
  };

  const toggleEraser = () => {
    setIsEraser(!isEraser);
  };

  const handleColorChange = (e) => {
    setPenColor(e.target.value);
    setIsEraser(false); // Turn off eraser when changing pen color
  };

  const handleSizeChange = (e) => {
    setPenSize(Number(e.target.value));
    setIsEraser(false); // Turn off eraser when changing pen size
  };

  const receiveData = useCallback(
    (data) => {
      // Update the drawing based on the received data
      const { url } = data;
      const img = new Image();
      img.onload = () => {
        if (context) {
          context.drawImage(img, 0, 0);
        }
      };
      img.src = url;
    },
    [context]
  );

  useEffect(() => {
    // Initialize whiteboard reference here
    whiteboardRef.current = {
      receiveData: (data) => {
        // Handle received whiteboard data
        console.log("Data received", data);
      },
    };
  }, [whiteboardRef]);

  useEffect(() => {
    if (socket) {
      socket.on("FE-whiteboard-data", ({ data }) => {
        receiveData(data);
      });
    }

    return () => {
      if (socket) {
        socket.off("FE-whiteboard-data");
      }
    };
  }, [socket, receiveData]);

  const handleClearCanvas = () => {
    // Clear local canvas
    if (!context) return;
    // Broadcast message to clear canvas
    if (socket) {
      socket.emit("clear-canvas", { roomId });
    }
  };

  useEffect(() => {
    const clearCanvasListener = ({ roomId: receivedRoomId }) => {
      // Check if the received roomId matches the current roomId
      if (receivedRoomId === roomId && context) {
        // Clear canvas

        context.clearRect(
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );

        context.fillStyle = "white";
        context.fillRect(
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
      }
    };

    // Listen for clear-canvas event from the socket
    if (socket) {
      socket.on("clear-canvas", clearCanvasListener);
    }

    // Clean up event listener
    return () => {
      if (socket) {
        socket.off("clear-canvas", clearCanvasListener);
      }
    };
  }, [socket, context, roomId]);

  return (
    <WhiteboardContainer>
      <div
        style={{
          overflow: "hidden",
          position: "absolute",
          right: "1vw",
          top: "0",
          width: "28vw",
          height: "8%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          margin: "auto",
          marginTop: "10px",
          fontWeight: "600",
          fontSize: "20px",
          color: "#c34400",
        }}
      >
        Whiteboard
      </div>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          cursor: isEraser ? "cell" : "crosshair",
          border: "1px solid #ccc",
          bottom: "0",
        }}
      />
      <div
        style={{
          marginTop: "10px",
          overflow: "hidden",
          position: "absolute",
          borderRadius: "40px",
          right: "1vw",
          bottom: "0",
          width: "28vw",
          height: "8%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#1a1a1a",
          margin: "auto",
          marginBottom: "20px",
        }}
      >
        <select
          value={penColor}
          onChange={handleColorChange}
          style={{
            marginRight: "20px",
            padding: "5px",
            borderRadius: "5px",
            border: "2px solid #ccc",
            backgroundColor: penColor,
          }}
        >
          {["orange", "red", "green", "blue", "yellow", "black"].map(
            (color) => (
              <option
                key={color}
                value={color}
                style={{
                  backgroundColor: color,
                  pointerEvents: "none", // Disable hover events on options
                }}
                className="no-hover" // Add a class to target options for styling
              ></option>
            )
          )}
        </select>
        <select
          value={penSize}
          onChange={handleSizeChange}
          style={{
            padding: "5px",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
        >
          {[2, 4, 6, 8, 10].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <button
          onClick={toggleEraser}
          style={{
            marginLeft: "20px",
            padding: "5px",
            borderRadius: "5px",
            border: "1px solid #ccc",
            backgroundColor: isEraser ? "gray" : "white",
            color: isEraser ? "white" : "black",
          }}
        >
          <span role="img" aria-label="Eraser">
            {isEraser ? "✏️" : "🧼"}
          </span>
        </button>
        <button
          onClick={handleClearCanvas}
          style={{
            marginLeft: "20px",
            padding: "5px",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
        >
          <span role="img" aria-label="Eraser">
            🧹
          </span>
        </button>
      </div>
    </WhiteboardContainer>
  );
};

export default Whiteboard;

const WhiteboardContainer = styled.div`
  width: 30%;
  height: 100%;
  transition: all 2.5s ease;
`;
