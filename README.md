<div align="center">

# Live Web Tracker

### Real-Time Location Sharing with Secure Private Spaces

A real-time location sharing platform built using **Firebase Authentication, Cloud Firestore, Leaflet.js, and the Browser Geolocation API**. Users can create private rooms, invite others through unique room codes or shareable links, and track live locations with instant synchronization.

<p align="center">

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Firestore](https://img.shields.io/badge/Cloud%20Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white)
![OpenStreetMap](https://img.shields.io/badge/OpenStreetMap-7EBC6F?style=for-the-badge&logo=openstreetmap&logoColor=white)

</p>

<p>

<a href="https://live-web-tracker-app.vercel.app/">Live Demo</a> •
<a href="#features">Features</a> •
<a href="#architecture">Architecture</a> •
<a href="#screenshots">Screenshots</a> •
<a href="#getting-started">Getting Started</a>

</p>

</div>

---

# Overview

**Live Web Tracker** is a browser-based real-time location sharing application that enables authenticated users to create secure private rooms and share their live location with friends, teammates, or family members.

Instead of relying on periodic API polling, the application leverages **Cloud Firestore Real-Time Listeners**, allowing every connected user to instantly receive location updates with minimal latency.

Each user's marker displays rich contextual information including:

- Live Location
- Current Speed
- Distance from You
- Human-readable Address
- Last Updated Time
- SOS Status

---

# Features

## Secure Authentication

- Google Authentication using Firebase Auth
- Persistent login sessions
- Secure user identity

---

## Private Rooms

- Create unique rooms instantly
- Join using room code
- Join directly through shareable invitation links
- Room validation before joining

---

## Real-Time Location Tracking

- Browser Geolocation API
- Continuous location updates
- Firestore real-time synchronization
- Automatic marker movement

---

## Interactive Map

- Leaflet.js integration
- OpenStreetMap tiles
- Auto zoom on first location
- Smooth marker updates

---

## Rich User Popups

Every participant marker displays:

- Profile Picture
- Display Name
- Live Address
- Speed
- Distance
- Last Updated
- SOS Status

---

## Emergency SOS

Enable SOS mode with a single click.

When activated:

- Marker color changes
- Popup automatically opens
- Other participants immediately recognize the emergency

---

## Live Distance Calculation

Automatically calculates distance between every participant using geographical coordinates.

Supports:

- Meters
- Kilometers

---

## Reverse Geocoding

Coordinates are converted into readable addresses using the **Geoapify Reverse Geocoding API**, eliminating raw latitude and longitude values.

---

## Smart Cleanup

Automatic resource management:

- Removes disconnected users
- Deletes empty rooms
- Handles browser close events
- Detects inactive users
- Fades inactive markers

---

# Architecture

```
                 Browser
                    │
        Google Authentication
                    │
           Firebase Authentication
                    │
             Cloud Firestore
                    │
          Real-Time Listeners
                    │
      ┌─────────────┴─────────────┐
      │                           │
Browser A                    Browser B
      │                           │
      └────── Live Map Sync ──────┘
```

---

# How It Works

1. User signs in using Google Authentication.
2. Creates or joins a private room.
3. Browser requests location permission.
4. `watchPosition()` continuously tracks location.
5. Coordinates are stored in Firestore.
6. Firestore listeners instantly sync updates across all connected users.
7. Geoapify converts coordinates into readable addresses.
8. Leaflet updates markers in real time.
9. Distance and speed are calculated dynamically.
10. Empty rooms and disconnected users are cleaned automatically.

---

# Engineering Challenges Solved

This project focuses on solving several real-world engineering problems:

- Real-time synchronization without polling
- Automatic cleanup of disconnected users
- Reverse geocoding integration
- Live distance computation
- Shareable room invitation system
- Emergency SOS synchronization
- Browser lifecycle cleanup
- Scalable room-based architecture

---

# Tech Stack

### Frontend

- HTML5
- CSS3
- JavaScript (ES6 Modules)

### Backend

- Firebase Authentication
- Cloud Firestore

### APIs

- Browser Geolocation API
- Geoapify Reverse Geocoding API

### Maps

- Leaflet.js
- OpenStreetMap

---

# Project Structure

```
live-web-tracker-app
│
├── assets/
│
├── src/
│   ├── controllers/
│   │      functionality.js
│   │
│   └── utils/
│          firebase.js
│
├── index.html
├── script.js
├── style.css
└── README.md
```

---

# Installation

Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/live-web-tracker-app.git
```

Navigate to the project

```bash
cd live-web-tracker-app
```

Open

```
index.html
```

Grant location permission and start sharing your live location.

---

# Screenshots


| Login | Dashboard |
|-------|-----------|
| ![](assets/login.PNG) | ![](assets/dashboard.PNG) |

| Live Map | User Popup |
|----------|------------|
| ![](assets/map.PNG) | ![](assets/popup.PNG) |

---

# Future Improvements

- Route history playback
- Geofencing alerts
- In-app chat
- Voice communication
- Push notifications
- Progressive Web App (PWA)
- Route analytics
- End-to-end encrypted rooms

---

# If you like this project

Give it a ⭐ on GitHub.

It motivates me to build more awesome projects.

---

# About the Developer

## Made with ❤️ by **Auritro Dey Kirty**

I'm a Full Stack Developer passionate about building scalable web applications and solving real-world problems through software.

### Connect with me

- **LinkedIn:** https://linkedin.com/in/auritro-dey-kirty
- **GitHub:** https://github.com/AuritroDeyKirty
- **Portfolio:** https://auritrodeykirty07.github.io/Portfolio/

---

<div align="center">

### Thanks for visiting!

</div>