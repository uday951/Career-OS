import { useState } from 'react';
import API_BASE from '../config/api';

export default function useClaudeStream(token) {
  const [streamedText, setStreamedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const startStream = async (sessionId, sectionName, sectionContent) => {
    setIsStreaming(true);
    setStreamedText('');

    try {
      const response = await fetch(`${API_BASE}/api/resume/optimize/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sessionId, sectionName, sectionContent })
      });

      if (!response.body) {
        throw new Error('Readable stream not supported.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let finished = false;
      let accumulator = '';

      while (!finished) {
        const { done, value } = await reader.read();
        if (done) {
          finished = true;
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') {
              finished = true;
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                accumulator += parsed.text;
                setStreamedText(accumulator);
              }
            } catch (e) {
              // Ignore partial JSON chunks
            }
          }
        }
      }
    } catch (error) {
      console.error('SSE Stream Error:', error);
    } finally {
      setIsStreaming(false);
    }
  };

  return { streamedText, isStreaming, startStream, setStreamedText };
}
