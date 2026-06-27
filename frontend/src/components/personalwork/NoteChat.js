import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { FaFileUpload, FaRobot, FaUserCircle, FaQuestionCircle, FaVolumeUp } from 'react-icons/fa';
import { useUserContext } from '../../context/UserContext';
import { toast } from 'react-toastify';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  min-height: 0;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 20px;
  flex: 1;
  min-height: 0;

  @media (max-width: 1000px) {
    grid-template-columns: 1fr;
  }
`;

const Panel = styled.div`
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
`;

const PanelHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
  font-weight: 700;
  color: #0f172a;
`;

const UploadArea = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  margin: 20px;
  border: 2px dashed #93c5fd;
  border-radius: 16px;
  background: #f8fafc;
  cursor: pointer;
  text-align: center;
  &:hover {
    border-color: #2563eb;
    background: #eff6ff;
  }
`;

const ChatArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
`;

const Message = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 14px;
  flex-direction: ${(p) => (p.$isUser ? 'row-reverse' : 'row')};
`;

const Bubble = styled.div`
  max-width: 75%;
  padding: 12px 16px;
  border-radius: 16px;
  background: ${(p) => (p.$isUser ? 'linear-gradient(135deg, #4f46e5, #2563eb)' : '#f1f5f9')};
  color: ${(p) => (p.$isUser ? 'white' : '#0f172a')};
  white-space: pre-wrap;
  line-height: 1.5;
`;

const Avatar = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(p) => (p.$isUser ? '#dbeafe' : '#e0e7ff')};
  color: #4f46e5;
`;

const ChatInputArea = styled.div`
  display: flex;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid #e2e8f0;
`;

const Input = styled.input`
  flex: 1;
  padding: 12px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  &:focus {
    outline: none;
    border-color: #4f46e5;
  }
`;

const Button = styled.button`
  padding: 12px 18px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #4f46e5, #2563eb);
  color: white;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SideCard = styled.div`
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
`;

const FileBadge = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: #eff6ff;
  border-radius: 10px;
  margin-top: 10px;
  font-size: 0.9rem;
  color: #1d4ed8;
`;

const QuizBlock = styled.div`
  padding: 16px;
`;

const OptionBtn = styled.button`
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  margin-top: 8px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  &.correct { background: #dcfce7; border-color: #22c55e; }
  &.incorrect { background: #fee2e2; border-color: #ef4444; }
`;

