export const API_BASE =
  process.env.REACT_APP_API_URL || 'https://ai-room-collaborator.onrender.com/api/v1';

export const getWsBaseUrl = () => {
  if (process.env.REACT_APP_WS_URL) {
    return process.env.REACT_APP_WS_URL.replace(/\/$/, '');
  }
  const api = API_BASE.replace(/\/api\/v1\/?$/, '');
  return api.replace(/^http/, 'ws');
};

export const buildWsUrl = (roomId, topicId, token) =>
  `${getWsBaseUrl()}/${roomId}/${topicId}?token=${encodeURIComponent(token)}`;

export const formatTopicDate = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
};
