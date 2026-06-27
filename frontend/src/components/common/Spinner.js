import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const Spinner = styled.div`
  width: ${(p) => p.size || '36px'};
  height: ${(p) => p.size || '36px'};
  border: 3px solid ${(p) => p.theme?.colors?.border || '#e2e8f0'};
  border-top-color: ${(p) => p.theme?.colors?.primary || '#4f46e5'};
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

export default Spinner;
