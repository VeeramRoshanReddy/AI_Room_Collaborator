import React, { useState } from 'react';
import styled from 'styled-components';
import { FaPlus, FaSignInAlt, FaUsers, FaClock } from 'react-icons/fa';

const Background = styled.div`
  min-height: 100%;
  width: 100%;
  background: linear-gradient(135deg, #e0e7ef 0%, #f8fafc 100%), url('https://www.transparenttextures.com/patterns/cubes.png');
  background-blend-mode: lighten;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 48px 0 0 0;
`;

const SectionTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  color: #1d4ed8;
  margin-bottom: 18px;
  font-family: 'Poppins', 'Inter', 'Montserrat', sans-serif;
`;

const RoomList = styled.div`
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
  margin-bottom: 32px;
`;

const RoomBox = styled.div`
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(37, 99, 235, 0.10);
  padding: 28px 24px;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 12px;
  transition: box-shadow 0.2s;
  &:hover {
    box-shadow: 0 8px 32px rgba(37, 99, 235, 0.18);
  }
`;

const RoomName = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 6px;
`;

const RoomMeta = styled.div`
  font-size: 0.95rem;
  color: #64748b;
  margin-bottom: 10px;
`;

const RoomActions = styled.div`
  display: flex;
  gap: 10px;
`;

const ActionButton = styled.button`
  padding: 8px 16px;
  background: linear-gradient(90deg, #1d4ed8 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.10);
  transition: background 0.2s;
  &:hover {
    background: linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%);
  }
`;

const Rooms = () => {
  // Simulated data
  const [joinedRooms] = useState([
    { name: 'AI Study Group', id: 'A1B2C3D4E5F6G7H8', members: 12 },
    { name: 'Math Wizards', id: 'MATH123456789012', members: 8 }
  ]);
  const [pendingRooms] = useState([
    { name: 'Physics Enthusiasts', id: 'PHYSICS12345678', requested: true }
  ]);

  return (
    <Background>
      <SectionTitle>Joined Rooms</SectionTitle>
      <RoomList>
        {joinedRooms.map(room => (
          <RoomBox key={room.id}>
            <RoomName><FaUsers style={{marginRight: 8}} />{room.name}</RoomName>
            <RoomMeta>ID: {room.id}</RoomMeta>
            <RoomMeta>Members: {room.members}</RoomMeta>
            <RoomActions>
              <ActionButton><FaSignInAlt /> Enter Room</ActionButton>
            </RoomActions>
          </RoomBox>
        ))}
      </RoomList>
      <SectionTitle>Pending Rooms</SectionTitle>
      <RoomList>
        {pendingRooms.map(room => (
          <RoomBox key={room.id}>
            <RoomName><FaClock style={{marginRight: 8}} />{room.name}</RoomName>
            <RoomMeta>ID: {room.id}</RoomMeta>
            <RoomMeta>Status: Pending Approval</RoomMeta>
          </RoomBox>
        ))}
      </RoomList>
      <SectionTitle>Actions</SectionTitle>
      <RoomActions>
        <ActionButton><FaPlus /> Create New Room</ActionButton>
        <ActionButton><FaSignInAlt /> Join a Room</ActionButton>
      </RoomActions>
    </Background>
  );
};

export default Rooms; 