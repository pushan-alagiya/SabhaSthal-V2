# SabhaSthal V2

**SabhaSthal** is an upgraded, peer-to-peer video conferencing and collaboration platform, now with additional real-time interactive features. This new version (V2) introduces a collaborative drawing board with customizable strokes and colors, enhanced chat functionality, optimized screen sharing, and user control toggles for camera and microphone. SabhaSthal V2 also includes login and sign-up functionality and a refreshed UI, creating a seamless and versatile experience for virtual meetings and collaboration.

---

<details>
<summary>Screenshots</summary>
<br>

- ![All in one](https://github.com/pushan-alagiya/SabhaSthal-V2/blob/main/Screenshorts/Screenshot%20From%202024-11-09%2021-22-01.png?raw=true)
- ![All in one](https://github.com/pushan-alagiya/SabhaSthal-V2/blob/main/Screenshorts/Screenshot%20From%202024-11-09%2021-26-52.png?raw=true)
- ![All in one](https://github.com/pushan-alagiya/SabhaSthal-V2/blob/main/Screenshorts/Screenshot%20From%202024-11-09%2021-27-41.png?raw=true)
- ![All in one](https://github.com/pushan-alagiya/SabhaSthal-V2/blob/main/Screenshorts/Screenshot%20From%202024-11-09%2021-29-01.png?raw=true)
- ![All in one](https://github.com/pushan-alagiya/SabhaSthal-V2/blob/main/Screenshorts/Screenshot%20From%202024-11-09%2021-29-57.png?raw=true)
</details>

---

## New Features in Version 2

- **Real-Time Collaborative Drawing Board**: Users can draw in real-time on a shared canvas, with live updates displayed on all participants' screens. The drawing board includes:
  - **Customizable Strokes and Colors**: Choose from various stroke sizes and colors to make collaboration more intuitive and expressive.
- **Enhanced Chat Functionality**: Optimized messaging for better performance, with real-time message delivery and a refined UI.
- **Improved Screen Sharing**: Enhanced screen sharing for smoother streaming and optimized display across devices.
- **Camera and Microphone Toggles**: Allows users to turn their camera and microphone on or off as needed for added privacy and control.
- **User Authentication**: Secure login and sign-up functionalities to manage access and enable personalized sessions.
- **Updated UI**: A redesigned, responsive interface for an intuitive and accessible user experience across all devices.

## Tech Stack

### Frontend

- **React.js**: UI framework for building interactive, component-based interfaces.
- **Socket.IO (Client)**: Enables real-time communication for video, chat, and collaborative features.
- **WebRTC**: Powers the peer-to-peer video and audio streaming.
- **Canvas API**: Used for the collaborative drawing board, enabling drawing features and color/stroke customization.

### Backend

- **Node.js**: Server runtime environment for handling requests and managing connections.
- **Express.js**: Framework for building API endpoints and server functions.
- **Socket.IO (Server)**: Manages WebSocket connections, enabling real-time communication and collaboration across users.

### Database (Optional, if implemented)

- **MongoDB**: Used for storing user credentials, allowing secure authentication and persistence of user accounts.

## Project Setup

### Prerequisites

- Node.js (v14+)
- npm or yarn for dependency management
- MongoDB (if authentication requires a database)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/pushan-alagiya/SabhaSthal-V2
   cd SabhaSthal-V2
   ```

2. **Install dependencies for both frontend and backend**

   ```bash
   # Install backend dependencies
   cd server
   npm install

   # Install frontend dependencies
   cd ../client
   npm install
   ```

3. **Running the Application**

   Start the backend and frontend servers:

   ```bash
   # Start backend server
   cd server
   npm start

   # Start frontend
   cd ../client
   npm start
   ```

## Usage Instructions

1. **Access the Application**: Navigate to `http://localhost:3000` (or the configured port).
2. **Login/Sign Up**: Create an account or log in to access the platform.
3. **Join or Create a Room**: Enter a room code to join or create a new room for a video call.
4. **Real-Time Collaboration**:
   - **Drawing Board**: Open the drawing board and use the tools to draw with different colors and strokes. All drawings update in real time across all participants’ screens.
   - **Chat**: Access the chat panel to send instant messages, with optimized delivery and improved performance.
5. **Screen Sharing**: Share your screen with other participants for presentations or collaborative viewing.
6. **Camera & Microphone Toggles**: Use the toggles to mute/unmute audio or enable/disable the video feed as desired.

## Key Modules

- **WebRTC**: Manages peer-to-peer media streaming, handling real-time video and audio transmission between clients.
- **Socket.IO**: Enables real-time communication for video conferencing, chat, and collaborative drawing.
- **Canvas API**: Implements the real-time drawing board, enabling users to draw with multiple colors and strokes, and updates across all connected participants.

## Future Enhancements

- **Recording & Playback**: Enable users to record sessions and access playback.
- **File Sharing**: Allow users to send files through the chat.
- **Advanced Whiteboard Tools**: Add more tools to the drawboard, like shapes, text, and eraser functionality.
- **Video Filters & Backgrounds**: Add virtual backgrounds or filters for improved user experience.
- **Profile & Settings**: Allow users to update profile information and adjust account settings.
