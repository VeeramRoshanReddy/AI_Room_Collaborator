import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { FaFileUpload, FaRobot, FaUserCircle, FaTimes } from 'react-icons/fa';
import { useUserContext } from '../../context/UserContext';
import { toast } from 'react-toastify';

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

const FileInfo = styled.div`
  padding: 12px 16px;
  background: rgba(224,231,239,0.7);
  border-radius: 12px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const FileName = styled.span`
  font-weight: 600;
  color: #2563eb;
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  &:hover {
    background: rgba(239, 68, 68, 0.1);
  }
`;

const NoteChat = () => {
  const { makeAuthenticatedRequest } = useUserContext();
  const [file, setFile] = useState(null);
  const [noteId, setNoteId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioStatus, setAudioStatus] = useState(null);
  const chatRef = useRef(null);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error('Please upload a PDF or Word document');
      return;
    }
    
    setUploading(true);
    setFile(selectedFile);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const response = await makeAuthenticatedRequest('/api/v1/notes/upload', {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type for FormData, let browser set it
        }
      });
      
      const data = await response.json();
      setNoteId(data.note_id);
      setMessages([]);
      toast.success('File uploaded successfully!');
      
      // Load chat history if available
      await loadChatHistory(data.note_id);
      
    } catch (err) {
      console.error('File upload error:', err);
      toast.error(err.message || 'File upload failed');
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  const loadChatHistory = async (noteId) => {
    try {
      const response = await makeAuthenticatedRequest(`/api/v1/notes/${noteId}/chat-history`);
      const data = await response.json();
      
      if (data.messages && Array.isArray(data.messages)) {
        const formattedMessages = data.messages.map(msg => ({
          isUser: !msg.is_ai,
          text: msg.content,
          timestamp: msg.timestamp
        }));
        setMessages(formattedMessages);
      }
    } catch (err) {
      console.error('Error loading chat history:', err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !noteId) return;
    
    const userMessage = input.trim();
    setInput('');
    setLoading(true);
    
    // Add user message immediately
    setMessages(msgs => [...msgs, { 
      isUser: true, 
      text: userMessage,
      timestamp: new Date().toISOString()
    }]);
    
    try {
      const response = await makeAuthenticatedRequest(`/api/v1/notes/${noteId}/ask`, {
        method: 'POST',
        body: JSON.stringify({ question: userMessage })
      });
      
      const data = await response.json();
      
      // Add AI response
      setMessages(msgs => [...msgs, { 
        isUser: false, 
        text: data.answer,
        timestamp: new Date().toISOString()
      }]);
      
    } catch (err) {
      console.error('Error sending message:', err);
      setMessages(msgs => [...msgs, { 
        isUser: false, 
        text: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      }]);
      toast.error('Failed to get response');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setNoteId(null);
    setMessages([]);
    setInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Scroll to bottom on new message
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  // Audio Overview Generation
  const handleGenerateAudioOverview = async () => {
    if (!noteId) return;
    setAudioLoading(true);
    setAudioUrl(null);
    setAudioStatus('Generating script...');
    try {
      // Step 1: Generate audio script
      const genRes = await makeAuthenticatedRequest('/api/v1/audio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note_id: noteId })
      });
      const genData = await genRes.json();
      if (!genData.id) throw new Error('Failed to generate audio script');
      setAudioStatus('Synthesizing audio...');
      // Step 2: Synthesize audio
      const synthRes = await makeAuthenticatedRequest(`/api/v1/audio/${genData.id}/synthesize`, {
        method: 'POST'
      });
      const synthData = await synthRes.json();
      if (synthData.audio_url) {
        setAudioUrl(synthData.audio_url);
        setAudioStatus('Audio ready!');
      } else {
        setAudioStatus('Failed to synthesize audio');
      }
    } catch (err) {
      setAudioStatus('Error generating audio overview');
      setAudioUrl(null);
    } finally {
      setAudioLoading(false);
    }
  };

  return (
    <Container>
      {!noteId && (
        <UploadArea>
          <input 
            type="file" 
            accept=".pdf,.doc,.docx" 
            style={{ display: 'none' }} 
            onChange={handleFileChange}
            disabled={uploading}
          />
          <FaFileUpload size={32} style={{ marginBottom: 12, color: '#2563eb' }} />
          <span style={{ color: '#2563eb', fontWeight: 600, fontSize: 16 }}>
            {uploading ? 'Uploading...' : 'Upload PDF or DOCX to chat'}
          </span>
          {uploading && <Loader />}
        </UploadArea>
      )}
      
      {noteId && (
        <>
          <FileInfo>
            <FileName>{file?.name}</FileName>
            <RemoveButton onClick={handleRemoveFile}>
              <FaTimes />
            </RemoveButton>
          </FileInfo>
          
          <ChatArea ref={chatRef}>
            {messages.map((msg, idx) => (
              <Message key={idx} isUser={msg.isUser}>
                <Avatar isUser={msg.isUser}>
                  {msg.isUser ? <FaUserCircle /> : <FaRobot />}
                </Avatar>
                <MessageContent isUser={msg.isUser}>
                  {msg.text}
                </MessageContent>
              </Message>
            ))}
            {loading && (
              <Message isUser={false}>
                <Avatar isUser={false}>
                  <FaRobot />
                </Avatar>
                <MessageContent isUser={false}>
                  <Loader />
                </MessageContent>
              </Message>
            )}
          </ChatArea>
          
          <ChatInputArea>
            <Input
              type="text"
              placeholder="Ask a question about the uploaded file..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
            <Button onClick={handleSend} disabled={loading || !input.trim()}>
              Ask
            </Button>
          </ChatInputArea>
          
          <div style={{ margin: '16px 0', textAlign: 'center' }}>
            <Button onClick={handleGenerateAudioOverview} disabled={audioLoading}>
              {audioLoading ? 'Generating Audio Overview...' : 'Generate Podcast Audio Overview'}
            </Button>
            {audioStatus && <div style={{ marginTop: 8, color: '#2563eb', fontWeight: 500 }}>{audioStatus}</div>}
            {audioUrl && (
              <audio controls style={{ marginTop: 16, width: '100%' }} src={audioUrl}>
                Your browser does not support the audio element.
              </audio>
            )}
          </div>
        </>
      )}
    </Container>
  );
};

export default NoteChat; 