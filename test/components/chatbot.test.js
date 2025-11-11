// test/components/chatbot.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HuggingFaceChatbot } from '@/components/huggingface-chatbot';

// Mock fetch
global.fetch = jest.fn();

describe('HuggingFaceChatbot Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should render welcome message', async () => {
    render(<HuggingFaceChatbot />);
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /MindMend/i })).toBeInTheDocument();
    });
  });

  it('should display user message after submission', async () => {
    global.fetch.mockResolvedValueOnce({
      json: async () => ({
        id: '123',
        role: 'assistant',
        content: 'Hello! How can I help?'
      })
    });

    render(<HuggingFaceChatbot />);
    
    const input = screen.getByPlaceholderText(/Message MindMend/i);
    const submitButton = screen.getByRole('button', { type: 'submit' });

    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });
  });

  it('should show loading indicator while processing', async () => {
    global.fetch.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        json: async () => ({ id: '123', role: 'assistant', content: 'Response' })
      }), 100))
    );

    render(<HuggingFaceChatbot />);
    
    const input = screen.getByPlaceholderText(/Message MindMend/i);
    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.submit(input.closest('form'));

    await waitFor(() => {
      const loadingDots = screen.getAllByRole('generic').filter(el => 
        el.className.includes('animate-bounce')
      );
      expect(loadingDots.length).toBeGreaterThan(0);
    });
  });

  it('should extract and store user name', async () => {
    global.fetch.mockResolvedValueOnce({
      json: async () => ({
        id: '123',
        role: 'assistant',
        content: 'Nice to meet you, John!'
      })
    });

    render(<HuggingFaceChatbot />);
    
    const input = screen.getByPlaceholderText(/Message MindMend/i);
    fireEvent.change(input, { target: { value: 'My name is John' } });
    fireEvent.submit(input.closest('form'));

    await waitFor(() => {
      expect(localStorage.getItem('mindmend_user_name')).toBe('John');
    });
  });

  it('should handle API errors gracefully', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<HuggingFaceChatbot />);
    
    const input = screen.getByPlaceholderText(/Message MindMend/i);
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.submit(input.closest('form'));

    await waitFor(() => {
      expect(screen.getByText(/having trouble connecting/i)).toBeInTheDocument();
    });
  });

  it('should disable input while loading', async () => {
    global.fetch.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        json: async () => ({ id: '123', role: 'assistant', content: 'Response' })
      }), 100))
    );

    render(<HuggingFaceChatbot />);
    
    const input = screen.getByPlaceholderText(/Message MindMend/i);
    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.submit(input.closest('form'));

    expect(input).toBeDisabled();

    await waitFor(() => {
      expect(input).not.toBeDisabled();
    });
  });
});
