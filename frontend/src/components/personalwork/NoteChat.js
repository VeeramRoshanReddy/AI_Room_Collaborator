import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { FaFileUpload, FaRobot, FaUserCircle } from 'react-icons/fa';
import axios from 'axios';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  height: 100%;
`;

const UploadArea = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  border: 2.5px dashed #60a5fa;
  border-radius: 24px;
  background: rgba(224,231,239,0.7);
  cursor: pointer;
  width: 100%;
  min-height: 180px;
  transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
  &:hover {
    border-color: #3b82f6;
    background: rgba(224,231,239,0.95);
  }
`;

const ChatArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow-y: auto;
  background: transparent;
  min-width: 0;
`;

const ChatInputArea = styled.div`
  padding: 16px;
  border-top: 1.5px solid #e0e7ef;
  display: flex;
  gap: 12px;
  background: transparent;
`;

const Input = styled.input`
  flex: 1;
  padding: 14px 18px;
  border: 1.5px solid #60a5fa;
  border-radius: 16px;
  font-size: 15px;
  background: rgba(255,255,255,0.9);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.08);
  transition: border 0.2s, box-shadow 0.2s;
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.12);
  }
`;

const Button = styled.button`
  padding: 12px 24px;
  background: linear-gradient(90deg, #2563eb 0%, #3b82f6 100%);
  color: white;
  border: none;
  border-radius: 16px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.10);
  transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
  &:hover {
    background: linear-gradient(90deg, #1d4ed8 0%, #2563eb 100%);
    box-shadow: 0 4px 16px rgba(37, 99, 235, 0.18);
    transform: translateY(-2px) scale(1.03);
  }
  &:active {
    transform: scale(0.98);
  }
  &:disabled {
    background: #e0e7ef;
    color: #b6c2d6;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const Message = styled.div`
  display: flex;
  gap: 14px;
  margin-bottom: 18px;
  align-items: flex-end;
  flex-direction: ${props => props.isUser ? 'row-reverse' : 'row'};
`;

const MessageContent = styled.div`
  max-width: 70%;
  padding: 14px 18px;
  border-radius: 18px;
  background: ${props => props.isUser ? 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)' : 'rgba(224,231,239,0.8)'};
  color: ${props => props.isUser ? 'white' : '#1e293b'};
  font-size: 15px;
  line-height: 1.5;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.08);
  transition: background 0.2s, box-shadow 0.2s;
  word-wrap: break-word;
  word-break: break-word;
  white-space: pre-wrap;
`;

const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${props => props.isUser ? 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)' : 'rgba(224,231,239,0.8)'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.isUser ? 'white' : '#3b82f6'};
  font-size: 20px;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.08);
`;

const Loader = styled.div`
  margin: 24px auto;
  border: 4px solid #e0e7ef;
  border-top: 4px solid #2563eb;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  animation: spin 1s linear infinite;
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const NoteChat = () => {
  const [file, setFile] = useState(null);
  const [noteId, setNoteId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const chatRef = useRef(null);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setUploading(true);
    setFile(selectedFile);
    const formData = new FormData();
    formData.append('file', selectedFile);
    try {
      const res = await axios.post('/api/notes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });
      setNoteId(res.data.note_id);
      setMessages([]);
    } catch (err) {
      alert('File upload failed.');
    }
    setUploading(false);
  };

  const handleSend = async () => {
    if (!input.trim() || !noteId) return;
    setLoading(true);
    setMessages(msgs => [...msgs, { isUser: true, text: input }]);
    try {
      const res = await axios.post(`/api/notes/${noteId}/ask`, {
        note_id: noteId,
        question: input
      }, { withCredentials: true });
      setMessages(msgs => [...msgs, { isUser: false, text: res.data.answer }]);
    } catch (err) {
      setMessages(msgs => [...msgs, { isUser: false, text: 'Error: Could not get answer.' }]);
    }
    setInput('');
    setLoading(false);
  };

  // Scroll to bottom on new message
  React.useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <Container>
      {!noteId && (
        <UploadArea>
          <FaFileUpload size={32} style={{ marginBottom: 12, color: '#2563eb' }} />
          <input type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={handleFileChange} />
          <span style={{ color: '#2563eb', fontWeight: 600, fontSize: 16 }}>Upload PDF or DOCX to chat</span>
          {uploading && <Loader />}
        </UploadArea>
      )}
      {noteId && (
        <>
          <ChatArea ref={chatRef}>
            {messages.map((msg, idx) => (
              <Message key={idx} isUser={msg.isUser}>
                <Avatar isUser={msg.isUser}>{msg.isUser ? <FaUserCircle /> : <FaRobot />}</Avatar>
                <MessageContent isUser={msg.isUser}>{msg.text}</MessageContent>
              </Message>
            ))}
            {loading && <Loader />}
          </ChatArea>
          <ChatInputArea>
            <Input
              type="text"
              placeholder="Ask a question about the uploaded file..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              disabled={loading}
            />
            <Button onClick={handleSend} disabled={loading || !input.trim()}>
              Ask
            </Button>
          </ChatInputArea>
        </>
      )}
    </Container>
  );
};

export default NoteChat; 