const NoteChat = ({ note, onNoteUpdate }) => {
  const { makeAuthenticatedRequest } = useUserContext();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [quizDone, setQuizDone] = useState(false);
  const [audioScript, setAudioScript] = useState(null);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const chatRef = useRef(null);

  const noteId = note?.id;
  const hasFile = note?.has_uploaded_file || note?.uploaded_file_name;

  const loadChatHistory = async () => {
    if (!noteId) return;
    try {
      const res = await makeAuthenticatedRequest(`/notes/${noteId}/chat-history`);
      const data = await res.json();
      if (!Array.isArray(data)) return;
      const formatted = [];
      data.forEach((log) => {
        if (log.question) {
          formatted.push({ id: `${log.id}-q`, isUser: true, text: log.question });
        }
        if (log.answer) {
          formatted.push({ id: `${log.id}-a`, isUser: false, text: log.answer });
        }
      });
      setMessages(formatted);
    } catch {
      // no history yet
    }
  };

  useEffect(() => {
    setMessages([]);
    setQuiz(null);
    setAudioScript(null);
    if (noteId) loadChatHistory();
    // loadChatHistory only closes over noteId (already a dep) and the stable
    // makeAuthenticatedRequest; re-run only when the selected note changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !noteId) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'doc', 'docx', 'txt'].includes(ext)) {
      toast.error('Supported formats: PDF, DOC, DOCX, TXT');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await makeAuthenticatedRequest(`/notes/${noteId}/upload-file`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      toast.success('Document uploaded successfully');
      onNoteUpdate?.(data.note || { ...note, has_uploaded_file: true, uploaded_file_name: file.name });
      await loadChatHistory();
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !noteId) return;
    const question = input.trim();
    setInput('');
    setMessages((m) => [...m, { id: Date.now(), isUser: true, text: question }]);
    setLoading(true);
    try {
      const res = await makeAuthenticatedRequest(`/notes/${noteId}/ask`, {
        method: 'POST',
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { id: Date.now() + 1, isUser: false, text: data.answer }]);
    } catch (err) {
      toast.error(err.message || 'Failed to get AI response');
      setMessages((m) => [...m, { id: Date.now() + 1, isUser: false, text: 'Sorry, I could not answer that right now.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!noteId || !hasFile) {
      toast.error('Upload a document first');
      return;
    }
    setGeneratingQuiz(true);
    try {
      const res = await makeAuthenticatedRequest(`/notes/${noteId}/generate-quiz`, { method: 'POST' });
      const data = await res.json();
      setQuiz(data.questions || []);
      setQuizIndex(0);
      setQuizScore(0);
      setQuizDone(false);
      setSelectedOption(null);
      toast.success('Quiz generated!');
    } catch (err) {
      toast.error(err.message || 'Quiz generation failed');
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleQuizAnswer = (idx) => {
    if (selectedOption !== null || !quiz?.length) return;
    const current = quiz[quizIndex];
    const correct = current.correct_answer ?? current.correctAnswer ?? 0;
    setSelectedOption(idx);
    if (idx === correct) setQuizScore((s) => s + 1);
    setTimeout(() => {
      if (quizIndex + 1 < quiz.length) {
        setQuizIndex((i) => i + 1);
        setSelectedOption(null);
      } else {
        setQuizDone(true);
      }
    }, 900);
  };

  const handleGenerateAudio = async () => {
    if (!noteId || !hasFile) {
      toast.error('Upload a document first');
      return;
    }
    setGeneratingAudio(true);
    try {
      const res = await makeAuthenticatedRequest(`/notes/${noteId}/generate-audio`, { method: 'POST' });
      const data = await res.json();
      setAudioScript(data);
      toast.success('Audio script generated');
    } catch (err) {
      toast.error(err.message || 'Audio generation failed');
    } finally {
      setGeneratingAudio(false);
    }
  };

  return (
    <Container>
      <Grid>
        <Panel>
          <PanelHeader>AI Document Chat</PanelHeader>
          {!hasFile ? (
            <UploadArea>
              <input type="file" accept=".pdf,.doc,.docx,.txt" hidden onChange={handleFileUpload} disabled={uploading} />
              <FaFileUpload size={28} color="#2563eb" />
              <p style={{ marginTop: 12, fontWeight: 600, color: '#2563eb' }}>
                {uploading ? 'Uploading...' : 'Upload PDF, DOC, DOCX or TXT'}
              </p>
              <p style={{ marginTop: 6, fontSize: '0.85rem', color: '#64748b' }}>
                AI will analyze your document for Q&A, quizzes, and audio scripts
              </p>
            </UploadArea>
          ) : (
            <>
              <FileBadge style={{ margin: '16px 20px 0' }}>
                <span>{note.uploaded_file_name || 'Document attached'}</span>
              </FileBadge>
              <ChatArea ref={chatRef}>
                {messages.length === 0 && (
                  <p style={{ color: '#64748b', textAlign: 'center', marginTop: 40 }}>
                    Ask anything about your uploaded document
                  </p>
                )}
                {messages.map((msg) => (
                  <Message key={msg.id} $isUser={msg.isUser}>
                    <Avatar $isUser={msg.isUser}>
                      {msg.isUser ? <FaUserCircle /> : <FaRobot />}
                    </Avatar>
                    <Bubble $isUser={msg.isUser}>{msg.text}</Bubble>
                  </Message>
                ))}
                {loading && (
                  <Message $isUser={false}>
                    <Avatar $isUser={false}><FaRobot /></Avatar>
                    <Bubble $isUser={false}>Thinking...</Bubble>
                  </Message>
                )}
              </ChatArea>
              <ChatInputArea>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your document..."
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  disabled={loading}
                />
                <Button onClick={handleSend} disabled={loading || !input.trim()}>Ask</Button>
              </ChatInputArea>
            </>
          )}
        </Panel>

        <Panel>
          <PanelHeader>Learning Tools</PanelHeader>
          <SideCard>
            <Button onClick={handleGenerateQuiz} disabled={generatingQuiz || !hasFile} style={{ width: '100%', justifyContent: 'center' }}>
              <FaQuestionCircle /> {generatingQuiz ? 'Generating...' : 'Generate Quiz'}
            </Button>
          </SideCard>
          <SideCard>
            <Button onClick={handleGenerateAudio} disabled={generatingAudio || !hasFile} style={{ width: '100%', justifyContent: 'center' }}>
              <FaVolumeUp /> {generatingAudio ? 'Generating...' : 'Audio Overview Script'}
            </Button>
          </SideCard>

          {quiz?.length > 0 && (
            <QuizBlock>
              {quizDone ? (
                <p style={{ fontWeight: 700, color: '#4f46e5', textAlign: 'center' }}>
                  Score: {quizScore} / {quiz.length}
                </p>
              ) : (
                <>
                  <p style={{ fontWeight: 600, marginBottom: 8 }}>
                    Q{quizIndex + 1}. {quiz[quizIndex]?.question}
                  </p>
                  {(quiz[quizIndex]?.options || []).map((opt, idx) => (
                    <OptionBtn
                      key={idx}
                      className={
                        selectedOption !== null
                          ? idx === (quiz[quizIndex].correct_answer ?? quiz[quizIndex].correctAnswer)
                            ? 'correct'
                            : idx === selectedOption
                            ? 'incorrect'
                            : ''
                          : ''
                      }
                      onClick={() => handleQuizAnswer(idx)}
                      disabled={selectedOption !== null}
                    >
                      {opt}
                    </OptionBtn>
                  ))}
                </>
              )}
            </QuizBlock>
          )}

          {audioScript && (
            <QuizBlock>
              <p style={{ fontWeight: 600, marginBottom: 8 }}>Podcast Script</p>
              <p style={{ fontSize: '0.85rem', color: '#475569', whiteSpace: 'pre-wrap' }}>
                <strong>Host:</strong> {audioScript.host_script}
                {'\n\n'}
                <strong>Expert:</strong> {audioScript.expert_script}
              </p>
            </QuizBlock>
          )}
        </Panel>
      </Grid>
    </Container>
  );
};

export default NoteChat;
