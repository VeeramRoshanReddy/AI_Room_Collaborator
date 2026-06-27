import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaPlus, FaChevronLeft, FaEllipsisV, FaTrash, FaFileAlt } from 'react-icons/fa';
import { useUserContext } from '../../context/UserContext';
import { toast } from 'react-toastify';
import NoteChat from './NoteChat';

const Container = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const Title = styled.h1`
  font-size: 1.75rem;
  font-weight: 800;
  color: #0f172a;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #4f46e5, #2563eb);
  color: white;
  font-weight: 600;
  cursor: pointer;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
`;

const Card = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: transform 0.2s, box-shadow 0.2s;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
  }
`;

const CardTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
  padding-right: 28px;
`;

const CardDesc = styled.p`
  color: #64748b;
  font-size: 0.9rem;
  line-height: 1.5;
  flex: 1;
`;

const CardMeta = styled.span`
  font-size: 0.8rem;
  color: #94a3b8;
`;

const EnterBtn = styled.button`
  margin-top: 8px;
  padding: 10px;
  border: none;
  border-radius: 10px;
  background: #eff6ff;
  color: #2563eb;
  font-weight: 600;
  cursor: pointer;
  &:hover { background: #dbeafe; }
`;

const MenuBtn = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  border: none;
  background: none;
  color: #94a3b8;
  cursor: pointer;
`;

const Menu = styled.div`
  position: absolute;
  top: 42px;
  right: 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(15,23,42,0.1);
  z-index: 10;
  overflow: hidden;
`;

const MenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 14px;
  border: none;
  background: none;
  color: #dc2626;
  cursor: pointer;
  font-weight: 500;
  &:hover { background: #fef2f2; }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15,23,42,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: white;
  border-radius: 16px;
  padding: 28px;
  width: 90%;
  max-width: 440px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  margin-top: 12px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px;
  margin-top: 12px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  min-height: 100px;
  resize: vertical;
  font-family: inherit;
`;

const BackBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: none;
  color: #4f46e5;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 16px;
`;

const Empty = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
`;

const PersonalWork = () => {
  const { makeAuthenticatedRequest, isAuthenticated } = useUserContext();
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [menuId, setMenuId] = useState(null);
  const [creating, setCreating] = useState(false);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await makeAuthenticatedRequest('/notes/my-notes');
      const data = await res.json();
      setNotes(Array.isArray(data) ? data : data.notes || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load notes');
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchNotes();
    // fetchNotes only closes over stable setters/makeAuthenticatedRequest;
    // re-run only when auth state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    setCreating(true);
    try {
      const res = await makeAuthenticatedRequest('/notes/create', {
        method: 'POST',
        body: JSON.stringify({ title: title.trim(), content: description, description }),
      });
      const note = await res.json();
      setNotes((prev) => [note, ...prev]);
      setShowCreate(false);
      setTitle('');
      setDescription('');
      toast.success('Note created');
    } catch (err) {
      toast.error(err.message || 'Failed to create note');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await makeAuthenticatedRequest(`/notes/${id}`, { method: 'DELETE' });
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (selectedNote?.id === id) setSelectedNote(null);
      toast.success('Note deleted');
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
    setMenuId(null);
  };

  if (!isAuthenticated) {
    return <Empty>Please log in to access your notes.</Empty>;
  }

  if (selectedNote) {
    return (
      <Container>
        <BackBtn onClick={() => setSelectedNote(null)}>
          <FaChevronLeft /> Back to notes
        </BackBtn>
        <h2 style={{ marginBottom: 16, color: '#0f172a' }}>{selectedNote.title}</h2>
        <NoteChat
          note={selectedNote}
          onNoteUpdate={(updated) => {
            setSelectedNote((prev) => ({ ...prev, ...updated }));
            setNotes((prev) => prev.map((n) => (n.id === updated.id ? { ...n, ...updated } : n)));
          }}
        />
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Personal Notes</Title>
        <Button onClick={() => setShowCreate(true)}>
          <FaPlus /> New Note
        </Button>
      </Header>

      {loading ? (
        <Empty>Loading notes...</Empty>
      ) : notes.length === 0 ? (
        <Empty>
          <FaFileAlt size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p>No notes yet. Create your first note to get started.</p>
        </Empty>
      ) : (
        <Grid>
          {notes.map((note) => (
            <Card key={note.id}>
              <MenuBtn onClick={() => setMenuId(menuId === note.id ? null : note.id)}>
                <FaEllipsisV />
              </MenuBtn>
              {menuId === note.id && (
                <Menu>
                  <MenuItem onClick={() => handleDelete(note.id)}>
                    <FaTrash /> Delete
                  </MenuItem>
                </Menu>
              )}
              <CardTitle>{note.title}</CardTitle>
              <CardDesc>{note.description || 'No description'}</CardDesc>
              <CardMeta>
                {note.created_at ? note.created_at.slice(0, 10) : ''}
                {note.has_uploaded_file ? ' · Document attached' : ''}
              </CardMeta>
              <EnterBtn onClick={() => setSelectedNote(note)}>Open Note</EnterBtn>
            </Card>
          ))}
        </Grid>
      )}

      {showCreate && (
        <Overlay onClick={() => setShowCreate(false)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: 4 }}>Create Note</h3>
            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <TextArea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
            <Button style={{ marginTop: 16, width: '100%', justifyContent: 'center' }} onClick={handleCreate} disabled={creating}>
              {creating ? 'Creating...' : 'Create Note'}
            </Button>
          </Modal>
        </Overlay>
      )}
    </Container>
  );
};

export default PersonalWork;
